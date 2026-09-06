import { z } from 'zod'

export const applicationIdSchema = z.object({
  localId: z.uuid('La solicitud seleccionada no es válida.'),
})

export const trialDecisionSchema = applicationIdSchema.extend({
  days: z.coerce
    .number({ error: 'Indica la duración del periodo de prueba.' })
    .int('La duración debe expresarse en días completos.')
    .min(1, 'El trial debe durar al menos un día.')
    .max(90, 'El trial no puede superar los 90 días.'),
})

export const rejectionDecisionSchema = applicationIdSchema.extend({
  reason: z
    .string({ error: 'Escribe el motivo de la observación.' })
    .trim()
    .min(5, 'El motivo debe tener al menos 5 caracteres.')
    .max(500, 'El motivo no puede superar los 500 caracteres.'),
})
