'use client'

import { useState, useTransition } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import type { Tables } from '@/types/database.types'
import type { BillingPlan } from './queries'

type InvokeResult = { ok?: boolean; message?: string; error?: string }

function money(amount: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)
}

function date(value: string | null | undefined) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(value))
}

async function readInvokeError(invokeError: unknown, data: InvokeResult | null) {
  if (data?.error) return data.error

  const response = (invokeError as { context?: unknown } | null)?.context
  if (response instanceof Response) {
    try {
      const body = await response.clone().json() as InvokeResult
      if (typeof body.error === 'string' && body.error) return body.error
    } catch {
      // Fall through to the generic message below.
    }
  }

  return null
}

export function SubscriptionSeatsCard({ plan, subscription }: {
  plan: BillingPlan
  subscription: Pick<Tables<'suscripciones'>, 'estado_facturacion'>
}) {
  const scheduled = plan.sedes_extra_pendientes !== null
  const currentAmount =
    Number(plan.monto_base) + Number(plan.sedes_extra_actuales) * Number(plan.monto_sede_extra)
  const scheduledAmount = scheduled
    ? Number(plan.monto_base) + Number(plan.sedes_extra_pendientes) * Number(plan.monto_sede_extra)
    : null

  const [extras, setExtras] = useState(plan.sedes_extra_actuales)
  const [pending, startTransition] = useTransition()
  const [cancelling, startCancelTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const total = Number(plan.monto_base) + extras * Number(plan.monto_sede_extra)

  function submit() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const supabase = createClient()
      const { data, error: invokeError } = await supabase.functions.invoke<InvokeResult>(
        'mercadopago-billing-change-seats',
        { body: { sedes_extra: extras, idempotency_key: crypto.randomUUID() } },
      )
      if (invokeError || !data?.ok) {
        setError((await readInvokeError(invokeError, data)) ?? 'No se pudo programar el cambio. Revisa el estado de la suscripción.')
        return
      }
      setMessage(data.message ?? 'Cambio programado.')
      window.location.reload()
    })
  }

  function cancel() {
    setError(null)
    setMessage(null)
    startCancelTransition(async () => {
      const supabase = createClient()
      const { data, error: invokeError } = await supabase.functions.invoke<InvokeResult>(
        'mercadopago-billing-cancel-seats',
        { body: {} },
      )
      if (invokeError || !data?.ok) {
        setError((await readInvokeError(invokeError, data)) ?? 'No se pudo cancelar el cambio. Inténtalo de nuevo.')
        return
      }
      setMessage(data.message ?? 'Cambio cancelado.')
      window.location.reload()
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>Sedes del plan</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>
          El plan incluye {plan.sedes_incluidas} sede{plan.sedes_incluidas === 1 ? '' : 's'} y hoy tienes{' '}
          {plan.sedes_extra_actuales} adicional{plan.sedes_extra_actuales === 1 ? '' : 'es'} contratada{plan.sedes_extra_actuales === 1 ? '' : 's'}.
        </p>

        {scheduled ? (
          <>
            <Alert>
              <AlertTitle>
                Cambio programado: {plan.sedes_extra_pendientes === 0
                  ? 'sin sedes adicionales'
                  : `${plan.sedes_extra_pendientes} sede${plan.sedes_extra_pendientes === 1 ? '' : 's'} adicional${plan.sedes_extra_pendientes === 1 ? '' : 'es'}`}
              </AlertTitle>
              <AlertDescription>
                {plan.cambio_estado === 'programado'
                  ? `Tu próximo cobro será de ${money(scheduledAmount!)} en lugar de ${money(currentAmount)}. El cupo de sedes se actualizará cuando se apruebe ese cobro${date(plan.efectivo_desde) ? ` (a partir del ${date(plan.efectivo_desde)})` : ''}.`
                  : 'El cambio quedó en revisión y se confirmará con la próxima renovación.'}
              </AlertDescription>
            </Alert>
            <Button
              type="button"
              variant="secondary"
              disabled={cancelling || subscription.estado_facturacion !== 'activa'}
              onClick={cancel}
            >
              {cancelling ? 'Cancelando…' : 'Cancelar cambio'}
            </Button>
          </>
        ) : (
          <>
            <label className="block max-w-xs space-y-2 font-semibold">
              Sedes adicionales para el próximo mes
              <Input
                type="number"
                min={plan.sedes_extra_minimas}
                max={1000}
                value={extras}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  setExtras(Number.isInteger(value) ? Math.max(plan.sedes_extra_minimas, Math.min(1000, value)) : plan.sedes_extra_actuales)
                }}
              />
            </label>
            <p className="text-muted-foreground">
              Nuevo importe mensual: <strong className="text-foreground">{money(total)}</strong>. El cupo cambia después de aprobarse la próxima renovación.
            </p>
            {extras < plan.sedes_extra_actuales ? (
              <p className="text-muted-foreground">Para reducir sedes, retira primero los locales que excedan el nuevo cupo.</p>
            ) : null}
            <Button
              type="button"
              disabled={pending || extras === plan.sedes_extra_actuales || subscription.estado_facturacion !== 'activa'}
              onClick={submit}
            >
              {pending ? 'Programando…' : 'Programar cambio'}
            </Button>
          </>
        )}

        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {message ? <Alert><AlertDescription>{message}</AlertDescription></Alert> : null}
      </CardContent>
    </Card>
  )
}
