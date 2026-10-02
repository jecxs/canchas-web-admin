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
