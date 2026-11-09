'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { isIsoDate } from '@/features/reportes/date-utils'

export type ExceptionalActionState = { success: boolean; message: string }

const entrySchema = z.object({
  amount: z.coerce.number().finite().positive().max(99999.99).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001),
  methodId: z.uuid(),
  concept: z.string().trim().min(3).max(500),
  activityDate: z.string().trim().refine((value) => !value || isIsoDate(value)),
  courtId: z.string().trim().refine((value) => !value || z.uuid().safeParse(value).success),
})

function refreshFinancialPages() {
  revalidatePath('/panel/caja')
  revalidatePath('/panel/reportes')
  revalidatePath('/panel/datos')
}

export async function registerExceptionalIncome(_state: ExceptionalActionState, form: FormData): Promise<ExceptionalActionState> {
  const parsed = entrySchema.safeParse({
    amount: form.get('amount'),
    methodId: form.get('methodId'),
    concept: form.get('concept'),
    activityDate: form.get('activityDate') ?? '',
    courtId: form.get('courtId') ?? '',
  })
  if (!parsed.success) return { success: false, message: 'Revisa el monto, el medio y el motivo del ingreso.' }

  const { local } = await requireOperationalOwnerLocal()
  const client = await createClient()
  const { data: method, error: methodError } = await client.from('local_medios_pago')
    .select('id,tipo,nombre_visible').eq('id', parsed.data.methodId).eq('local_id', local.id).eq('activo', true).maybeSingle()
  if (methodError || !method) return { success: false, message: 'El medio de pago ya no está disponible.' }

  if (parsed.data.courtId) {
    const { data: court, error: courtError } = await client.from('canchas')
      .select('id').eq('id', parsed.data.courtId).eq('local_id', local.id).maybeSingle()
    if (courtError || !court) return { success: false, message: 'La cancha seleccionada no pertenece a este local.' }
  }

  const { error } = await client.from('ingresos_excepcionales_caja').insert({
    local_id: local.id,
    monto: parsed.data.amount,
    medio_pago_id: method.id,
    medio_tipo_snapshot: method.tipo,
    medio_nombre_snapshot: method.nombre_visible,
    concepto: parsed.data.concept,
    fecha_actividad: parsed.data.activityDate || null,
    cancha_id: parsed.data.courtId || null,
  })
  if (error) {
    console.error('[caja:registrar-excepcional]', { code: error.code, message: error.message })
    return { success: false, message: 'No se pudo registrar el ingreso. Inténtalo nuevamente.' }
  }
  refreshFinancialPages()
  return { success: true, message: 'Ingreso excepcional registrado en Caja.' }
}

export async function voidExceptionalIncome(_state: ExceptionalActionState, form: FormData): Promise<ExceptionalActionState> {
  const id = z.uuid().safeParse(form.get('entryId'))
  const reason = z.string().trim().min(3).max(500).safeParse(form.get('reason'))
  if (!id.success || !reason.success) return { success: false, message: 'Escribe un motivo de anulación de al menos 3 caracteres.' }

  await requireOperationalOwnerLocal()
  const client = await createClient()
  const { error } = await client.rpc('anular_ingreso_excepcional_caja', { p_id: id.data, p_motivo: reason.data })
  if (error) {
    console.error('[caja:anular-excepcional]', { code: error.code, message: error.message })
    return { success: false, message: 'No se pudo anular el ingreso.' }
  }
  refreshFinancialPages()
  return { success: true, message: 'Ingreso anulado. La corrección figura en Caja.' }
}
