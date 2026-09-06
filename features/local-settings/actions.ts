'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import {
  commercialSettingsSchema,
  generalSettingsSchema,
  paymentTypeSchema,
  scheduleSettingsSchema,
} from './schema'
import type { SettingsActionState } from './types'

const messages = {
  saved: 'Cambios guardados',
  invalid: 'Revisa los campos indicados',
  denied: 'No tienes permiso para realizar esta acción',
  failed: 'No se pudo completar la operación',
} as const

function validationFailure(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }): SettingsActionState {
  return { success: false, message: messages.invalid, fieldErrors: error.flatten().fieldErrors }
}

async function activeLocalMatches(localId: unknown) {
  const { local } = await requireOperationalOwnerLocal()
  return typeof localId === 'string' && local.id === localId ? local : null
}

function databaseFailure(error: { code?: string } | null, scope: string): SettingsActionState {
  console.error(`[local-settings:${scope}]`, { code: error?.code })
  if (error?.code === '42501') return { success: false, message: messages.denied }
  if (['22P02', '23514', 'P0001'].includes(error?.code ?? '')) {
    return { success: false, message: messages.invalid }
  }
  return { success: false, message: messages.failed }
}

function saved(): SettingsActionState {
  revalidatePath('/panel')
  revalidatePath('/panel/configuracion')
  return { success: true, message: messages.saved }
}

export async function saveGeneralSettingsAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const raw = {
    localId: formData.get('localId'),
    name: formData.get('name'),
    description: formData.get('description'),
    ruc: formData.get('ruc'),
    primaryPhone: formData.get('primaryPhone'),
    secondaryPhone: formData.get('secondaryPhone'),
    address: formData.get('address'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
  }
  const validation = generalSettingsSchema.safeParse(raw)
  if (!validation.success) return validationFailure(validation.error)
  if (!await activeLocalMatches(validation.data.localId)) return { success: false, message: messages.denied }

  const supabase = await createClient()
  const { error } = await supabase.rpc('actualizar_datos_generales_local', {
    p_local_id: validation.data.localId,
    p_nombre: validation.data.name,
    p_descripcion: validation.data.description,
    p_ruc: validation.data.ruc,
    p_telefono_principal: validation.data.primaryPhone,
    p_telefono_secundario: validation.data.secondaryPhone,
    p_direccion: validation.data.address,
    p_latitud: validation.data.latitude,
    p_longitud: validation.data.longitude,
  })
  return error ? databaseFailure(error, 'general') : saved()
}

export async function saveCommercialSettingsAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const selected = formData.getAll('paymentMethod').flatMap((value) => {
    const type = paymentTypeSchema.safeParse(value)
    if (!type.success) return []
    return [{ tipo: type.data, detalle: formData.get(`payment_${type.data}`) }]
  })
  const validation = commercialSettingsSchema.safeParse({
    localId: formData.get('localId'),
    advancePercentage: formData.get('advancePercentage'),
    refundPolicy: formData.get('refundPolicy'),
    paymentMethods: selected,
  })
  if (!validation.success) return validationFailure(validation.error)
  if (!await activeLocalMatches(validation.data.localId)) return { success: false, message: messages.denied }

  const supabase = await createClient()
  const { error } = await supabase.rpc('actualizar_reglas_comerciales_local', {
    p_local_id: validation.data.localId,
    p_porcentaje_adelanto: validation.data.advancePercentage,
    p_medios_pago: validation.data.paymentMethods,
    p_politica_reembolso: validation.data.refundPolicy,
  })
  return error ? databaseFailure(error, 'commercial') : saved()
}

export async function saveScheduleSettingsAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const schedules = formData.getAll('openDay').flatMap((rawDay) => {
    const day = Number(rawDay)
    if (!Number.isInteger(day)) return []
    return [{
      dia: day,
      apertura: formData.get(`opening_${day}`),
      cierre: formData.get(`closing_${day}`),
    }]
  })
  const validation = scheduleSettingsSchema.safeParse({
    localId: formData.get('localId'),
    schedules,
  })
  if (!validation.success) return validationFailure(validation.error)
  if (!await activeLocalMatches(validation.data.localId)) return { success: false, message: messages.denied }

  const supabase = await createClient()
  const { error } = await supabase.rpc('reemplazar_horarios_local', {
    p_local_id: validation.data.localId,
    p_horarios: validation.data.schedules,
  })
  return error ? databaseFailure(error, 'schedule') : saved()
}
