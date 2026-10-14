'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/utils/supabase/client'

type ConnectionStatus = {
  ambiente: 'produccion'
  estado: 'sin_vincular' | 'activa' | 'requiere_reconexion' | 'desconectada'
  vendedor_mp_id: string | null
}

type PreferenceProbe = {
  preference_id: string | null
  production_test_amount_pen: number
  seller_matches: boolean
  grassly_fee_zero: boolean
  marketplace_registered: boolean
  checkout_origin: string | null
  ready_for_real_payment: boolean
  checkout_url: string | null
}

type TestPayment = {
  id: string | number
  status: string
  status_detail: string | null
  payment_method_id: string | null
  live_mode: boolean | null
  amount: number
  marketplace_fee: number | null
  net_received_amount: number | null
  fee_details: Array<{ type: string | null; amount: number | null }>
}

type PaymentProbe = { preference_id: string; payments: TestPayment[] }

const CHECKOUT_ORIGINS = new Set([
  'https://www.mercadopago.com',
  'https://www.mercadopago.com.pe',
  'https://mercadopago.com',
  'https://mercadopago.com.pe',
])

function checkoutUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return CHECKOUT_ORIGINS.has(url.origin) ? url.href : null
  } catch {
    return null
  }
}

async function responseMessage(error: unknown): Promise<string | null> {
  if (!error || typeof error !== 'object' || !('context' in error) || !(error.context instanceof Response)) return null
  const body = await error.context.json().catch(() => null)
  return body && typeof body.error === 'string' ? body.error : null
}

