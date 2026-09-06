import { z } from 'zod'

export const courtSchema = z.object({
  localId: z.uuid(),
  courtId: z.union([z.uuid(), z.literal('')]).transform((value) => value || null),
  name: z.string().trim().min(2, 'Escribe un nombre para la cancha.').max(80),
  surface: z.string().trim().max(60),
  sports: z.array(z.object({
    deporte_id: z.uuid(),
    tipo: z.enum(['dedicada', 'adaptada']),
    precio: z.coerce.number().positive('El precio debe ser mayor que cero.').max(10000),
  })).min(1, 'Selecciona al menos un deporte.'),
})

export const courtStatusSchema = z.object({
  localId: z.uuid(),
  courtId: z.uuid(),
  active: z.enum(['true', 'false']).transform((value) => value === 'true'),
})
