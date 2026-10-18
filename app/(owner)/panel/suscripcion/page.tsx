import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubscriptionCheckoutCard } from '@/features/billing/subscription-checkout-card'
import { SubscriptionSeatsCard } from '@/features/billing/subscription-seats-card'
import { getBillingCheckoutOffer, getBillingOverview, getBillingPlan } from '@/features/billing/queries'
import { canOperateLocal, isSubscribableLocalState } from '@/lib/auth/access'
import { requireOwner } from '@/lib/auth/dal'

const labels: Record<string, string> = {
  pendiente_alta: 'Pendiente de activación',
  trial: 'Período de prueba',
  activa: 'Activa',
  en_gracia: 'Pago pendiente, en gracia',
  cancelacion_programada: 'Cancelación programada',
  suspendida: 'Suspendida',
  cancelada: 'Cancelada',
}

function money(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function date(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(value))
}

export default async function SubscriptionPage() {
  const context = await requireOwner()
  const { subscription, invoices } = await getBillingOverview()
  const canStart = (!subscription || subscription.estado_facturacion === 'pendiente_alta')
    ? context.locals.some((local) => isSubscribableLocalState(local.estado) && !canOperateLocal(local, subscription))
    : subscription.estado_facturacion === 'cancelada'
      && context.locals.some((local) => isSubscribableLocalState(local.estado) || local.suspendido_por_facturacion)
  const offer = canStart ? await getBillingCheckoutOffer() : null
  const plan = subscription?.mercadopago_preapproval_id ? await getBillingPlan() : null

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <p className="eyebrow">Mi cuenta</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Facturación</h1>
        <p className="mt-2 text-sm text-muted-foreground">Consulta el estado de tu suscripción, las sedes contratadas y tus cobros.</p>
      </div>

      {subscription ? (
        <Card>
          <CardHeader><CardTitle>Suscripción de Grassly</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <Badge variant={subscription.estado_facturacion === 'activa' ? 'success' : subscription.estado_facturacion === 'en_gracia' ? 'warning' : 'neutral'}>
              {labels[subscription.estado_facturacion] ?? subscription.estado_facturacion}
            </Badge>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Importe mensual</dt><dd className="mt-1 font-bold">{money(Number(subscription.monto))}</dd></div>
              <div><dt className="text-muted-foreground">Sedes adicionales</dt><dd className="mt-1 font-bold">{subscription.sedes_extra_contratadas}</dd></div>
              <div><dt className="text-muted-foreground">Próximo cobro</dt><dd className="mt-1 font-bold">{date(subscription.proximo_cobro_at)}</dd></div>
              <div><dt className="text-muted-foreground">Período pagado hasta</dt><dd className="mt-1 font-bold">{date(subscription.periodo_actual_fin)}</dd></div>
              <div><dt className="text-muted-foreground">Medio de pago</dt><dd className="mt-1 font-bold">{subscription.metodo_pago_codigo?.replaceAll('_', ' ') ?? 'Pendiente de confirmar en Mercado Pago'}</dd></div>
            </dl>
            {subscription.estado_facturacion === 'en_gracia' ? (
              <Alert variant="destructive"><AlertTitle>Regulariza tu pago</AlertTitle><AlertDescription>El acceso permanecerá disponible hasta el {date(subscription.gracia_hasta)}. Revisa tu medio de pago en Mercado Pago.</AlertDescription></Alert>
            ) : null}
            {plan?.sedes_extra_pendientes !== null ? (
              <Alert><AlertTitle>Cambio de sedes programado</AlertTitle><AlertDescription>Tienes un cambio de sedes programado para la próxima renovación. Los detalles están en la sección «Sedes del plan».</AlertDescription></Alert>
            ) : null}
            {subscription.mercadopago_preapproval_id ? (
              <p className="text-sm text-muted-foreground">Para revisar tu medio de pago, abre <Link className="font-semibold text-primary underline" href="https://www.mercadopago.com.pe/" target="_blank" rel="noopener noreferrer">tu cuenta de Mercado Pago</Link>.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {canStart && offer ? <SubscriptionCheckoutCard offer={offer} /> : null}
      {plan && subscription ? <SubscriptionSeatsCard plan={plan} subscription={subscription} /> : null}
      {canStart && !offer ? (
        <Alert><AlertTitle>Plan pendiente de configuración</AlertTitle><AlertDescription>Grassly aún no publicó una versión de precio vigente.</AlertDescription></Alert>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Historial de cobros</CardTitle></CardHeader>
        <CardContent>
          {invoices.length ? (
            <ul className="divide-y">
              {invoices.map((invoice) => (
                <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <span><strong>{date(invoice.periodo_inicio)}</strong> – {date(invoice.periodo_fin)}<span className="ml-3 text-muted-foreground">{invoice.estado}</span></span>
                  <strong>{money(Number(invoice.monto))}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Aún no hay cobros registrados.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
