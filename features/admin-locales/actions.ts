'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { getAccessContext } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { adminLocalMessages, translateAdminLocalError } from './messages'
import {
  localIdSchema,
  localPublicationSchema,
  localRejectionSchema,
  localTrialSchema,
} from './schema'
import type { AdminLocalActionState } from './types'

async function authorizeAdmin(): Promise<AdminLocalActionState | null> {
  const context = await getAccessContext()
  if (!context) return { success: false, message: adminLocalMessages.sessionExpired }
  if (context.profile.rol !== 'super_admin') {
    return { success: false, message: adminLocalMessages.permissionDenied }
  }
  return null
}

function validationFailure(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> }
}): AdminLocalActionState {
  return {
    success: false,
    message: adminLocalMessages.invalidFields,
    fieldErrors: error.flatten().fieldErrors,
  }
}

function revalidateLocal(localId: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/locales')
  revalidatePath(`/admin/locales/${localId}`)
}

export async function changeLocalPublicationAction(
  _state: AdminLocalActionState,
  formData: FormData,
): Promise<AdminLocalActionState> {
  const authorizationError = await authorizeAdmin()
  if (authorizationError) return authorizationError

  const validation = localPublicationSchema.safeParse({
    localId: formData.get('localId'),
    published: formData.get('published'),
  })
  if (!validation.success) return validationFailure(validation.error)

  const supabase = await createClient()
  const { error } = await supabase.rpc('cambiar_publicacion_local', {
    p_local_id: validation.data.localId,
    p_publicado: validation.data.published,
  })

  if (error) {
    console.error('[admin-locales:publication]', { code: error.code })
    return { success: false, message: translateAdminLocalError(error) }
  }

  revalidateLocal(validation.data.localId)
  return { success: true, message: adminLocalMessages.publicationUpdated }
}

export async function approveLocalForPaymentAction(
  _state: AdminLocalActionState,
  formData: FormData,
): Promise<AdminLocalActionState> {
  const authorizationError = await authorizeAdmin()
  if (authorizationError) return authorizationError

  const validation = localIdSchema.safeParse({ localId: formData.get('localId') })
  if (!validation.success) return validationFailure(validation.error)

  const supabase = await createClient()
  const { error } = await supabase.rpc('aprobar_solicitud_local', {
    p_local_id: validation.data.localId,
  })

  if (error) {
    console.error('[admin-locales:approve]', { code: error.code })
    return { success: false, message: translateAdminLocalError(error) }
  }

  revalidateLocal(validation.data.localId)
  return { success: true, message: adminLocalMessages.approvedForPayment }
}

export async function grantLocalTrialAction(
  _state: AdminLocalActionState,
  formData: FormData,
): Promise<AdminLocalActionState> {
  const authorizationError = await authorizeAdmin()
  if (authorizationError) return authorizationError

  const validation = localTrialSchema.safeParse({
    localId: formData.get('localId'),
    days: formData.get('days'),
  })
  if (!validation.success) return validationFailure(validation.error)

  const supabase = await createClient()
  const { error } = await supabase.rpc('otorgar_trial_local', {
    p_local_id: validation.data.localId,
    p_dias: validation.data.days,
  })

  if (error) {
    console.error('[admin-locales:trial]', { code: error.code })
    return { success: false, message: translateAdminLocalError(error) }
  }

  revalidateLocal(validation.data.localId)
  return { success: true, message: adminLocalMessages.trialGranted }
}

export async function rejectLocalAction(
  _state: AdminLocalActionState,
  formData: FormData,
): Promise<AdminLocalActionState> {
  const authorizationError = await authorizeAdmin()
  if (authorizationError) return authorizationError

  const validation = localRejectionSchema.safeParse({
    localId: formData.get('localId'),
    reason: formData.get('reason'),
  })
  if (!validation.success) return validationFailure(validation.error)

  const supabase = await createClient()
  const { error } = await supabase.rpc('rechazar_solicitud_local', {
    p_local_id: validation.data.localId,
    p_motivo: validation.data.reason,
  })

  if (error) {
    console.error('[admin-locales:reject]', { code: error.code })
    return { success: false, message: translateAdminLocalError(error) }
  }

  revalidateLocal(validation.data.localId)
  return { success: true, message: adminLocalMessages.rejected }
}
