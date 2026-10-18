'use client'

import { useState, useTransition } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import type { Tables } from '@/types/database.types'

type Plan = {
  sedes_incluidas: number
  sedes_extra_actuales: number
  monto_base: number
  monto_sede_extra: number
  sedes_extra_minimas: number
  sedes_extra_pendientes: number | null
  cambio_estado: string | null
  efectivo_desde: string | null
}

function money(amount: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)
}

export function SubscriptionSeatsCard({ plan, subscription }: {
  plan: Plan
  subscription: Pick<Tables<'suscripciones'>, 'estado_facturacion'>
}) {
  const [extras, setExtras] = useState(plan.sedes_extra_actuales)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const total = Number(plan.monto_base) + extras * Number(plan.monto_sede_extra)
  const scheduled = plan.sedes_extra_pendientes !== null

  function submit() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const supabase = createClient()
      const { data, error: invokeError } = await supabase.functions.invoke<{
        ok?: boolean; message?: string; error?: string
      }>('mercadopago-billing-change-seats', {
        body: { sedes_extra: extras, idempotency_key: crypto.randomUUID() },
      })
      if (invokeError || !data?.ok) {
        setError(data?.error ?? 'No se pudo programar el cambio. Revisa el estado de la suscripción.')
        return
      }
      setMessage(data.message ?? 'Cambio programado.')
      window.location.reload()
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>Sedes del plan</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>El plan incluye {plan.sedes_incluidas} sede{plan.sedes_incluidas === 1 ? '' : 's'} y tienes {plan.sedes_extra_actuales} adicional{plan.sedes_extra_actuales === 1 ? '' : 'es'} contratada{plan.sedes_extra_actuales === 1 ? '' : 's'}.</p>
        {scheduled ? (
          <Alert><AlertDescription>
            Cambio a {plan.sedes_extra_pendientes} sede{plan.sedes_extra_pendientes === 1 ? '' : 's'} adicional{plan.sedes_extra_pendientes === 1 ? '' : 'es'}: {plan.cambio_estado === 'programado' ? 'programado para la próxima renovación' : 'en revisión de facturación'}.
          </AlertDescription></Alert>
        ) : null}
        <label className="block max-w-xs space-y-2 font-semibold">Sedes adicionales para el próximo mes
          <Input type="number" min={plan.sedes_extra_minimas} max={1000} value={extras}
            onChange={(event) => {
              const value = Number(event.target.value)
              setExtras(Number.isInteger(value) ? Math.max(plan.sedes_extra_minimas, Math.min(1000, value)) : plan.sedes_extra_actuales)
            }} />
        </label>
        <p className="text-muted-foreground">Nuevo importe mensual: <strong className="text-foreground">{money(total)}</strong>. El cupo cambia después de aprobarse la próxima renovación.</p>
        {extras < plan.sedes_extra_actuales ? <p className="text-muted-foreground">Para reducir sedes, retira primero los locales que excedan el nuevo cupo.</p> : null}
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {message ? <Alert><AlertDescription>{message}</AlertDescription></Alert> : null}
        <Button type="button" disabled={pending || scheduled || extras === plan.sedes_extra_actuales || subscription.estado_facturacion !== 'activa'} onClick={submit}>
          {pending ? 'Programando…' : 'Programar cambio'}
        </Button>
      </CardContent>
    </Card>
  )
}
