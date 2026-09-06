'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { resolveLocalDestination } from './access'
import { ACTIVE_LOCAL_COOKIE, requireOwner } from './dal'

export async function selectActiveLocalAction(localId: string) {
  const context = await requireOwner()
  const local = context.locals.find((candidate) => candidate.id === localId)

  if (!local) {
    throw new Error('No tienes acceso al local seleccionado.')
  }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_LOCAL_COOKIE, local.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  redirect(resolveLocalDestination(local.estado))
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
