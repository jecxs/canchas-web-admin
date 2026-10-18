import 'server-only'

import { createClient } from '@/utils/supabase/server'

export type BillingCheckoutOffer = {
  precio_version_id: string
  moneda: 'PEN'
  monto_base: number
  monto_sede_extra: number
  sedes_incluidas: number
  sedes_extra_minimas: number
  monto_minimo: number
}

export async function getBillingCheckoutOffer() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('billing_obtener_oferta_checkout')

  if (error) {
    console.error('[billing:checkout-offer]', { code: error.code })
    throw new Error('No se pudo cargar la oferta de suscripción.')
  }

  return (data?.[0] ?? null) as BillingCheckoutOffer | null
}