export function MercadoPagoConnectionCard() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [checking, setChecking] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [probing, setProbing] = useState(false)
  const [probe, setProbe] = useState<PreferenceProbe | null>(null)
  const [preferenceId, setPreferenceId] = useState('')
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [paymentProbe, setPaymentProbe] = useState<PaymentProbe | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshStatus = useCallback(async () => {
    try {
      const { data, error } = await createClient().functions.invoke<ConnectionStatus>(
        'mercadopago-oauth-status', { body: { ambiente: 'produccion' } },
      )
      if (error || !data || data.ambiente !== 'produccion') throw error ?? new Error('status')
      setStatus(data)
      if (data.estado === 'activa') setWaiting(false)
      setErrorMessage(null)
    } catch {
      setErrorMessage('No pudimos consultar la conexión. Vuelve a intentarlo.')
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    const saved = window.sessionStorage.getItem('grassly-mp-production-probe-preference')
    const restoreId = saved && /^[\w-]{8,120}$/.test(saved)
      ? window.setTimeout(() => setPreferenceId(saved), 0)
      : null
    const initialCheck = window.setTimeout(() => { void refreshStatus() }, 0)
    const onFocus = () => { void refreshStatus() }
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearTimeout(initialCheck)
      if (restoreId !== null) window.clearTimeout(restoreId)
      window.removeEventListener('focus', onFocus)
    }
  }, [refreshStatus])

  async function connect() {
    const popup = window.open('about:blank', '_blank')
    if (!popup) {
      setErrorMessage('Permite abrir una pestaña para autorizar tu cuenta de Mercado Pago.')
      return
    }
    popup.opener = null
    setProbe(null)
    setPaymentProbe(null)
    setPreferenceId('')
    window.sessionStorage.removeItem('grassly-mp-production-probe-preference')
    setConnecting(true)
    setErrorMessage(null)
    try {
      const { data, error } = await createClient().functions.invoke<{ authorization_url: string }>(
        'mercadopago-oauth-start', { body: { ambiente: 'produccion' } },
      )
      if (error || !data?.authorization_url) throw error ?? new Error('start')
      const url = new URL(data.authorization_url)
      if (url.origin !== 'https://auth.mercadopago.com') throw new Error('origin')
      popup.location.replace(url.href)
      setWaiting(true)
    } catch (error) {
      popup.close()
      setErrorMessage(await responseMessage(error) ?? 'No se pudo iniciar la vinculación. Comprueba tu sesión e inténtalo otra vez.')
    } finally {
      setConnecting(false)
    }
  }

  async function createPreference() {
    setProbing(true)
    setProbe(null)
    setPaymentProbe(null)
    setErrorMessage(null)
    try {
      const { data, error } = await createClient().functions.invoke<PreferenceProbe>(
        'mercadopago-production-preference', { body: {} },
      )
      if (error || !data) throw error ?? new Error('preference')
      setProbe(data)
      if (data.preference_id) {
        setPreferenceId(data.preference_id)
        window.sessionStorage.setItem('grassly-mp-production-probe-preference', data.preference_id)
      }
      if (!data.ready_for_real_payment || !checkoutUrl(data.checkout_url)) {
        setErrorMessage('Mercado Pago creó la preferencia, pero la validación del vendedor o del checkout requiere revisión.')
      }
    } catch (error) {
      setErrorMessage(await responseMessage(error) ?? 'No se pudo crear la preferencia productiva.')
    } finally {
      setProbing(false)
    }
  }

  async function checkPayment() {
    const id = preferenceId.trim()
    if (!/^[\w-]{8,120}$/.test(id)) {
      setErrorMessage('Ingresa un ID de preferencia válido.')
      return
    }
    setCheckingPayment(true)
    setPaymentProbe(null)
    setErrorMessage(null)
    try {
      const { data, error } = await createClient().functions.invoke<PaymentProbe>(
        'mercadopago-production-payment-status', { body: { preference_id: id } },
      )
      if (error || !data || data.preference_id !== id || !Array.isArray(data.payments)) throw error ?? new Error('payment')
      setPaymentProbe(data)
    } catch (error) {
      setErrorMessage(await responseMessage(error) ?? 'No pudimos consultar el pago. Reintenta en unos segundos.')
    } finally {
      setCheckingPayment(false)
    }
  }

  const connected = status?.estado === 'activa'
  const safeCheckoutUrl = probe?.ready_for_real_payment ? checkoutUrl(probe.checkout_url) : null

  return (
    <Card id="mercado-pago" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Mercado Pago</CardTitle>
        <CardDescription>Prueba una compra productiva de bajo monto con la cuenta vendedora antes de continuar la certificación de Mercado Pago.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
          <p className="font-bold">{checking && !status ? 'Comprobando conexión…' : connected ? 'Cuenta vinculada' : 'Aún no hay una cuenta vinculada'}</p>
          <p className="mt-1 text-muted-foreground">{connected
            ? `Vendedor ${status.vendedor_mp_id ?? 'conectado'} en producción. Si cambiaste las credenciales de la app integradora, vuelve a conectar esta cuenta.`
            : 'Vincula una cuenta vendedora real de Perú. Esta prueba no crea ni confirma reservas.'}</p>
        </div>
        {waiting && !connected && <p role="status" className="text-sm">Completa la autorización en la otra pestaña y vuelve aquí.</p>}
        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void connect()} disabled={connecting || checking}>
            {connecting && <Spinner />}{connected ? 'Volver a conectar cuenta real' : 'Conectar cuenta vendedora real'}
          </Button>
          <Button type="button" variant="outline" onClick={() => { setChecking(true); void refreshStatus() }} disabled={checking || connecting}>
            {checking && <Spinner />}Actualizar estado
          </Button>
        </div>
        {connected && <div className="space-y-3 rounded-2xl border p-4 text-sm">
          <p className="font-bold">Compra real de verificación · S/ 1.00</p>
          <p className="text-muted-foreground">El checkout cobrará S/ 1.00 real a tu medio de pago y abonará al vendedor, descontando los cargos que Mercado Pago aplique. No corresponde a una reserva y Grassly no hará un reembolso automático. Usa esta compra solo para la medición de calidad.</p>
          <Button type="button" variant="outline" onClick={() => void createPreference()} disabled={probing}>
            {probing && <Spinner />}Preparar checkout real de S/ 1
          </Button>
          {probe && <p role="status">Vendedor correcto: {probe.seller_matches ? 'sí' : 'no'} · Marketplace identificado: {probe.marketplace_registered ? 'sí' : 'no'} · Comisión Grassly S/ 0: {probe.grassly_fee_zero ? 'sí' : 'no'} · Importe: S/ {probe.production_test_amount_pen.toFixed(2)}.</p>}
          {safeCheckoutUrl && <Button type="button" asChild><a href={safeCheckoutUrl} target="_blank" rel="noopener noreferrer">Abrir Checkout Pro</a></Button>}
          <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
            <label htmlFor="mp-production-preference-id" className="font-medium">Consultar el pago productivo</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="mp-production-preference-id" value={preferenceId} onChange={(event) => setPreferenceId(event.target.value)} placeholder="ID de preferencia" autoComplete="off" spellCheck={false} />
              <Button type="button" variant="outline" onClick={() => void checkPayment()} disabled={checkingPayment || !preferenceId.trim()}>
                {checkingPayment && <Spinner />}Consultar pago
              </Button>
            </div>
            {paymentProbe && (paymentProbe.payments.length === 0
              ? <p role="status">Aún no aparece un pago para esta preferencia. Vuelve a consultar después de completar el checkout.</p>
              : paymentProbe.payments.map((payment) => <p key={String(payment.id)}>
                Payment ID {payment.id}: <strong>{payment.status}</strong>{payment.status_detail ? ` · ${payment.status_detail}` : ''}
                {payment.payment_method_id ? ` · ${payment.payment_method_id}` : ''} · S/ {payment.amount.toFixed(2)}
                {` · Productivo: ${payment.live_mode === true ? 'sí' : 'no'}`}
                {' · '}Comisión Grassly: {payment.marketplace_fee === null ? 'sin dato' : `S/ ${payment.marketplace_fee.toFixed(2)}`}
                {' · '}Neto vendedor: {payment.net_received_amount === null ? 'pendiente' : `S/ ${payment.net_received_amount.toFixed(2)}`}
                {payment.fee_details?.length ? ` · Cargos MP: ${payment.fee_details.map((fee) => `${fee.type ?? 'sin tipo'} ${fee.amount === null ? 'sin monto' : `S/ ${fee.amount.toFixed(2)}`}`).join(', ')}` : ''}
              </p>))}
          </div>
        </div>}
      </CardContent>
    </Card>
  )
}
