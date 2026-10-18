'use client'

import { useMemo, useState, useTransition } from 'react'
import { CreditCardIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/utils/supabase/client'
import type { BillingCheckoutOffer } from './queries'

function formatPen(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value)
}

type CheckoutResponse = {
  checkout_url?: string
  error?: string
}

export function SubscriptionCheckoutCard({ offer }: { offer: BillingCheckoutOffer }) {
  const [extraLocations, setExtraLocations] = useState(offer.sedes_extra_minimas)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const total = useMemo(
    () => offer.monto_base + extraLocations * offer.monto_sede_extra,
    [extraLocations, offer.monto_base, offer.monto_sede_extra],
  )

  function startCheckout() {
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { data, error: invokeError } = await supabase.functions.invoke<CheckoutResponse>(
        'mercadopago-billing-checkout',
        {
          body: {
            sedes_extra: extraLocations,
            idempotency_key: crypto.randomUUID(),
          },
        },
      )

      if (invokeError || !data?.checkout_url) {
        setError(data?.error ?? 'No pudimos iniciar el checkout. Inténtalo de nuevo en unos minutos.')
        return
      }

      window.location.assign(data.checkout_url)
    })
  }

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle>Activa tu suscripción</CardTitle>
        <CardDescription>
          El plan incluye {offer.sedes_incluidas} sede{offer.sedes_incluidas === 1 ? '' : 's'}. Las sedes adicionales se integran al mismo contrato mensual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <label className="block max-w-xs space-y-2 text-sm font-semibold">
          Sedes adicionales
          <Input
            type="number"
            min={offer.sedes_extra_minimas}
            max={1000}
            value={extraLocations}
            onChange={(event) => {
              const value = Number(event.target.value)
              setExtraLocations(Number.isInteger(value) ? Math.max(offer.sedes_extra_minimas, value) : offer.sedes_extra_minimas)
            }}
          />
        </label>
        {offer.sedes_extra_minimas > 0 ? (
          <p className="text-sm text-muted-foreground">
            Necesitas al menos {offer.sedes_extra_minimas} sede{offer.sedes_extra_minimas === 1 ? '' : 's'} adicional{offer.sedes_extra_minimas === 1 ? '' : 'es'} para cubrir tus locales actuales.
          </p>
        ) : null}
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-4 text-sm"><span>Plan base</span><strong>{formatPen(offer.monto_base)}</strong></div>
          {extraLocations > 0 ? <div className="mt-2 flex items-center justify-between gap-4 text-sm"><span>{extraLocations} sede{extraLocations === 1 ? '' : 's'} adicional{extraLocations === 1 ? '' : 'es'}</span><strong>{formatPen(extraLocations * offer.monto_sede_extra)}</strong></div> : null}
          <div className="mt-4 flex items-center justify-between gap-4 border-t pt-4"><span className="font-bold">Total mensual</span><strong className="text-lg">{formatPen(total)}</strong></div>
        </div>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <Button type="button" className="w-full" size="lg" disabled={pending} onClick={startCheckout}>
          {pending ? <Spinner /> : <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />}
          {pending ? 'Abriendo Mercado Pago…' : 'Continuar con Mercado Pago'}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          El cobro se procesa en Mercado Pago. Grassly habilita el acceso solo cuando recibe y verifica la notificación del proveedor.
        </p>
      </CardContent>
    </Card>
  )
}
