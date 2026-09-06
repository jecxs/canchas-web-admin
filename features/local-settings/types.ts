import type { Json, Tables } from '@/types/database.types'

export type LocalSettings = Pick<
  Tables<'locales'>,
  | 'id'
  | 'nombre'
  | 'descripcion'
  | 'ruc'
  | 'telefono_contacto_principal'
  | 'telefono_contacto_secundario'
  | 'direccion'
  | 'latitud'
  | 'longitud'
  | 'porcentaje_adelanto'
  | 'medios_pago_adelanto'
  | 'politica_reembolso'
  | 'logo'
  | 'publicado'
>

export type ScheduleRow = Pick<
  Tables<'horarios_atencion'>,
  'dia_semana' | 'hora_apertura' | 'hora_cierre'
>

export type LocalPhoto = Pick<Tables<'fotos'>, 'id' | 'storage_path' | 'orden'>

export type PaymentMethodType = 'yape' | 'plin' | 'transferencia' | 'efectivo' | 'otro'

export type PaymentMethod = {
  tipo: PaymentMethodType
  detalle: string
}

export type SettingsActionState = {
  success: boolean
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export const initialSettingsActionState: SettingsActionState = { success: false }

export function parsePaymentMethods(value: Json): PaymentMethod[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const tipo = item.tipo
    const detalle = item.detalle
    if (
      typeof tipo !== 'string'
      || !['yape', 'plin', 'transferencia', 'efectivo', 'otro'].includes(tipo)
      || typeof detalle !== 'string'
    ) return []
    return [{ tipo: tipo as PaymentMethodType, detalle }]
  })
}
