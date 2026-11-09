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
  clienteId: z.uuid().optional(),
  customerName: z.string().trim().min(2, 'Escribe el nombre del cliente.').max(120),
  customerPhone: z.string().trim().min(7, 'Escribe un teléfono válido.').max(30),
  publicName: z.string().trim().max(40, 'Máximo 40 caracteres.').refine((value) => !value || value.length >= 2 && !/[\x00-\x1f\x7f]/.test(value), 'Escribe entre 2 y 40 caracteres, sin saltos de línea.').default(''),
  withoutAdvance: z.enum(['yes', 'no']),
  advanceAmount: z.coerce.number().nonnegative('El adelanto no puede ser negativo.').max(99999, 'El adelanto es demasiado alto.'),
  specialFinalAmount: z.preprocess((value) => value === '' || value == null ? undefined : value, z.coerce.number().positive().max(99999).optional()),
  quotedTotal: z.preprocess((value) => value === '' || value == null ? undefined : value, z.coerce.number().positive().optional()),
  discountReason: z.string().trim().max(300).default(''),
  paymentMethodId: z.preprocess((value) => value === '' || value == null ? undefined : value, z.uuid().optional()),
  channel: z.enum(['whatsapp', 'presencial']),
  notes: z.string().trim().max(500),
}).superRefine((value, context) => {
  if (value.withoutAdvance === 'yes' && (value.advanceAmount !== 0 || value.paymentMethodId)) {
    context.addIssue({ code: 'custom', path: ['advanceAmount'], message: 'Una reserva sin adelanto no puede registrar un cobro inicial.' })
  }
  if (value.withoutAdvance === 'yes' && !value.quotedTotal) {
    context.addIssue({ code: 'custom', path: ['quotedTotal'], message: 'Espera a que se calcule el precio de la reserva.' })
  }
  if (value.withoutAdvance === 'no' && (value.advanceAmount <= 0 || !value.paymentMethodId)) {
    context.addIssue({ code: 'custom', path: ['advanceAmount'], message: 'Registra el adelanto y su medio de cobro.' })
  }
  if (value.specialFinalAmount !== undefined && (!value.quotedTotal || value.discountReason.length < 3)) {
    context.addIssue({ code: 'custom', path: ['discountReason'], message: 'Escribe el motivo privado del precio especial.' })
  }
})

export const specialPriceSchema = z.object({
  reservationId: z.uuid(),
  finalAmount: z.coerce.number().positive().max(99999),
  expectedTotal: z.coerce.number().positive(),
  reason: z.string().trim().min(3, 'Escribe el motivo del descuento.').max(300),
})

export const encasedBookingSchema = z.object({
  localId: z.uuid(),
  courtId: z.uuid(),
  sportId: z.uuid(),
  date: localDate,
  time: z.string().regex(/^\d{2}:30$/, 'La reserva encajada debe iniciar a los 30 minutos.'),
  clienteId: z.uuid().optional(),
  customerName: z.string().trim().min(2, 'Escribe el nombre del cliente.').max(120),
  customerPhone: z.string().trim().min(7, 'Escribe un teléfono válido.').max(30),
  publicName: z.string().trim().max(40, 'Máximo 40 caracteres.').refine((value) => !value || value.length >= 2 && !/[\x00-\x1f\x7f]/.test(value), 'Escribe entre 2 y 40 caracteres, sin saltos de línea.').default(''),
  withoutAdvance: z.enum(['yes', 'no']),
  advanceAmount: z.coerce.number().nonnegative('El adelanto no puede ser negativo.').max(99999, 'El adelanto es demasiado alto.'),
  quotedTotal: z.preprocess((value) => value === '' || value == null ? undefined : value, z.coerce.number().positive().optional()),
  paymentMethodId: z.preprocess((value) => value === '' || value == null ? undefined : value, z.uuid().optional()),
  channel: z.enum(['whatsapp', 'presencial']),
  notes: z.string().trim().max(500),
}).superRefine((value, context) => {
  if (value.withoutAdvance === 'yes' && (value.advanceAmount !== 0 || value.paymentMethodId)) {
    context.addIssue({ code: 'custom', path: ['advanceAmount'], message: 'Una reserva sin adelanto no puede registrar un cobro inicial.' })
  }
  if (value.withoutAdvance === 'yes' && !value.quotedTotal) {
    context.addIssue({ code: 'custom', path: ['quotedTotal'], message: 'Espera a que se calcule el precio de la reserva.' })
  }
  if (value.withoutAdvance === 'no' && (value.advanceAmount <= 0 || !value.paymentMethodId)) {
    context.addIssue({ code: 'custom', path: ['advanceAmount'], message: 'Registra el adelanto y su medio de cobro.' })
  }
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
  paymentMethodId: z.string().trim(),
  notes: z.string().trim().max(300),
}).superRefine((value, context) => {
  if (value.chargeStatus === 'cobrado' && !z.uuid().safeParse(value.paymentMethodId).success) {
    context.addIssue({ code: 'custom', path: ['paymentMethodId'], message: 'Selecciona cómo se cobró la extensión.' })
  }
})

export const hourExtensionSchema = z.object({
  reservationId: z.uuid(),
  expectedEnd: z.iso.datetime({ offset: true }),
  expectedTotal: z.coerce.number().positive(),
  paymentMethodId: z.string().trim(),
}).refine((value) => !value.paymentMethodId || z.uuid().safeParse(value.paymentMethodId).success, {
  path: ['paymentMethodId'], message: 'Selecciona un medio de cobro válido.',
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
  refundStatus: z.enum(['no_aplica', 'aprobado', 'rechazado']),
})

export const noShowReservationSchema = z.object({
  reservationId: z.uuid(),
  reason: z.string().trim().max(500),
})

export const paymentMovementSchema = z.object({
  reservationId: z.uuid(),
  amount: z.coerce.number().positive('El monto debe ser mayor que cero.').max(99999),
  paymentMethodId: z.uuid('Selecciona el medio de cobro.'),
  reference: z.string().trim().max(80),
  notes: z.string().trim().max(300),
})
