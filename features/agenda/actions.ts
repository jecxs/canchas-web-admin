'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { localDateTimeToIso, makeTstzRange } from './date-utils'
import { cancelReservationSchema, encasedBookingSchema, extendReservationSchema, hourExtensionSchema, maintenanceSchema, manualBookingSchema, noShowReservationSchema, paymentMovementSchema, rejectReservationSchema, rescheduleReservationSchema, reservationDecisionSchema, specialPriceSchema } from './schema'
import type { AgendaActionState } from './types'

const invalid = (fieldErrors?: Record<string, string[] | undefined>): AgendaActionState => ({
  success: false,
  message: 'Revisa los campos indicados',
  fieldErrors,
})

function operationError(scope: string, error: { code?: string; message?: string; details?: string; hint?: string }): AgendaActionState {
  console.error(`[agenda:${scope}]`, { code: error.code, message: error.message, details: error.details, hint: error.hint })
  if (error.code === '42501') return { success: false, message: 'No tienes permiso para realizar esta acción' }
  if (['23P01', '23514', 'GRASSLY_SLOT_CHANGED', 'GRASSLY_RESERVATION_CONFLICT'].includes(error.code ?? '')) {
    return { success: false, message: 'El horario acaba de cambiar. Actualiza la agenda e inténtalo nuevamente.' }
  }
  if (error.code === '42P01') return { success: false, message: 'La configuración de reservas necesita actualizarse. Inténtalo nuevamente en unos minutos.' }
  // Las RPC operativas usan excepciones P0001 para reglas comprensibles del
  // negocio (cruce, horario, extensión previa, etc.). No las ocultes detrás de
  // un aviso genérico: el dueño necesita saber qué decisión tomar.
  if (error.code === 'P0001' && error.message) return { success: false, message: error.message }
  return { success: false, message: error.message?.toLowerCase().includes('horario') ? error.message : 'No se pudo completar la operación' }
}

function finish(message: string): AgendaActionState {
  revalidatePath('/panel')
  revalidatePath('/panel/agenda')
  revalidatePath('/panel/reservas')
  revalidatePath('/panel/clientes')
  revalidatePath('/panel/caja')
  revalidatePath('/panel/reportes')
  return { success: true, message }
}

