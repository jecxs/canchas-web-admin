import { z } from 'zod'

const requiredText = (label: string, minimum: number, maximum: number) =>
  z
    .string({ error: `${label} es obligatorio.` })
    .trim()
    .min(minimum, `${label} debe tener al menos ${minimum} caracteres.`)
    .max(maximum, `${label} no puede superar los ${maximum} caracteres.`)

export const ownerApplicationSchema = z.object({
  nombreLocal: requiredText('El nombre del local', 3, 120),
  telefono: z
    .string({ error: 'El celular es obligatorio.' })
    .trim()
    .regex(/^\d{9}$/, 'El celular debe tener exactamente 9 dígitos.'),
  dni: z
    .string({ error: 'El DNI es obligatorio.' })
    .trim()
    .regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos.'),
  direccion: requiredText('La dirección', 5, 240),
  ruc: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^\d{11}$/.test(value),
      'El RUC debe tener exactamente 11 dígitos.',
    ),
})
