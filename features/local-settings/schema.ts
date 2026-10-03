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
    nombre_visible: z.string().trim().max(60),
    titular: z.string().trim().max(100),
    telefono: z.string().trim(),
    banco: z.string().trim().max(60),
    numero_cuenta: z.string().trim().max(40),
    cci: z.string().trim(),
  })).min(1, 'Selecciona al menos un medio de pago.').max(5),
}).superRefine((value, context) => {
  const seen = new Set<string>()
  if (!value.paymentMethods.some((method) => ['yape', 'plin', 'transferencia'].includes(method.tipo))) {
    context.addIssue({ code: 'custom', path: ['paymentMethods'], message: 'Activa al menos un medio digital para las reservas del app.' })
  }
  value.paymentMethods.forEach((method, index) => {
    if (seen.has(method.tipo)) {
      context.addIssue({ code: 'custom', path: ['paymentMethods', index, 'tipo'], message: 'No repitas un medio de pago.' })
    }
    seen.add(method.tipo)

    if (method.tipo === 'yape' || method.tipo === 'plin') {
      if (!/^9\d{8}$/.test(method.telefono)) context.addIssue({ code: 'custom', path: ['paymentMethods'], message: `Ingresa el celular de ${method.tipo === 'yape' ? 'Yape' : 'Plin'} con 9 dígitos.` })
      if (method.titular.length < 3) context.addIssue({ code: 'custom', path: ['paymentMethods'], message: `Ingresa el nombre del titular de ${method.tipo === 'yape' ? 'Yape' : 'Plin'}.` })
    }
    if (method.tipo === 'transferencia') {
      if (method.banco.length < 2) context.addIssue({ code: 'custom', path: ['paymentMethods'], message: 'Ingresa el banco de la transferencia.' })
      if (method.titular.length < 3) context.addIssue({ code: 'custom', path: ['paymentMethods'], message: 'Ingresa el titular de la cuenta bancaria.' })
      if (method.numero_cuenta.length < 3 && method.cci.length === 0) context.addIssue({ code: 'custom', path: ['paymentMethods'], message: 'Ingresa un número de cuenta o CCI.' })
      if (method.cci.length > 0 && !/^\d{20}$/.test(method.cci)) context.addIssue({ code: 'custom', path: ['paymentMethods'], message: 'El CCI debe tener 20 dígitos.' })
    }
    if (method.tipo === 'otro' && method.nombre_visible.length < 3) {
      context.addIssue({ code: 'custom', path: ['paymentMethods'], message: 'Escribe el nombre del otro medio de pago.' })
    }
  })
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

const customBenefitSchema = z.string()
  .trim()
  .min(3, 'Cada beneficio personalizado debe tener al menos 3 caracteres.')
  .max(60, 'Cada beneficio personalizado puede tener hasta 60 caracteres.')
  .refine((value) => !/[\x00-\x1F\x7F]/.test(value), 'El beneficio contiene caracteres no permitidos.')

export const benefitsSettingsSchema = z.object({
  localId: z.uuid(),
  catalogIds: z.array(z.uuid()).max(12, 'Puedes seleccionar hasta 12 beneficios estándar.'),
  customBenefits: z.array(customBenefitSchema).max(5, 'Puedes agregar hasta 5 beneficios personalizados.'),
}).superRefine((value, context) => {
  const seen = new Set<string>()
  value.customBenefits.forEach((benefit, index) => {
    const normalized = benefit.toLocaleLowerCase('es-PE')
    if (seen.has(normalized)) {
      context.addIssue({ code: 'custom', path: ['customBenefits', index], message: 'No repitas un beneficio personalizado.' })
    }
    seen.add(normalized)
  })
})