function readClienteId(formData: FormData) {
  const value = formData.get('clienteId')
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function rangeFromLocalTimes(date: string, startTime: string, endTime: string) {
  const start = localDateTimeToIso(date, startTime)
  const end = localDateTimeToIso(date, endTime)
  if (!start || !end || new Date(end) <= new Date(start)) return null
  return makeTstzRange(start, end)
}

export async function createManualBookingAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = manualBookingSchema.safeParse({
    localId: formData.get('localId'),
    courtId: formData.get('courtId'),
    sportId: formData.get('sportId'),
    date: formData.get('date'),
    time: formData.get('time'),
    blocks: formData.get('blocks'),
    clienteId: readClienteId(formData),
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    publicName: formData.get('publicName') ?? '',
    withoutAdvance: formData.get('withoutAdvance'),
    advanceAmount: formData.get('advanceAmount'),
    specialFinalAmount: formData.get('specialFinalAmount'),
    quotedTotal: formData.get('quotedTotal'),
    discountReason: formData.get('discountReason') ?? '',
    paymentMethodId: formData.get('paymentMethodId'),
    channel: formData.get('channel'),
    notes: formData.get('notes') ?? '',
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)

  const start = localDateTimeToIso(validation.data.date, validation.data.time)
  if (!start) return invalid({ time: ['Selecciona una fecha y hora válidas.'] })

  const { local } = await requireOperationalOwnerLocal()
  if (local.id !== validation.data.localId) return { success: false, message: 'No tienes permiso para realizar esta acción' }

  const supabase = await createClient()
  const args = {
    p_local_id: local.id,
    p_cancha_id: validation.data.courtId,
    p_deporte_id: validation.data.sportId,
    p_inicio: start,
    p_bloques: validation.data.blocks,
    p_cliente_id: validation.data.clienteId,
    p_cliente_nombre: validation.data.customerName,
    p_cliente_telefono: validation.data.customerPhone,
    p_monto_adelanto: validation.data.advanceAmount,
    p_medio_pago_id: validation.data.paymentMethodId ?? null,
    p_canal: validation.data.channel,
    p_notas: validation.data.notes || undefined,
    p_nombre_publico: validation.data.publicName || null,
  }
  const { error } = validation.data.specialFinalAmount === undefined
    ? await supabase.rpc('crear_reserva_manual_confirmada_dueno_con_nombre', args)
    : await supabase.rpc('crear_reserva_manual_confirmada_dueno_con_descuento', {
      ...args,
      p_cliente_id: validation.data.clienteId ?? null,
      p_notas: validation.data.notes || null,
      p_monto_final: validation.data.specialFinalAmount,
      p_motivo_descuento: validation.data.discountReason,
      p_total_cotizado: validation.data.quotedTotal!,
    })
  if (error) return operationError('manual-booking', error)
  return finish('Reserva registrada')
}

export async function applySpecialPriceAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = specialPriceSchema.safeParse({
    reservationId: formData.get('reservationId'),
    finalAmount: formData.get('finalAmount'),
    expectedTotal: formData.get('expectedTotal'),
    reason: formData.get('reason'),
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)
  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('aplicar_precio_especial_reserva_dueno', {
    p_reserva_id: validation.data.reservationId,
    p_monto_final: validation.data.finalAmount,
    p_motivo: validation.data.reason,
    p_total_esperado: validation.data.expectedTotal,
  })
  if (error) return operationError('special-price', error)
  return finish('Precio especial actualizado')
}

export async function createEncasedBookingAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = encasedBookingSchema.safeParse({
    localId: formData.get('localId'),
    courtId: formData.get('courtId'),
    sportId: formData.get('sportId'),
    date: formData.get('date'),
    time: formData.get('time'),
    clienteId: readClienteId(formData),
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    publicName: formData.get('publicName') ?? '',
    withoutAdvance: formData.get('withoutAdvance'),
    advanceAmount: formData.get('advanceAmount'),
    quotedTotal: formData.get('quotedTotal'),
    paymentMethodId: formData.get('paymentMethodId'),
    channel: formData.get('channel'),
    notes: formData.get('notes') ?? '',
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)

  const start = localDateTimeToIso(validation.data.date, validation.data.time)
  if (!start) return invalid({ time: ['Selecciona una fecha y hora válidas.'] })

  const { local } = await requireOperationalOwnerLocal()
  if (local.id !== validation.data.localId) return { success: false, message: 'No tienes permiso para realizar esta acción' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('crear_reserva_manual_encajada_confirmada_dueno_con_nombre', {
    p_local_id: local.id,
    p_cancha_id: validation.data.courtId,
    p_deporte_id: validation.data.sportId,
    p_inicio: start,
    p_cliente_id: validation.data.clienteId,
    p_cliente_nombre: validation.data.customerName,
    p_cliente_telefono: validation.data.customerPhone,
    p_monto_adelanto: validation.data.advanceAmount,
    p_medio_pago_id: validation.data.paymentMethodId ?? null,
    p_canal: validation.data.channel,
    p_notas: validation.data.notes || undefined,
    p_nombre_publico: validation.data.publicName || null,
  })
  if (error) return operationError('encased-booking', error)
  return finish('Reserva encajada registrada')
}

export async function updateReservationPublicNameAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const reservationId = formData.get('reservationId')
  const name = formData.get('publicName')
  const block = formData.get('blockName') === 'true'
  if (typeof reservationId !== 'string' || !/^[0-9a-f-]{36}$/i.test(reservationId)) return invalid({ reservationId: ['Reserva inválida.'] })
  if (typeof name !== 'string' || name.trim().length === 1 || name.trim().length > 40 || /[\x00-\x1f\x7f]/.test(name)) return invalid({ publicName: ['Escribe entre 2 y 40 caracteres o deja el campo vacío.'] })
  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('actualizar_nombre_publico_reserva', {
    p_reserva_id: reservationId,
    p_nombre_publico: block ? null : name.trim() || null,
    p_bloquear: block,
  })
  if (error) return operationError('public-name', error)
  return finish(block ? 'Nombre personalizado retirado. La reserva sigue vigente.' : 'Nombre visible actualizado')
}

export async function createMaintenanceAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = maintenanceSchema.safeParse({
    localId: formData.get('localId'),
    courtId: formData.get('courtId'),
    date: formData.get('date'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    reason: formData.get('reason') ?? '',
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)

  const range = rangeFromLocalTimes(validation.data.date, validation.data.startTime, validation.data.endTime)
  if (!range) return invalid({ endTime: ['La hora final debe ser posterior a la inicial.'] })

  const { local } = await requireOperationalOwnerLocal()
  if (local.id !== validation.data.localId) return { success: false, message: 'No tienes permiso para realizar esta acción' }

  const supabase = await createClient()
  const { error } = await supabase.from('bloqueos_mantenimiento').insert({
    cancha_id: validation.data.courtId,
    rango: range,
    motivo: validation.data.reason || null,
  })
  if (error) return operationError('maintenance', error)
  return finish('Horario bloqueado')
}

export async function extendReservationAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = extendReservationSchema.safeParse({
    reservationId: formData.get('reservationId'),
    chargeStatus: formData.get('chargeStatus'),
    paymentMethodId: formData.get('paymentMethodId') ?? '',
    notes: formData.get('notes') ?? '',
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)

  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('extender_reserva_30_min_v2', {
    p_reserva_id: validation.data.reservationId,
    p_estado_cobro: validation.data.chargeStatus,
    p_medio_pago_id: validation.data.paymentMethodId || undefined,
    p_notas: validation.data.notes || undefined,
  })
  if (error) return operationError('extend', error)
  return finish('Extensión de 30 minutos autorizada')
}

export type HourExtensionQuote = {
  oldEnd: string
  newEnd: string
  addedAmount: number
  newTotal: number
  newOutstanding: number
}

export async function quoteHourExtensionAction(reservationId: string): Promise<{ quote?: HourExtensionQuote; message?: string }> {
  if (!z.uuid().safeParse(reservationId).success) return { message: 'Reserva inválida.' }
  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('cotizar_ampliacion_hora_reserva_dueno', { p_reserva_id: reservationId })
  if (error || !data?.[0]) return { message: error?.message ?? 'No se pudo cotizar la hora adicional.' }
  const row = data[0]
  return { quote: {
    oldEnd: row.fin_anterior,
    newEnd: row.fin_nuevo,
    addedAmount: Number(row.monto_adicional),
    newTotal: Number(row.total_nuevo),
    newOutstanding: Number(row.saldo_nuevo),
  } }
}

export async function addHourToReservationAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = hourExtensionSchema.safeParse({
    reservationId: formData.get('reservationId'),
    expectedEnd: formData.get('expectedEnd'),
    expectedTotal: formData.get('expectedTotal'),
    paymentMethodId: formData.get('paymentMethodId') ?? '',
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)
  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('ampliar_reserva_hora_dueno', {
    p_reserva_id: validation.data.reservationId,
    p_fin_esperado: validation.data.expectedEnd,
    p_total_esperado: validation.data.expectedTotal,
    p_medio_pago_id: validation.data.paymentMethodId || undefined,
  })
  if (error) return operationError('add-hour', error)
  return finish('Reserva ampliada una hora')
}

export async function revertHourExtensionAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const id = z.uuid().safeParse(formData.get('hourExtensionId'))
  if (!id.success) return invalid({ hourExtensionId: ['Ampliación inválida.'] })
  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('revertir_ampliacion_hora_reserva_dueno', { p_ampliacion_id: id.data })
  if (error) return operationError('revert-hour', error)
  return finish('Hora adicional retirada')
}

export async function confirmReservationAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = reservationDecisionSchema.safeParse({ reservationId: formData.get('reservationId') })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)

  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('confirmar_reserva', { p_reserva_id: validation.data.reservationId })
  if (error) return operationError('confirm-reservation', error)
  return finish('Reserva confirmada')
}

