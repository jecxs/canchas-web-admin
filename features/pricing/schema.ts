import { z } from 'zod'

const exactHourSchema = z.string().regex(/^(?:[01]\d|2[0-3]):00$/, 'Selecciona una hora completa.')

export const pricingObjectiveSchema = z.object({
  courtId: z.uuid(),
  sportId: z.uuid(),
})

export const pricingRuleSchema = z.object({
  ruleId: z.union([z.literal(''), z.uuid()]).transform((value) => value || null),
  localId: z.uuid(),
  name: z.string().trim().min(3, 'Escribe al menos 3 caracteres.').max(80, 'Usa hasta 80 caracteres.'),
  type: z.enum(['recurrente', 'promocion']),
  days: z.array(z.coerce.number().int().min(0).max(6)).min(1, 'Selecciona al menos un día.').max(7),
  startTime: exactHourSchema,
  endTime: z.string().regex(/^(?:(?:0[1-9]|1\d|2[0-3]):00|24:00)$/, 'Selecciona una hora completa.'),
  startDate: z.string().trim(),
  endDate: z.string().trim(),
  adjustmentType: z.enum(['precio_fijo', 'descuento_porcentaje']),
  hourlyPrice: z.union([z.literal(''), z.coerce.number().positive('Ingresa un precio mayor que cero.').max(10000)]),
  discountPercentage: z.union([z.literal(''), z.coerce.number().positive('Ingresa un descuento mayor que cero.').lt(100, 'El descuento debe ser menor que 100%.')]),
  active: z.boolean(),
  objectives: z.array(pricingObjectiveSchema).min(1, 'Selecciona al menos una cancha y deporte.').max(30),
}).superRefine((value, context) => {
  if (value.startTime >= value.endTime) {
    context.addIssue({ code: 'custom', path: ['endTime'], message: 'La hora final debe ser posterior a la inicial.' })
  }
  if (new Set(value.days).size !== value.days.length) {
    context.addIssue({ code: 'custom', path: ['days'], message: 'No repitas días.' })
  }
  const objectiveKeys = value.objectives.map((item) => `${item.courtId}:${item.sportId}`)
  if (new Set(objectiveKeys).size !== objectiveKeys.length) {
    context.addIssue({ code: 'custom', path: ['objectives'], message: 'No repitas una cancha y deporte.' })
  }

  if (value.type === 'recurrente') {
    if (value.startDate || value.endDate) {
      context.addIssue({ code: 'custom', path: ['startDate'], message: 'Una tarifa semanal no utiliza fechas.' })
    }
    if (value.adjustmentType !== 'precio_fijo' || value.hourlyPrice === '' || value.discountPercentage !== '') {
      context.addIssue({ code: 'custom', path: ['hourlyPrice'], message: 'La tarifa semanal requiere un precio fijo.' })
    }
  } else {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(value.endDate) || value.startDate > value.endDate) {
      context.addIssue({ code: 'custom', path: ['startDate'], message: 'Elige un periodo de fechas válido.' })
    }
    if (value.adjustmentType === 'precio_fijo' && value.hourlyPrice === '') {
      context.addIssue({ code: 'custom', path: ['hourlyPrice'], message: 'Ingresa el precio promocional.' })
    }
    if (value.adjustmentType === 'descuento_porcentaje' && value.discountPercentage === '') {
      context.addIssue({ code: 'custom', path: ['discountPercentage'], message: 'Ingresa el porcentaje de descuento.' })
    }
  }
})

export const deletePricingRuleSchema = z.object({
  localId: z.uuid(),
  ruleId: z.uuid(),
})
