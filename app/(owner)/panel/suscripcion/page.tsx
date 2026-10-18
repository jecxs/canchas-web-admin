import { SubscriptionRequiredState } from '@/components/states'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { redirect } from 'next/navigation'
import { SubscriptionCheckoutCard } from '@/features/billing/subscription-checkout-card'
import { getBillingCheckoutOffer } from '@/features/billing/queries'
import { hasActiveSubscription } from '@/lib/auth/access'
import { requireOwnerLocal } from '@/lib/auth/dal'

export default async function SubscriptionRequiredPage() {
  const { context, local } = await requireOwnerLocal(['aprobado_pendiente_pago'])
  if (hasActiveSubscription(context.subscription)) {
    redirect('/panel/configuracion')
  }
  const offer = await getBillingCheckoutOffer()

  return (
    <div className="mx-auto max-w-3xl py-6">
      <SubscriptionRequiredState localName={local.nombre}>
        <div className="w-full space-y-4 text-left">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Estado del local</p>
                <p className="mt-2 font-extrabold">{local.nombre}</p>
              </div>
              <Badge variant="info">Aprobado</Badge>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              La validación ya terminó. Tu información está conservada y el local
              todavía no aparece en la app.
            </p>
          </div>
          {offer ? (
            <SubscriptionCheckoutCard offer={offer} />
          ) : (
            <Alert>
              <AlertTitle>Plan pendiente de configuración</AlertTitle>
              <AlertDescription>
                Grassly aún no publicó una versión de precio vigente. No se iniciará ningún cobro hasta que el plan esté configurado y habilitado.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </SubscriptionRequiredState>
    </div>
  )
}
