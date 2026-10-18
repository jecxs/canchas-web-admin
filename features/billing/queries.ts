import 'server-only'

import { createClient } from '@/utils/supabase/server'
import { requireOwner } from '@/lib/auth/dal'
import type { Tables } from '@/types/database.types'

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

export type BillingOverview = {
  subscription: Pick<Tables<'suscripciones'>,
    'id' | 'estado' | 'fecha_proximo_cobro' | 'estado_facturacion' | 'monto' | 'moneda' | 'sedes_extra_contratadas' |
    'periodo_actual_fin' | 'proximo_cobro_at' | 'gracia_hasta' | 'mercadopago_preapproval_id' | 'metodo_pago_codigo'> | null
  invoices: Pick<Tables<'facturas_suscripcion'>,
    'id' | 'estado' | 'monto' | 'moneda' | 'periodo_inicio' | 'periodo_fin' | 'pagada_at'>[]
}

export async function getBillingOverview(): Promise<BillingOverview> {
  const context = await requireOwner()
  const supabase = await createClient()
  const { data: subscription, error } = await supabase
    .from('suscripciones')
    .select('id,estado,fecha_proximo_cobro,estado_facturacion,monto,moneda,sedes_extra_contratadas,periodo_actual_fin,proximo_cobro_at,gracia_hasta,mercadopago_preapproval_id,metodo_pago_codigo')
    .eq('dueno_id', context.userId)
    .maybeSingle()
  if (error) throw new Error('No se pudo cargar tu suscripción.')
  if (!subscription) return { subscription: null, invoices: [] }

  const { data: invoices, error: invoiceError } = await supabase
    .from('facturas_suscripcion')
    .select('id,estado,monto,moneda,periodo_inicio,periodo_fin,pagada_at')
    .eq('suscripcion_id', subscription.id)
    .order('periodo_inicio', { ascending: false })
    .limit(24)
  if (invoiceError) throw new Error('No se pudo cargar el historial de facturación.')
  return { subscription, invoices: invoices ?? [] }
}

export type BillingPlan = {
  sedes_incluidas: number
  sedes_extra_actuales: number
  monto_base: number
  monto_sede_extra: number
  sedes_extra_minimas: number
  sedes_extra_pendientes: number | null
  cambio_estado: string | null
  efectivo_desde: string | null
}

export async function getBillingPlan(): Promise<BillingPlan | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('billing_obtener_plan_propio')
  if (error) throw new Error('No se pudo cargar el plan contratado.')
  return (data?.[0] ?? null) as BillingPlan | null
}
