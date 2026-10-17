export const PLATFORM_PARAMETER_KEYS = [
  'porcentaje_adelanto_minimo',
  'minutos_expiracion_pendiente_pago',
  'minutos_expiracion_checkout_online',
  'monto_base_soles',
  'monto_addon_sede_soles',
  'palabras_prohibidas',
] as const

export type PlatformParameterKey = (typeof PLATFORM_PARAMETER_KEYS)[number]

export type PlatformParameterDefinition = {
  key: PlatformParameterKey
  title: string
  unit: string | null
  description: string
  impact: string | null
  input: 'number' | 'words'
  min?: number
  max?: number
  step?: number
}

export const PLATFORM_PARAMETERS: readonly PlatformParameterDefinition[] = [
  {
    key: 'porcentaje_adelanto_minimo',
    title: 'Adelanto mínimo global',
    unit: '%',
    description:
      'Piso que se le exige a todos los locales. Lo valida el trigger fn_validar_porcentaje_adelanto en cada escritura de locales.porcentaje_adelanto.',
    impact:
      'Subirlo por encima del valor ya configurado en un local invalida el valor de ese local: no podrá guardar ningún cambio hasta corregirlo.',
    input: 'number',
    min: 1,
    max: 100,
    step: 1,
  },
  {
    key: 'minutos_expiracion_pendiente_pago',
    title: 'Expiración del pago pendiente',
    unit: 'min',
    description:
      'Tiempo que el cliente tiene para subir el comprobante antes de que la reserva se libere automáticamente.',
    impact:
      'La app móvil muestra "10 minutos" escrito directamente en el texto del checkout: cambiar este valor deja la app diciendo algo distinto a la base.',
    input: 'number',
    min: 1,
    max: 60,
    step: 1,
  },
  {
    key: 'minutos_expiracion_checkout_online',
    title: 'Expiración del checkout online',
    unit: 'min',
    description:
      'Tiempo que el cliente tiene para completar el pago con MercadoPago antes de que el backend inicie su conciliación.',
    impact:
      'Solo aplica a las reservas que entran en estado checkout_online. Las reservas con comprobante manual siguen usando el parámetro anterior. Este flujo todavía no está habilitado en el app.',
    input: 'number',
    min: 1,
    max: 60,
    step: 1,
  },
  {
    key: 'monto_base_soles',
    title: 'Monto base de suscripción',
    unit: 'S/',
    description: 'Precio mensual de la suscripción de un propietario con una sede.',
    impact: null,
    input: 'number',
    min: 0,
    max: 100000,
    step: 0.01,
  },
  {
    key: 'monto_addon_sede_soles',
    title: 'Add-on por sede adicional',
    unit: 'S/',
    description:
      'Precio que se suma por cada sede extra contratada. Determina el cupo de locales mediante fn_cupo_locales.',
    impact: null,
    input: 'number',
    min: 0,
    max: 100000,
    step: 0.01,
  },
  {
    key: 'palabras_prohibidas',
    title: 'Palabras prohibidas',
    unit: null,
    description: 'Filtro aplicado al contenido que publican los locales. Una por línea o separadas por coma.',
    impact: null,
    input: 'words',
  },
]

export type PlatformParameterRow = {
  key: PlatformParameterKey
  value: number | string[] | null
  description: string | null
}

export type PlatformParameterState = {
  success: boolean
  message?: string
  requiresForce?: boolean
  affectedLocals?: number
}

export const initialPlatformParameterState: PlatformParameterState = { success: false }

export function formatPlatformValue(value: number | string[] | null, unit: string | null) {
  if (value === null) return 'Sin configurar'
  if (Array.isArray(value)) return `${value.length} ${value.length === 1 ? 'palabra' : 'palabras'}`
  return unit === 'S/' ? `S/ ${value.toFixed(2)}` : `${value}${unit ? ` ${unit}` : ''}`
}