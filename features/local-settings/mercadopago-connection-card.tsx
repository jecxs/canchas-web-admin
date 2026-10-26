'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/utils/supabase/client'

type ConnectionStatus = {
  ambiente: 'produccion'
  estado: 'sin_vincular' | 'activa' | 'requiere_reconexion' | 'desconectada'
  vendedor_mp_id: string | null
}

type LocalPaymentsStatus = {
  habilitado: boolean
}

const MERCADO_PAGO_AUTH_ORIGINS = new Set([
  'https://auth.mercadopago.com.pe',
  'https://auth.mercadopago.com',
])

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
  const [localPaymentsEnabled, setLocalPaymentsEnabled] = useState<boolean | null>(null)
  const [checkingLocalPayments, setCheckingLocalPayments] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshLocalPayments = useCallback(async () => {
    setCheckingLocalPayments(true)
    try {
      const { data, error } = await createClient().functions.invoke<LocalPaymentsStatus>(
        'mercadopago-local-sandbox', { body: { local_id: localId } },
      )
      if (error || !data) throw error ?? new Error('local-payments')
      setLocalPaymentsEnabled(data.habilitado)
    } catch (error) {
      setErrorMessage(await responseMessage(error) ?? 'No pudimos consultar el cobro online de este local.')
    } finally {
      setCheckingLocalPayments(false)
    }
  }, [localId])

  const refreshStatus = useCallback(async () => {
    try {
      const { data, error } = await createClient().functions.invoke<ConnectionStatus>(
        'mercadopago-oauth-status', { body: { ambiente: 'produccion' } },
      )
      if (error || !data || data.ambiente !== 'produccion') throw error ?? new Error('status')
      setStatus(data)
      if (data.estado === 'activa') {
        setWaiting(false)
        void refreshLocalPayments()
      }
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(await responseMessage(error) ?? 'No pudimos consultar la conexión de Mercado Pago. Vuelve a intentarlo.')
    } finally {
      setChecking(false)
    }
  }, [refreshLocalPayments])

  useEffect(() => {
    const initialCheck = window.setTimeout(() => { void refreshStatus() }, 0)
    const onFocus = () => { void refreshStatus() }
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearTimeout(initialCheck)
      window.removeEventListener('focus', onFocus)
    }
  }, [refreshStatus])

  const connected = status?.estado === 'activa'

  async function connect() {
    const popup = window.open('about:blank', '_blank')
    if (!popup) {
      setErrorMessage('Permite abrir una pestaña para autorizar la cuenta de Mercado Pago.')
      return
    }
    popup.opener = null
    setConnecting(true)
    setErrorMessage(null)
    try {
      const { data, error } = await createClient().functions.invoke<{ authorization_url: string }>(
        'mercadopago-oauth-start', { body: { ambiente: 'produccion' } },
      )
      if (error || !data?.authorization_url) throw error ?? new Error('start')
      const url = new URL(data.authorization_url)
      if (!MERCADO_PAGO_AUTH_ORIGINS.has(url.origin)) throw new Error('origin')
      popup.location.replace(url.href)
      setWaiting(true)
    } catch (error) {
      popup.close()
      setErrorMessage(await responseMessage(error) ?? 'No se pudo iniciar la vinculación con Mercado Pago. Comprueba tu sesión e inténtalo otra vez.')
    } finally {
      setConnecting(false)
    }
  }

  async function setLocalPayments(habilitado: boolean) {
    setCheckingLocalPayments(true)
    setErrorMessage(null)
    try {
      const { data, error } = await createClient().functions.invoke<LocalPaymentsStatus>(
        'mercadopago-local-sandbox', { body: { local_id: localId, habilitado } },
      )
      if (error || !data) throw error ?? new Error('local-payments')
      setLocalPaymentsEnabled(data.habilitado)
    } catch (error) {
      setErrorMessage(await responseMessage(error) ?? 'No pudimos actualizar el cobro online de este local.')
    } finally {
      setCheckingLocalPayments(false)
    }
  }

  return (
    <Card id="mercado-pago" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Mercado Pago · cobros online</CardTitle>
        <CardDescription>Conecta la cuenta real del local para recibir el adelanto de las reservas. Grassly no retiene comisión por reserva.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
          <p className="font-bold">{checking && !status ? 'Comprobando conexión…' : connected ? 'Cuenta de Mercado Pago vinculada' : 'Aún no hay una cuenta vinculada'}</p>
          <p className="mt-1 text-muted-foreground">{connected
            ? `Vendedor ${status.vendedor_mp_id ?? 'conectado'}. Los pagos aprobados se acreditan en esta cuenta.`
            : 'Inicia sesión con la cuenta real del dueño o del local. No uses cuentas de prueba.'}</p>
        </div>
        {waiting && !connected && <p role="status" className="text-sm">Completa la autorización en la otra pestaña y vuelve aquí.</p>}
        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void connect()} disabled={connecting || checking}>
            {connecting && <Spinner />}{connected ? 'Volver a vincular cuenta' : 'Conectar cuenta de Mercado Pago'}
          </Button>
          <Button type="button" variant="outline" onClick={() => { setChecking(true); void refreshStatus() }} disabled={checking || connecting}>
            {checking && <Spinner />}Actualizar estado
          </Button>
        </div>
        {connected && <div className="space-y-3 rounded-2xl border p-4 text-sm">
          <div className="rounded-xl bg-muted/30 p-3">
            <p className="font-bold">Cobro online para este local: {localPaymentsEnabled === null ? 'sin consultar' : localPaymentsEnabled ? 'habilitado' : 'deshabilitado'}</p>
            <p className="mt-1 text-muted-foreground">Al habilitarlo, los clientes podrán pagar el adelanto con dinero real desde el app. Puedes deshabilitarlo cuando quieras; los pagos por comprobante no se modifican.</p>
            <Button
              type="button"
              className="mt-3"
              size="sm"
              variant={localPaymentsEnabled ? 'outline' : 'default'}
              onClick={() => void setLocalPayments(!localPaymentsEnabled)}
              disabled={checkingLocalPayments || localPaymentsEnabled === null}
            >
              {checkingLocalPayments && <Spinner />}{localPaymentsEnabled ? 'Deshabilitar cobro online' : 'Habilitar cobro online'}
            </Button>
          </div>
          <p className="text-muted-foreground">La conexión se renueva automáticamente. Si Mercado Pago invalida el acceso, el panel pedirá volver a vincular la cuenta.</p>
        </div>}
      </CardContent>
    </Card>
  )
}
