'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { localDateTimeToIso, makeTstzRange } from './date-utils'
import { cancelReservationSchema, encasedBookingSchema, extendReservationSchema, maintenanceSchema, manualBookingSchema, noShowReservationSchema, paymentMovementSchema, rejectReservationSchema, rescheduleReservationSchema, reservationDecisionSchema } from './schema'
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
  return { success: true, message }
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
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    status: formData.get('status'),
    channel: formData.get('channel'),
    notes: formData.get('notes') ?? '',
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)

  const start = localDateTimeToIso(validation.data.date, validation.data.time)
  if (!start) return invalid({ time: ['Selecciona una fecha y hora válidas.'] })

  const { local } = await requireOperationalOwnerLocal()
  if (local.id !== validation.data.localId) return { success: false, message: 'No tienes permiso para realizar esta acción' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('crear_reserva_manual_dueno', {
    p_local_id: local.id,
    p_cancha_id: validation.data.courtId,
    p_deporte_id: validation.data.sportId,
    p_inicio: start,
    p_bloques: validation.data.blocks,
    p_cliente_nombre: validation.data.customerName,
    p_cliente_telefono: validation.data.customerPhone,
    p_estado: validation.data.status,
    p_canal: validation.data.channel,
    p_notas: validation.data.notes || undefined,
  })
  if (error) return operationError('manual-booking', error)
  return finish('Reserva registrada')
}

export async function createEncasedBookingAction(_state: AgendaActionState, formData: FormData): Promise<AgendaActionState> {
  const validation = encasedBookingSchema.safeParse({
    localId: formData.get('localId'),
    sportId: formData.get('sportId'),
    date: formData.get('date'),
    time: formData.get('time'),
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    status: formData.get('status'),
    channel: formData.get('channel'),
    notes: formData.get('notes') ?? '',
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)

  const start = localDateTimeToIso(validation.data.date, validation.data.time)
  if (!start) return invalid({ time: ['Selecciona una fecha y hora válidas.'] })

  const { local } = await requireOperationalOwnerLocal()
  if (local.id !== validation.data.localId) return { success: false, message: 'No tienes permiso para realizar esta acción' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('crear_reserva_manual_encajada', {
    p_local_id: local.id,
    p_deporte_id: validation.data.sportId,
    p_inicio: start,
    p_cliente_nombre: validation.data.customerName,
    p_cliente_telefono: validation.data.customerPhone,
    p_estado: validation.data.status,
    p_canal: validation.data.channel,
    p_notas: validation.data.notes || undefined,
  })
  if (error) return operationError('encased-booking', error)
  return finish('Reserva encajada registrada')
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
    paymentMethod: formData.get('paymentMethod') ?? '',
    notes: formData.get('notes') ?? '',
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)

  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('extender_reserva_30_min', {
    p_reserva_id: validation.data.reservationId,
    p_estado_cobro: validation.data.chargeStatus,
    p_medio_cobro: validation.data.paymentMethod || undefined,
    p_notas: validation.data.notes || undefined,
  })
  if (error) return operationError('extend', error)
  return finish('Extensión de 30 minutos autorizada')
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
  const validation = paymentMovementSchema.safeParse({ reservationId: formData.get('reservationId'), type: formData.get('type'), amount: formData.get('amount'), method: formData.get('method') ?? '', notes: formData.get('notes') ?? '' })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)
  await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { error } = await supabase.rpc('registrar_movimiento_pago_reserva_dueno', { p_reserva_id: validation.data.reservationId, p_tipo: validation.data.type, p_monto: validation.data.amount, p_medio: validation.data.method || undefined, p_notas: validation.data.notes || undefined })
  if (error) return operationError('payment-movement', error)
  return finish('Movimiento de caja registrado')
}
