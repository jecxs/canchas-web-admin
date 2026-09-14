import { z } from 'zod'
import { isValidAgendaDate } from './date-utils'

const localDate = z.string().refine(isValidAgendaDate, 'Selecciona una fecha válida.')
const localTime = z.string().regex(/^\d{2}:\d{2}$/, 'Selecciona una hora válida.')

export const manualBookingSchema = z.object({
  localId: z.uuid(),
  courtId: z.uuid(),
  sportId: z.uuid(),
  date: localDate,
  time: localTime,
  blocks: z.coerce.number().int().min(1).max(4),
  customerName: z.string().trim().min(2, 'Escribe el nombre del cliente.').max(120),
  customerPhone: z.string().trim().min(7, 'Escribe un teléfono válido.').max(30),
  status: z.enum(['pendiente_pago', 'confirmada']),
  channel: z.enum(['whatsapp', 'presencial']),
  notes: z.string().trim().max(500),
})

export const encasedBookingSchema = z.object({
  localId: z.uuid(),
  sportId: z.uuid(),
  date: localDate,
  time: z.string().regex(/^\d{2}:30$/, 'La reserva encajada debe iniciar a los 30 minutos.'),
  customerName: z.string().trim().min(2, 'Escribe el nombre del cliente.').max(120),
  customerPhone: z.string().trim().min(7, 'Escribe un teléfono válido.').max(30),
  status: z.enum(['pendiente_pago', 'confirmada']),
  channel: z.enum(['whatsapp', 'presencial']),
  notes: z.string().trim().max(500),
})

export const maintenanceSchema = z.object({
  localId: z.uuid(),
  courtId: z.uuid(),
  date: localDate,
  startTime: localTime,
  endTime: localTime,
  reason: z.string().trim().max(200),
}).refine((value) => value.endTime > value.startTime, {
  path: ['endTime'],
  message: 'La hora final debe ser posterior a la inicial.',
})

export const extendReservationSchema = z.object({
  reservationId: z.uuid(),
  chargeStatus: z.enum(['pendiente', 'cobrado']),
  paymentMethod: z.string().trim().max(60),
  notes: z.string().trim().max(300),
})

export const reservationDecisionSchema = z.object({
  reservationId: z.uuid(),
})

export const rejectReservationSchema = z.object({
  reservationId: z.uuid(),
  reason: z.enum(['pago_no_recibido', 'monto_incorrecto', 'comprobante_ilegible', 'datos_no_coinciden', 'otro']),
  comment: z.string().trim().max(500),
})

export const rescheduleReservationSchema = z.object({
  reservationId: z.uuid(),
  courtId: z.uuid(),
  date: localDate,
  time: localTime,
})

export const cancelReservationSchema = z.object({
  reservationId: z.uuid(),
  status: z.enum(['cancelada_cliente', 'cancelada_local']),
  reason: z.string().trim().max(500),
  refundStatus: z.enum(['no_aplica', 'solicitado', 'aprobado', 'rechazado']),
})

export const noShowReservationSchema = z.object({
  reservationId: z.uuid(),
  reason: z.string().trim().max(500),
})

export const paymentMovementSchema = z.object({
  reservationId: z.uuid(),
  type: z.enum(['adelanto', 'saldo', 'reembolso']),
  amount: z.coerce.number().positive('El monto debe ser mayor que cero.').max(99999),
  method: z.string().trim().max(60),
  notes: z.string().trim().max(300),
})
