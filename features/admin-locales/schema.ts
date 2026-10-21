import { z } from 'zod'

export const localIdSchema = z.object({
  localId: z.uuid('El local seleccionado no es válido.'),
})

export const localTrialSchema = localIdSchema.extend({
  days: z.coerce
    .number({ error: 'Indica la duración del periodo de prueba.' })
    .int('La duración debe expresarse en días completos.')
    .min(1, 'El trial debe durar al menos un día.')
    .max(90, 'El trial no puede superar los 90 días.'),
})

export const localRejectionSchema = localIdSchema.extend({
  reason: z
    .string({ error: 'Escribe el motivo de la observación.' })
    .trim()
    .min(5, 'El motivo debe tener al menos 5 caracteres.')
    .max(500, 'El motivo no puede superar los 500 caracteres.'),
})

export const localPublicationSchema = z.object({
  localId: z.uuid('El local seleccionado no es válido.'),
  published: z.enum(['true', 'false']).transform((value) => value === 'true'),
})

export const localModerationSchema = localIdSchema.extend({
  type: z.enum(['advertencia', 'pausa_reservas', 'suspension_temporal', 'retiro_definitivo']),
  reason: z
    .string({ error: 'Escribe el motivo de la medida.' })
    .trim()
    .min(5, 'El motivo debe tener al menos 5 caracteres.')
    .max(500, 'El motivo no puede superar los 500 caracteres.'),
  internalNotes: z.string().trim().max(2000, 'Las notas internas no pueden superar los 2000 caracteres.'),
  endsAt: z.string().trim().optional(),
}).superRefine((value, context) => {
  const requiresEnd = value.type === 'pausa_reservas' || value.type === 'suspension_temporal'
  if (requiresEnd && !value.endsAt) {
    context.addIssue({ code: 'custom', path: ['endsAt'], message: 'Indica cuándo termina la medida temporal.' })
  }
  if (value.type === 'retiro_definitivo' && value.endsAt) {
    context.addIssue({ code: 'custom', path: ['endsAt'], message: 'El retiro definitivo no lleva fecha de término.' })
  }
  if (value.endsAt && Number.isNaN(Date.parse(value.endsAt))) {
    context.addIssue({ code: 'custom', path: ['endsAt'], message: 'La fecha de término no es válida.' })
  }
})

export const liftLocalModerationSchema = localIdSchema.extend({
  reason: z.string().trim().max(500, 'El motivo no puede superar los 500 caracteres.'),
})
