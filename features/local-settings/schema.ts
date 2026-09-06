import { z } from 'zod'

const phoneSchema = z.string().trim().regex(/^9\d{8}$/, 'Ingresa un celular peruano válido de 9 dígitos.')

export const generalSettingsSchema = z.object({
  localId: z.uuid(),
  name: z.string().trim().min(3, 'Escribe al menos 3 caracteres.').max(100),
  description: z.string().trim().min(20, 'Describe el local con al menos 20 caracteres.').max(600),
  ruc: z.string().trim().refine((value) => value === '' || /^\d{11}$/.test(value), 'El RUC debe tener 11 dígitos.'),
  primaryPhone: phoneSchema,
  secondaryPhone: z.string().trim().refine((value) => value === '' || /^9\d{8}$/.test(value), 'Ingresa un celular peruano válido.'),
  address: z.string().trim().min(5, 'Escribe una dirección más precisa.').max(250),
  latitude: z.coerce.number().min(-90, 'Latitud fuera de rango.').max(90, 'Latitud fuera de rango.'),
  longitude: z.coerce.number().min(-180, 'Longitud fuera de rango.').max(180, 'Longitud fuera de rango.'),
}).refine((data) => !(data.latitude === 0 && data.longitude === 0), {
  path: ['latitude'],
  message: 'Las coordenadas 0,0 no identifican tu local.',
})

export const paymentTypeSchema = z.enum(['yape', 'plin', 'transferencia', 'efectivo', 'otro'])

export const commercialSettingsSchema = z.object({
  localId: z.uuid(),
  advancePercentage: z.coerce.number().min(1, 'El adelanto mínimo es 1%.').max(100, 'El adelanto máximo es 100%.'),
  refundPolicy: z.string().trim().min(20, 'Explica la política con al menos 20 caracteres.').max(1500),
  paymentMethods: z.array(z.object({
    tipo: paymentTypeSchema,
    detalle: z.string().trim().min(3, 'Completa los datos del medio de pago.').max(120),
  })).min(1, 'Selecciona al menos un medio de pago.').max(6),
})

export const scheduleSettingsSchema = z.object({
  localId: z.uuid(),
  schedules: z.array(z.object({
    dia: z.number().int().min(0).max(6),
    apertura: z.string().regex(/^(0\d|1\d|2[0-3]):00$/, 'Usa horas completas.'),
    cierre: z.string().regex(/^(0\d|1\d|2[0-3]):00$/, 'Usa horas completas.'),
  }).refine((item) => item.cierre > item.apertura, {
    path: ['cierre'],
    message: 'La hora de cierre debe ser posterior a la apertura.',
  })).min(1, 'Selecciona al menos un día de atención.').max(7),
})
