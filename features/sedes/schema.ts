import { z } from 'zod'

const phoneSchema = z.string().trim().regex(/^9\d{8}$/, 'Ingresa un celular peruano válido de 9 dígitos.')

export const createSedeSchema = z.object({
  name: z.string().trim().min(3, 'Escribe al menos 3 caracteres.').max(100),
  ruc: z.string().trim().refine((value) => value === '' || /^\d{11}$/.test(value), 'El RUC debe tener 11 dígitos.'),
  description: z.string().trim().refine(
    (value) => value === '' || (value.length >= 20 && value.length <= 600),
    'Si agregas una descripción, debe tener entre 20 y 600 caracteres.',
  ),
  primaryPhone: phoneSchema,
  secondaryPhone: z.string().trim().refine((value) => value === '' || /^9\d{8}$/.test(value), 'Ingresa un celular peruano válido.'),
  address: z.string().trim().min(5, 'Escribe una dirección más precisa.').max(250),
  latitude: z.string().trim().min(1, 'Selecciona la ubicación en el mapa.')
    .transform((value) => Number(value))
    .pipe(z.number().min(-90, 'Latitud fuera de rango.').max(90, 'Latitud fuera de rango.')),
  longitude: z.string().trim().min(1, 'Selecciona la ubicación en el mapa.')
    .transform((value) => Number(value))
    .pipe(z.number().min(-180, 'Longitud fuera de rango.').max(180, 'Longitud fuera de rango.')),
}).refine((data) => !(data.latitude === 0 && data.longitude === 0), {
  path: ['latitude'],
  message: 'Las coordenadas 0,0 no identifican tu sede.',
})
