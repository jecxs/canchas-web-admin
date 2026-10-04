import type { Tables } from '@/types/database.types'
import type { LocalPaymentMethod } from '@/features/payments/types'

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

export type BenefitCatalogItem = Pick<
  Tables<'beneficios_catalogo'>,
  'id' | 'slug' | 'nombre' | 'categoria' | 'icon_key' | 'orden'
>

export type LocalBenefit = Pick<
  Tables<'local_beneficios'>,
  'beneficio_catalogo_id' | 'nombre_personalizado'
>

export type SettingsActionState = {
  success: boolean
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export const initialSettingsActionState: SettingsActionState = { success: false }

export type { LocalPaymentMethod }
export type { PaymentMethodType } from '@/features/payments/types'