export async function rejectReservationAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = rejectReservationSchema.safeParse({
    reservationId: formData.get('reservationId'),
    reason: formData.get('reason'),
    comment: formData.get('comment') ?? '',
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)

  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('rechazar_reserva_pendiente_validacion', {
    p_reserva_id: validation.data.reservationId,
    p_motivo: validation.data.reason,
    p_comentario: validation.data.comment || undefined,
  })
  if (error) return operationError('reject-reservation', error)
  return finish('Reserva rechazada y horario liberado')
}

export async function rescheduleReservationAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = rescheduleReservationSchema.safeParse({
    reservationId: formData.get('reservationId'), courtId: formData.get('courtId'), date: formData.get('date'), time: formData.get('time'),
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)
  const start = localDateTimeToIso(validation.data.date, validation.data.time)
  if (!start) return invalid({ time: ['Selecciona una hora válida.'] })
  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('reprogramar_reserva_dueno', { p_reserva_id: validation.data.reservationId, p_cancha_id: validation.data.courtId, p_inicio: start })
  if (error) return operationError('reschedule-reservation', error)
  return finish('Reserva reprogramada')
}

export async function cancelReservationAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = cancelReservationSchema.safeParse({ reservationId: formData.get('reservationId'), status: formData.get('status'), reason: formData.get('reason') ?? '', refundStatus: formData.get('refundStatus') })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)
  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('cancelar_reserva_dueno', { p_reserva_id: validation.data.reservationId, p_estado: validation.data.status, p_motivo: validation.data.reason || undefined, p_reembolso: validation.data.refundStatus })
  if (error) return operationError('cancel-reservation', error)
  return finish('Cancelación registrada; el bloque quedó liberado')
}

export async function markNoShowReservationAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = noShowReservationSchema.safeParse({ reservationId: formData.get('reservationId'), reason: formData.get('reason') ?? '' })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)
  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('marcar_reserva_no_show_dueno', { p_reserva_id: validation.data.reservationId, p_motivo: validation.data.reason || undefined })
  if (error) return operationError('no-show-reservation', error)
  return finish('Inasistencia registrada')
}

export async function registerPaymentMovementAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = paymentMovementSchema.safeParse({ reservationId: formData.get('reservationId'), amount: formData.get('amount'), paymentMethodId: formData.get('paymentMethodId'), reference: formData.get('reference') ?? '', notes: formData.get('notes') ?? '' })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)
  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('registrar_movimiento_pago_reserva_dueno_v2', { p_reserva_id: validation.data.reservationId, p_monto: validation.data.amount, p_medio_pago_id: validation.data.paymentMethodId, p_referencia: validation.data.reference || undefined, p_notas: validation.data.notes || undefined })
  if (error) return operationError('payment-movement', error)
  return finish('Movimiento de caja registrado')
}
