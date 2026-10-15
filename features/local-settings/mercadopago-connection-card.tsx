'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/utils/supabase/client'

type ConnectionStatus = {
  ambiente: 'prueba'
  estado: 'sin_vincular' | 'activa' | 'requiere_reconexion' | 'desconectada'
  vendedor_mp_id: string | null
}

type PreferenceProbe = {
  preference_id: string | null
  test_amount_pen: number
  seller_matches: boolean
  grassly_fee_zero: boolean
  marketplace_registered: boolean
  checkout_origin: string | null
  ready_for_test_payment: boolean
  checkout_url: string | null
}

type TestPayment = {
  id: string | number
  status: string
  status_detail: string | null
  payment_method_id: string | null
  payment_type_id: string | null
  live_mode: boolean | null
  amount: number
  marketplace_fee: number | null
  net_received_amount: number | null
  fee_details: Array<{ type: string | null; amount: number | null }>
}

type PaymentProbe = { preference_id: string; payments: TestPayment[] }

type LocalSandboxStatus = {
  habilitado: boolean
}

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

export function MercadoPagoConnectionCard({ localId }: { localId: string }) {
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
  const [localSandboxEnabled, setLocalSandboxStatus] = useState<boolean | null>(null)
  const [checkingLocalSandbox, setCheckingLocalSandbox] = useState(false)

  const refreshStatus = useCallback(async () => {
    try {
      const { data, error } = await createClient().functions.invoke<ConnectionStatus>(
        'mercadopago-oauth-status', { body: { ambiente: 'prueba' } },
      )
      if (error || !data || data.ambiente !== 'prueba') throw error ?? new Error('status')
      setStatus(data)
      if (data.estado === 'activa') setWaiting(false)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(await responseMessage(error) ?? 'No pudimos consultar la conexión de pruebas. Vuelve a intentarlo.')
    } finally {
      setChecking(false)
    }
  }, [])

  const refreshLocalSandbox = useCallback(async () => {
    setCheckingLocalSandbox(true)
    try {
      const { data, error } = await createClient().functions.invoke<LocalSandboxStatus>(
        'mercadopago-local-sandbox', { body: { local_id: localId } },
      )
      if (error || !data) throw error ?? new Error('local-sandbox')
      setLocalSandboxStatus(data.habilitado)
    } catch (error) {
      setErrorMessage(await responseMessage(error) ?? 'No pudimos consultar la activación de pruebas del local.')
    } finally {
      setCheckingLocalSandbox(false)
    }
  }, [localId])

  useEffect(() => {
    const saved = window.sessionStorage.getItem('grassly-mp-test-probe-preference')
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
      setErrorMessage('Permite abrir una pestaña para autorizar la cuenta vendedora de prueba.')
      return
    }
    popup.opener = null
    setProbe(null)
    setPaymentProbe(null)
    setPreferenceId('')
    window.sessionStorage.removeItem('grassly-mp-test-probe-preference')
    setConnecting(true)
    setErrorMessage(null)
    try {
      const { data, error } = await createClient().functions.invoke<{ authorization_url: string }>(
        'mercadopago-oauth-start', { body: { ambiente: 'prueba' } },
      )
      if (error || !data?.authorization_url) throw error ?? new Error('start')
      const url = new URL(data.authorization_url)
      if (url.origin !== 'https://auth.mercadopago.com') throw new Error('origin')
      popup.location.replace(url.href)
      setWaiting(true)
    } catch (error) {
      popup.close()
      setErrorMessage(await responseMessage(error) ?? 'No se pudo iniciar la vinculación de pruebas. Comprueba tu sesión e inténtalo otra vez.')
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
        'mercadopago-test-preference', { body: {} },
      )
      if (error || !data) throw error ?? new Error('preference')
      setProbe(data)
      if (data.preference_id) {
        setPreferenceId(data.preference_id)
        window.sessionStorage.setItem('grassly-mp-test-probe-preference', data.preference_id)
      }
      if (!data.ready_for_test_payment || !checkoutUrl(data.checkout_url)) {
        setErrorMessage('Mercado Pago creó la preferencia, pero la validación del vendedor o del checkout requiere revisión.')
      }
    } catch (error) {
      setErrorMessage(await responseMessage(error) ?? 'No se pudo crear la preferencia de prueba.')
    } finally {
      setProbing(false)
    }
  }

  async function setLocalSandboxEnabled(habilitado: boolean) {
    setCheckingLocalSandbox(true)
    setErrorMessage(null)
    try {
      const { data, error } = await createClient().functions.invoke<LocalSandboxStatus>(
        'mercadopago-local-sandbox', { body: { local_id: localId, habilitado } },
      )
      if (error || !data) throw error ?? new Error('local-sandbox')
      setLocalSandboxStatus(data.habilitado)
    } catch (error) {
      setErrorMessage(await responseMessage(error) ?? 'No pudimos actualizar la activación de pruebas del local.')
    } finally {
      setCheckingLocalSandbox(false)
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
        'mercadopago-test-payment-status', { body: { preference_id: id } },
      )
      if (error || !data || data.preference_id !== id || !Array.isArray(data.payments)) throw error ?? new Error('payment')
      setPaymentProbe(data)
    } catch (error) {
      setErrorMessage(await responseMessage(error) ?? 'No pudimos consultar el pago de prueba. Reintenta en unos segundos.')
    } finally {
      setCheckingPayment(false)
    }
  }

  const connected = status?.estado === 'activa'
  const safeCheckoutUrl = probe?.ready_for_test_payment ? checkoutUrl(probe.checkout_url) : null

  return (
    <Card id="mercado-pago" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Mercado Pago · pruebas Marketplace</CardTitle>
        <CardDescription>Valida la conexión Marketplace con vendedor y comprador de prueba. No crea reservas ni cobra dinero real.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
          <p className="font-bold">{checking && !status ? 'Comprobando conexión…' : connected ? 'Cuenta de prueba vinculada' : 'Aún no hay una cuenta vinculada'}</p>
          <p className="mt-1 text-muted-foreground">{connected
            ? `Vendedor de prueba ${status.vendedor_mp_id ?? 'conectado'}. Si cambiaste la app integradora Marketplace, vuelve a vincular esta cuenta.`
            : 'Usa el vendedor de prueba creado fuera de la cuenta integradora Marketplace.'}</p>
        </div>
        {waiting && !connected && <p role="status" className="text-sm">Completa la autorización con el vendedor de prueba en la otra pestaña y vuelve aquí.</p>}
        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void connect()} disabled={connecting || checking}>
            {connecting && <Spinner />}{connected ? 'Volver a vincular vendedor de prueba' : 'Conectar vendedor de prueba'}
          </Button>
          <Button type="button" variant="outline" onClick={() => { setChecking(true); void refreshStatus() }} disabled={checking || connecting}>
            {checking && <Spinner />}Actualizar estado
          </Button>
        </div>
        {connected && <div className="space-y-3 rounded-2xl border p-4 text-sm">
          <div className="rounded-xl bg-muted/30 p-3">
            <p className="font-bold">Cobro de reservas en sandbox: {localSandboxEnabled === null ? 'sin consultar' : localSandboxEnabled ? 'habilitado' : 'deshabilitado'}</p>
            <p className="mt-1 text-muted-foreground">Este control prepara únicamente este local para la futura prueba de reservas. No activa cobros en el app ni modifica los pagos por comprobante.</p>
            {localSandboxEnabled === null ? (
              <Button type="button" className="mt-3" size="sm" variant="outline" onClick={() => void refreshLocalSandbox()} disabled={checkingLocalSandbox}>
                {checkingLocalSandbox && <Spinner />}Consultar activación sandbox
              </Button>
            ) : (
              <Button type="button" className="mt-3" size="sm" variant="outline" onClick={() => void setLocalSandboxEnabled(!localSandboxEnabled)} disabled={checkingLocalSandbox}>
                {checkingLocalSandbox && <Spinner />}{localSandboxEnabled ? 'Deshabilitar sandbox para este local' : 'Habilitar sandbox para este local'}
              </Button>
            )}
          </div>
          <p className="font-bold">Checkout sandbox · S/ 40.00 ficticios</p>
          <p className="text-muted-foreground">Abre Checkout Pro e ingresa con el comprador de prueba para pagar con saldo o una tarjeta de prueba. La comisión de Grassly es S/ 0 y no se crea una reserva.</p>
          <Button type="button" variant="outline" onClick={() => void createPreference()} disabled={probing}>
            {probing && <Spinner />}Preparar checkout de prueba
          </Button>
          {probe && <p role="status">Vendedor correcto: {probe.seller_matches ? 'sí' : 'no'} · Marketplace identificado: {probe.marketplace_registered ? 'sí' : 'no'} · Comisión Grassly S/ 0: {probe.grassly_fee_zero ? 'sí' : 'no'} · Importe: S/ {probe.test_amount_pen.toFixed(2)}.</p>}
          {safeCheckoutUrl && <Button type="button" asChild><a href={safeCheckoutUrl} target="_blank" rel="noopener noreferrer">Abrir Checkout Pro de prueba</a></Button>}
          <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
            <label htmlFor="mp-test-preference-id" className="font-medium">Consultar el pago de prueba</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="mp-test-preference-id" value={preferenceId} onChange={(event) => setPreferenceId(event.target.value)} placeholder="ID de preferencia" autoComplete="off" spellCheck={false} />
              <Button type="button" variant="outline" onClick={() => void checkPayment()} disabled={checkingPayment || !preferenceId.trim()}>
                {checkingPayment && <Spinner />}Consultar pago
              </Button>
            </div>
            {paymentProbe && (paymentProbe.payments.length === 0
              ? <p role="status">Aún no aparece un pago para esta preferencia. Vuelve a consultar después de completar el checkout.</p>
              : paymentProbe.payments.map((payment) => <p key={String(payment.id)}>
                Payment ID {payment.id}: <strong>{payment.status}</strong>{payment.status_detail ? ` · ${payment.status_detail}` : ''}
                {payment.payment_method_id ? ` · ${payment.payment_method_id}` : ''} · S/ {payment.amount.toFixed(2)}
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
