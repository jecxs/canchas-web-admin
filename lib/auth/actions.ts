'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { resolveLocalDestination } from './access'
import { ACTIVE_LOCAL_COOKIE, ACTIVE_LOCAL_COOKIE_OPTIONS, requireOwner } from './dal'

export async function selectActiveLocalAction(localId: string) {
  const context = await requireOwner()
  const local = context.locals.find((candidate) => candidate.id === localId)

  if (!local) {
    throw new Error('No tienes acceso al local seleccionado.')
  }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_LOCAL_COOKIE, local.id, ACTIVE_LOCAL_COOKIE_OPTIONS)

  // Las sedes en revisión o rechazadas no deben sacar al dueño del panel:
  // con varias sedes necesita poder volver a una operativa desde "Sedes".
  if (local.estado === 'pendiente_aprobacion' || local.estado === 'rechazado') {
    redirect('/panel/sedes')
  }

  // Un local ya aprobado y con suscripción activa necesita configuración, no
  // volver a la pantalla de contratación.
  if (
    local.estado === 'aprobado_pendiente_pago'
    && context.subscription?.estado_facturacion === 'activa'
  ) {
    redirect('/panel/configuracion')
  }

  redirect(resolveLocalDestination(local))
}

export async function signOutAction() {
  const supabase = await createClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()

  if (claimsError || !claimsData?.claims?.sub) {
    redirect('/registro')
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('[auth:sign-out]', { code: error.code })
    throw new Error('No se pudo cerrar la sesión. Inténtalo nuevamente.')
  }

  redirect('/registro')
}
