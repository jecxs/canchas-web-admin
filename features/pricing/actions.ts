'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { deletePricingRuleSchema, pricingRuleSchema } from './schema'
import type { PricingActionState } from './types'

function validationFailure(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }): PricingActionState {
  return { success: false, message: 'Revisa los campos indicados', fieldErrors: error.flatten().fieldErrors }
}

async function ownsActiveLocal(localId: string) {
  const { local } = await requireOperationalOwnerLocal()
  return local.id === localId
}

function pricingDatabaseFailure(error: { code?: string; message?: string } | null, scope: string): PricingActionState {
  console.error(`[pricing:${scope}]`, { code: error?.code })
  if (error?.code === '42501') return { success: false, message: 'No tienes permiso para modificar estas tarifas.' }
  if (error?.code === '23P01') return { success: false, message: 'La regla se cruza con otra del mismo tipo para una cancha y deporte seleccionados.' }
  if (error?.code === 'P0002') return { success: false, message: 'La regla ya no existe. Actualiza la página e inténtalo nuevamente.' }
  if (['22023', '23514'].includes(error?.code ?? '')) return { success: false, message: error?.message ?? 'Revisa la configuración de la regla.' }
  return { success: false, message: 'No se pudo completar la operación.' }
}

function readObjectives(formData: FormData) {
  return formData.getAll('objective').flatMap((value) => {
    if (typeof value !== 'string') return []
    const [courtId, sportId] = value.split(':')
    return courtId && sportId ? [{ courtId, sportId }] : []
  })
}

export async function savePricingRuleAction(
  _state: PricingActionState,
  formData: FormData,
): Promise<PricingActionState> {
  const validation = pricingRuleSchema.safeParse({
    ruleId: formData.get('ruleId') ?? '',
    localId: formData.get('localId'),
    name: formData.get('name'),
    type: formData.get('type'),
    days: formData.getAll('day'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    startDate: formData.get('startDate') ?? '',
    endDate: formData.get('endDate') ?? '',
    adjustmentType: formData.get('adjustmentType'),
    hourlyPrice: formData.get('hourlyPrice') ?? '',
    discountPercentage: formData.get('discountPercentage') ?? '',
    active: formData.get('active') === 'true',
    objectives: readObjectives(formData),
  })
  if (!validation.success) return validationFailure(validation.error)
  if (!await ownsActiveLocal(validation.data.localId)) return { success: false, message: 'No tienes permiso para modificar estas tarifas.' }

  const data = validation.data
  const supabase = await createClient()
  const { data: ruleId, error } = await supabase.rpc('guardar_regla_tarifaria', {
    p_regla_id: data.ruleId ?? undefined,
    p_local_id: data.localId,
    p_nombre: data.name,
    p_tipo: data.type,
    p_dias_semana: data.days,
    p_hora_inicio: data.startTime,
    p_hora_fin: data.endTime,
    p_fecha_inicio: data.type === 'promocion' ? data.startDate : undefined,
    p_fecha_fin: data.type === 'promocion' ? data.endDate : undefined,
    p_tipo_ajuste: data.type === 'recurrente' ? 'precio_fijo' : data.adjustmentType,
    p_precio_por_hora: data.adjustmentType === 'precio_fijo' && data.hourlyPrice !== '' ? data.hourlyPrice : undefined,
    p_descuento_porcentaje: data.type === 'promocion' && data.adjustmentType === 'descuento_porcentaje' && data.discountPercentage !== '' ? data.discountPercentage : undefined,
    p_activo: data.active,
    p_objetivos: data.objectives.map((objective) => ({ cancha_id: objective.courtId, deporte_id: objective.sportId })),
  })

  if (error) return pricingDatabaseFailure(error, 'save')
  revalidatePath('/panel/tarifas')
  revalidatePath('/panel/agenda')
  return { success: true, message: data.ruleId ? 'Tarifa actualizada' : 'Tarifa creada', ruleId: ruleId ?? undefined }
}

export async function deletePricingRuleAction(
  _state: PricingActionState,
  formData: FormData,
): Promise<PricingActionState> {
  const validation = deletePricingRuleSchema.safeParse({
    localId: formData.get('localId'),
    ruleId: formData.get('ruleId'),
  })
  if (!validation.success) return validationFailure(validation.error)
  if (!await ownsActiveLocal(validation.data.localId)) return { success: false, message: 'No tienes permiso para modificar estas tarifas.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('eliminar_regla_tarifaria', { p_regla_id: validation.data.ruleId })
  if (error) return pricingDatabaseFailure(error, 'delete')
  revalidatePath('/panel/tarifas')
  return { success: true, message: 'Tarifa eliminada' }
}
