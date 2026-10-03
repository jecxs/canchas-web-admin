import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { BenefitCatalogItem, LocalBenefit, LocalPhoto, LocalSettings, ScheduleRow } from './types'
import type { LocalPaymentMethod, PaymentMethodType } from '@/features/payments/types'

function parseMinimumAdvancePercentage(value: unknown) {
  const percentage = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(percentage) && percentage >= 1 && percentage <= 100 ? percentage : null
}

export async function getLocalSettings() {
  const { context, local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const [{ data: settings, error: settingsError }, { data: schedules, error: schedulesError }, { data: photos, error: photosError }, { data: benefitCatalog, error: benefitCatalogError }, { data: benefits, error: benefitsError }, { data: paymentMethods, error: paymentMethodsError }, { data: minimumAdvancePercentage, error: minimumAdvancePercentageError }] = await Promise.all([
    supabase
      .from('locales')
      .select('id,nombre,descripcion,ruc,telefono_contacto_principal,telefono_contacto_secundario,direccion,latitud,longitud,porcentaje_adelanto,medios_pago_adelanto,politica_reembolso,logo,publicado')
      .eq('id', local.id)
      .single(),
    supabase
      .from('horarios_atencion')
      .select('dia_semana,hora_apertura,hora_cierre')
      .eq('local_id', local.id)
      .order('dia_semana'),
    supabase
      .from('fotos')
      .select('id,storage_path,orden')
      .eq('local_id', local.id)
      .order('orden'),
    supabase
      .from('beneficios_catalogo')
      .select('id,slug,nombre,categoria,icon_key,orden')
      .eq('activo', true)
      .order('orden'),
    supabase
      .from('local_beneficios')
      .select('beneficio_catalogo_id,nombre_personalizado')
      .eq('local_id', local.id)
      .order('created_at'),
    supabase
      .from('local_medios_pago')
      .select('id,tipo,nombre_visible,titular,telefono,banco,numero_cuenta,cci,activo')
      .eq('local_id', local.id)
      .order('created_at'),
    supabase.rpc('obtener_minimo_adelanto_global'),
  ])

  const parsedMinimumAdvancePercentage = parseMinimumAdvancePercentage(minimumAdvancePercentage)
  if (settingsError || schedulesError || photosError || benefitCatalogError || benefitsError || paymentMethodsError || minimumAdvancePercentageError || !settings || parsedMinimumAdvancePercentage === null) {
    console.error('[local-settings:read]', { code: settingsError?.code ?? schedulesError?.code ?? photosError?.code ?? benefitCatalogError?.code ?? benefitsError?.code ?? paymentMethodsError?.code ?? minimumAdvancePercentageError?.code })
    throw new Error('No se pudo cargar la configuración del local.')
  }

  return {
    context,
    local,
    settings: settings as LocalSettings,
    schedules: (schedules ?? []) as ScheduleRow[],
    photos: (photos ?? []) as LocalPhoto[],
    benefitCatalog: (benefitCatalog ?? []) as BenefitCatalogItem[],
    benefits: (benefits ?? []) as LocalBenefit[],
    paymentMethods: (paymentMethods ?? []).map((method): LocalPaymentMethod => ({
      id: method.id,
      type: method.tipo as PaymentMethodType,
      name: method.nombre_visible,
      holder: method.titular,
      phone: method.telefono,
      bank: method.banco,
      accountNumber: method.numero_cuenta,
      cci: method.cci,
      active: method.activo,
    })),
    minimumAdvancePercentage: parsedMinimumAdvancePercentage,
  }
}
