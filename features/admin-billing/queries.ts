import 'server-only'

import { requireAdmin } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'

export type SubscriptionPriceVersion = {
  id: string
  codigo: string
  version: number
  moneda: string
  monto_base: number
  monto_sede_extra: number
  sedes_incluidas: number
  dias_gracia: number
  vigente_desde: string
  vigente_hasta: string | null
  es_vigente: boolean
}

export async function getSubscriptionPriceVersions(): Promise<SubscriptionPriceVersion[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('billing_obtener_precios_suscripcion_admin')

  if (error) {
    console.error('[admin-billing:prices]', { code: error.code })
    throw new Error('No se pudieron cargar las versiones de precio de suscripción.')
  }

  return (data ?? []).map((price) => ({
    ...price,
    vigente_hasta: price.vigente_hasta ?? null,
  }))
}
