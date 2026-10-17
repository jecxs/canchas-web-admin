export const PLATFORM_PARAMETER_KEYS = [
  'porcentaje_adelanto_minimo',
  'minutos_expiracion_pendiente_pago',
  'minutos_expiracion_checkout_online',
  'monto_base_soles',
  'monto_addon_sede_soles',
  'palabras_prohibidas',
] as const

export type PlatformParameterKey = (typeof PLATFORM_PARAMETER_KEYS)[number]

// El nombre viaja como texto porque la definición cruza del server al cliente;
// el componente lo resuelve a un icono real.
export type PlatformParameterIcon = 'percent' | 'clock' | 'wallet' | 'money' | 'layers' | 'ban'

export type PlatformParameterAccent =
  | 'warning'
  | 'info'
  | 'plum'
  | 'success'
  | 'primary'
  | 'destructive'

export type PlatformParameterDefinition = {
  key: PlatformParameterKey
  title: string
  unit: string | null
  description: string
  impact: string | null
  input: 'number' | 'words'
  icon: PlatformParameterIcon
  accent: PlatformParameterAccent
  rangeLabel: string | null
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
      'Porcentaje de adelanto más bajo que se le permite pedir a un local antes de confirmar una reserva.',
    impact:
      'Si lo subes por encima del porcentaje que un local ya tenía configurado, ese local queda con un valor inválido: no podrá guardar ningún cambio en su panel hasta corregirlo, y verá un aviso que le bloquea la pantalla.',
    input: 'number',
    icon: 'percent',
    accent: 'warning',
    rangeLabel: '1 – 100 %',
    min: 1,
    max: 100,
    step: 1,
  },
  {
    key: 'minutos_expiracion_pendiente_pago',
    title: 'Expiración del pago pendiente',
    unit: 'min',
    description:
      'Cuánto tiempo tiene el cliente para pagar el adelanto y subir su comprobante después de apartar un horario. Si no lo hace, el horario se libera solo.',
    impact:
      'El aviso que ve el cliente en el app se arma con este valor, así que el cambio se refleja solo. Debe quedar entre 1 y 60 minutos.',
    input: 'number',
    icon: 'clock',
    accent: 'info',
    rangeLabel: '1 – 60 min',
    min: 1,
    max: 60,
    step: 1,
  },
  {
    key: 'minutos_expiracion_checkout_online',
    title: 'Expiración del checkout online',
    unit: 'min',
    description:
      'Cuánto tiempo tiene el cliente para completar un pago en línea con Mercado Pago después de apartar un horario.',
    impact:
      'Solo afecta a los pagos en línea. Quienes pagan subiendo comprobante usan el tiempo del parámetro anterior. Los pagos en línea todavía no están habilitados en el app.',
    input: 'number',
    icon: 'wallet',
    accent: 'plum',
    rangeLabel: '1 – 60 min',
    min: 1,
    max: 60,
    step: 1,
  },
  {
    key: 'monto_base_soles',
    title: 'Monto base de suscripción',
    unit: 'S/',
    description: 'Cuánto paga al mes un propietario por su primera sede.',
    impact: null,
    input: 'number',
    icon: 'money',
    accent: 'success',
    rangeLabel: '0 – 100 000 S/',
    min: 0,
    max: 100000,
    step: 0.01,
  },
  {
    key: 'monto_addon_sede_soles',
    title: 'Add-on por sede adicional',
    unit: 'S/',
    description:
      'Cuánto se suma a la mensualidad por cada sede adicional que contrata un propietario, y cuántos locales puede tener en total.',
    impact: null,
    input: 'number',
    icon: 'layers',
    accent: 'primary',
    rangeLabel: '0 – 100 000 S/',
    min: 0,
    max: 100000,
    step: 0.01,
  },
  {
    key: 'palabras_prohibidas',
    title: 'Palabras prohibidas',
    unit: null,
    description:
      'Palabras que Grassly filtra en el contenido que publican los locales. Escríbelas una por línea o separadas por coma.',
    impact: null,
    input: 'words',
    icon: 'ban',
    accent: 'destructive',
    rangeLabel: 'Máx. 500 palabras · 60 caracteres c/u',
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