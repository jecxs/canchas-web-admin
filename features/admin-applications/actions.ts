'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAccessContext } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { adminApplicationMessages, translateAdminDecisionError } from './messages'
import { applicationIdSchema, rejectionDecisionSchema, trialDecisionSchema } from './schema'
import type { AdminDecisionState } from './types'

async function authorizeAdmin(): Promise<AdminDecisionState | null> {
  const context = await getAccessContext()
  if (!context) return { success: false, message: adminApplicationMessages.sessionExpired }
  if (context.profile.rol !== 'super_admin') {
    return { success: false, message: adminApplicationMessages.permissionDenied }
  }
  return null
}

function validationFailure(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }): AdminDecisionState {
  return {
    success: false,
    message: adminApplicationMessages.invalidFields,
    fieldErrors: error.flatten().fieldErrors,
  }
}

async function finishDecision(result: string): Promise<never> {
  revalidatePath('/admin/solicitudes')
  redirect(`/admin/solicitudes?resultado=${result}`)
}

export async function approveForPaymentAction(
  _state: AdminDecisionState,
  formData: FormData,
): Promise<AdminDecisionState> {
  const authorizationError = await authorizeAdmin()
  if (authorizationError) return authorizationError

  const validation = applicationIdSchema.safeParse({ localId: formData.get('localId') })
  if (!validation.success) return validationFailure(validation.error)

  const supabase = await createClient()
  const { error } = await supabase.rpc('aprobar_solicitud_local', {
    p_local_id: validation.data.localId,
  })

  if (error) {
    console.error('[admin-applications:approve]', { code: error.code })
    return { success: false, message: translateAdminDecisionError(error) }
  }

  return finishDecision('aprobada')
}

export async function grantTrialAction(
  _state: AdminDecisionState,
  formData: FormData,
): Promise<AdminDecisionState> {
  const authorizationError = await authorizeAdmin()
  if (authorizationError) return authorizationError

  const validation = trialDecisionSchema.safeParse({
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
    console.error('[admin-applications:trial]', { code: error.code })
    return { success: false, message: translateAdminDecisionError(error) }
  }

  return finishDecision('trial')
}

export async function rejectApplicationAction(
  _state: AdminDecisionState,
  formData: FormData,
): Promise<AdminDecisionState> {
  const authorizationError = await authorizeAdmin()
  if (authorizationError) return authorizationError

  const validation = rejectionDecisionSchema.safeParse({
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
    console.error('[admin-applications:reject]', { code: error.code })
    return { success: false, message: translateAdminDecisionError(error) }
  }

  return finishDecision('rechazada')
}
