import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  findLocalWithState,
  OPERATIONAL_LOCAL_STATES,
  resolveActiveLocal,
  resolveLocalDestination,
  resolvePostLoginDestination,
  type AccessContext,
  type LocalState,
} from './access'

export const ACTIVE_LOCAL_COOKIE = 'grassly_active_local'

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
            'id,nombre,direccion,ruc,estado,fecha_fin_trial,motivo_rechazo,publicado,publicado_at,created_at',
          )
          .eq('dueno_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('suscripciones')
          .select('id,estado,fecha_proximo_cobro,monto,sedes_extra_contratadas')
          .eq('dueno_id', userId)
          .maybeSingle(),
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
      locals: locals ?? [],
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

export async function requireOwnerLocal(states: readonly LocalState[]) {
  const { context, activeLocal } = await getOwnerShellContext()
  const local =
    activeLocal && states.includes(activeLocal.estado) ? activeLocal : null

  if (!local) {
    if (activeLocal) {
      redirect(resolveLocalDestination(activeLocal.estado))
    }

    redirect(resolvePostLoginDestination(context))
  }
  return { context, local }
}

export function requireOperationalOwnerLocal() {
  return requireOwnerLocal(OPERATIONAL_LOCAL_STATES)
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
