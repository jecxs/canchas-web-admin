'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { getAccessContext } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { adminLocalMessages, translateAdminLocalError } from './messages'
import {
  localIdSchema,
  liftLocalModerationSchema,
  localModerationSchema,
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

export async function reactivateLocalTrialAction(
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
  const { error } = await supabase.rpc('billing_reactivar_local_con_trial', {
    p_local_id: validation.data.localId,
    p_dias: validation.data.days,
  })

  if (error) {
    console.error('[admin-locales:reactivate]', { code: error.code })
    return { success: false, message: translateAdminLocalError(error) }
  }

  revalidateLocal(validation.data.localId)
  return { success: true, message: adminLocalMessages.reactivatedWithTrial }
}

export async function applyLocalModerationAction(
  _state: AdminLocalActionState,
  formData: FormData,
): Promise<AdminLocalActionState> {
  const authorizationError = await authorizeAdmin()
  if (authorizationError) return authorizationError

  const validation = localModerationSchema.safeParse({
    localId: formData.get('localId'),
    type: formData.get('type'),
    reason: formData.get('reason'),
    internalNotes: formData.get('internalNotes'),
    endsAt: formData.get('endsAt') || undefined,
  })
  if (!validation.success) return validationFailure(validation.error)

  const supabase = await createClient()
  const { error } = await supabase.rpc('moderacion_aplicar_medida', {
    p_local_id: validation.data.localId,
    p_tipo: validation.data.type,
    p_motivo: validation.data.reason,
    p_notas_internas: validation.data.internalNotes || null,
    // El panel opera en Perú; datetime-local no incluye zona horaria.
    p_vigente_hasta: validation.data.endsAt
      ? new Date(`${validation.data.endsAt}:00-05:00`).toISOString()
      : null,
  })

  if (error) {
    console.error('[admin-locales:moderation-apply]', { code: error.code })
    return { success: false, message: translateAdminLocalError(error) }
  }

  revalidateLocal(validation.data.localId)
  revalidatePath('/panel')
  revalidatePath('/panel/suspendido')
  return { success: true, message: 'La medida administrativa fue aplicada.' }
}

export async function liftLocalModerationAction(
  _state: AdminLocalActionState,
  formData: FormData,
): Promise<AdminLocalActionState> {
  const authorizationError = await authorizeAdmin()
  if (authorizationError) return authorizationError

  const validation = liftLocalModerationSchema.safeParse({
    localId: formData.get('localId'),
    reason: formData.get('reason'),
  })
  if (!validation.success) return validationFailure(validation.error)

  const supabase = await createClient()
  const { error } = await supabase.rpc('moderacion_levantar_medida', {
    p_local_id: validation.data.localId,
    p_motivo: validation.data.reason || null,
  })

  if (error) {
    console.error('[admin-locales:moderation-lift]', { code: error.code })
    return { success: false, message: translateAdminLocalError(error) }
  }

  revalidateLocal(validation.data.localId)
  revalidatePath('/panel')
  revalidatePath('/panel/suspendido')
  return { success: true, message: 'La medida administrativa fue levantada.' }
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
