import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  canConfigurePaidPendingLocal,
  canOperateLocal,
  findLocalWithState,
  moderationBlocksOperation,
  resolveActiveLocal,
  resolveLocalDestination,
  resolvePostLoginDestination,
  type AccessContext,
  type LocalModeration,
  type LocalState,
} from './access'

export const ACTIVE_LOCAL_COOKIE = 'grassly_active_local'

export const ACTIVE_LOCAL_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
}

export const getAccessContext = cache(
  async (): Promise<AccessContext | null> => {
    const supabase = await createClient()
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims()

    const userId = claimsData?.claims?.sub
    if (claimsError || !userId) {
      return null
    }

    const [
      { data: profile, error: profileError },
      { data: locals, error: localsError },
      { data: subscription, error: subscriptionError },
      { data: moderations, error: moderationsError },
    ] =
      await Promise.all([
        supabase
          .from('perfiles')
          .select('id,nombre_completo,email,telefono,dni,rol')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('locales')
          .select(
            'id,nombre,direccion,ruc,estado,fecha_fin_trial,motivo_rechazo,publicado,publicado_at,porcentaje_adelanto,created_at,suspendido_por_facturacion',
          )
          .eq('dueno_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('suscripciones')
          .select('id,estado,estado_facturacion,gracia_hasta,fecha_proximo_cobro,monto,sedes_extra_contratadas')
          .eq('dueno_id', userId)
          .maybeSingle(),
        supabase.rpc('moderacion_listar_activas_propietario'),
      ])

    if (profileError) {
      console.error('[auth-dal:profile]', { code: profileError.code })
      throw new Error('No se pudo cargar la información de la cuenta.')
    }

    if (localsError) {
      console.error('[auth-dal:locals]', { code: localsError.code })
      throw new Error('No se pudo cargar la información de la cuenta.')
    }


    if (subscriptionError) {
      console.error('[auth-dal:subscription]', { code: subscriptionError.code })
      throw new Error('No se pudo cargar la información de la cuenta.')
    }

    if (moderationsError) {
      console.error('[auth-dal:moderations]', { code: moderationsError.code })
      throw new Error('No se pudo cargar el estado administrativo de los locales.')
    }

    if (!profile) {
      throw new Error('La sesión no tiene un perfil de Grassly asociado.')
    }

    const metadata = claimsData.claims.user_metadata
    const avatarCandidate = metadata?.avatar_url ?? metadata?.picture

    return {
      userId,
      avatarUrl:
        typeof avatarCandidate === 'string' ? avatarCandidate : null,
      profile,
      locals: (locals ?? []).map((local) => {
        const moderation = moderations?.find((item) => item.local_id === local.id)
        return {
          ...local,
          moderation: moderation
            ? {
                id: moderation.id,
                type: moderation.tipo as LocalModeration['type'],
                reason: moderation.motivo,
                startsAt: moderation.vigente_desde,
                endsAt: moderation.vigente_hasta,
              }
            : null,
        }
      }),
      subscription,
    }
  },
)

export async function requireAuthenticated() {
  const context = await getAccessContext()
  if (!context) {
    redirect('/registro')
  }
  return context
}

export async function redirectAuthenticatedUser() {
  const context = await getAccessContext()
  if (context) {
    redirect(resolvePostLoginDestination(context))
  }
}

export async function redirectToPostLoginDestination(): Promise<never> {
  const context = await requireAuthenticated()
  redirect(resolvePostLoginDestination(context))
}

export async function requireAdmin() {
  const context = await requireAuthenticated()
  if (context.profile.rol !== 'super_admin') {
    redirect(resolvePostLoginDestination(context))
  }
  return context
}

export async function requireOwner() {
  const context = await requireAuthenticated()
  if (context.profile.rol !== 'dueno') {
    redirect(resolvePostLoginDestination(context))
  }
  return context
}

// Comprobación de rol para server actions de administración. Devuelve `false`
// tanto si no hay sesión como si el usuario no es superadministrador.
export async function isSuperAdmin() {
  const context = await getAccessContext()
  return context?.profile.rol === 'super_admin'
}

// Autoriza escrituras operativas de un local: su dueño (con local operativo) o
// cualquier superadministrador. Las RPC de la base validan la misma regla.
export async function authorizeLocalWrite(localId: string) {
  const context = await getAccessContext()
  if (!context) return false
  if (context.profile.rol === 'super_admin') return true
  return context.locals.some(
    (local) => local.id === localId && canOperateLocal(local, context.subscription),
  )
}

// Permiso transitorio y deliberadamente estrecho: después de cobrar, un local
// aún sin coordenadas puede abrir solo su configuración general. La base vuelve
// a comprobar el entitlement antes de promoverlo a operativo.
export async function authorizeLocalConfiguration(localId: string) {
  const context = await getAccessContext()
  if (!context) return false
  if (context.profile.rol === 'super_admin') return true
  const local = context.locals.find((candidate) => candidate.id === localId)
  return Boolean(
    local &&
      (canOperateLocal(local, context.subscription) ||
        canConfigurePaidPendingLocal(context, local)),
  )
}

export async function requireOwnerLocal(states: readonly LocalState[]) {
  const { context, activeLocal } = await getOwnerShellContext()
  const local =
    activeLocal && (
      states.includes(activeLocal.estado)
      || (states.includes('suspendido') && moderationBlocksOperation(activeLocal.moderation))
    ) ? activeLocal : null

  if (!local) {
    if (activeLocal) {
      const hasAnotherOperationalLocal = context.locals.some(
        (candidate) => candidate.id !== activeLocal.id && canOperateLocal(candidate, context.subscription),
      )
      if (hasAnotherOperationalLocal) {
        redirect('/panel/sedes')
      }
      redirect(resolveLocalDestination(activeLocal))
    }

    redirect(resolvePostLoginDestination(context))
  }
  return { context, local }
}

export async function requireOperationalOwnerLocal() {
  const { context, activeLocal } = await getOwnerShellContext()
  if (activeLocal && canOperateLocal(activeLocal, context.subscription)) {
    return { context, local: activeLocal }
  }

  if (canConfigurePaidPendingLocal(context, activeLocal)) {
    redirect('/panel/configuracion')
  }

  if (activeLocal) {
    // Si la sede guardada no es operativa pero otra sí lo es, no redirigimos a
    // /panel (bucle). Llevamos al listado de sedes para que el dueño elija.
    const hasAnotherOperationalLocal = context.locals.some(
      (local) => local.id !== activeLocal.id && canOperateLocal(local, context.subscription),
    )
    if (hasAnotherOperationalLocal) {
      redirect('/panel/sedes')
    }

    redirect(resolveLocalDestination(activeLocal))
  }
  redirect(resolvePostLoginDestination(context))
}

export async function requireConfigurableOwnerLocal() {
  const { context, activeLocal } = await getOwnerShellContext()
  if (
    activeLocal &&
    (canOperateLocal(activeLocal, context.subscription) ||
      canConfigurePaidPendingLocal(context, activeLocal))
  ) {
    return { context, local: activeLocal }
  }

  if (activeLocal) {
    redirect(resolvePostLoginDestination(context))
  }
  redirect(resolvePostLoginDestination(context))
}

export async function getOwnerShellContext() {
  const context = await requireOwner()
  const cookieStore = await cookies()
  const activeLocal = resolveActiveLocal(
    context.locals,
    cookieStore.get(ACTIVE_LOCAL_COOKIE)?.value,
  )

  return { context, activeLocal }
}

export async function requireApplicationContext() {
  const context = await requireAuthenticated()
  const local = findLocalWithState(context, [
    'pendiente_aprobacion',
    'rechazado',
  ])

  if (context.profile.rol === 'super_admin' || !local) {
    redirect(resolvePostLoginDestination(context))
  }

  return { context, local }
}
