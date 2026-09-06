import { SubscriptionRequiredState } from '@/components/states'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { requireOwnerLocal } from '@/lib/auth/dal'

export default async function SubscriptionRequiredPage() {
  const { local } = await requireOwnerLocal(['aprobado_pendiente_pago'])

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
          <Alert>
            <AlertTitle>Pago en línea en preparación</AlertTitle>
            <AlertDescription>
              La activación por Mercado Pago se habilitará cuando se configure la
              cuenta recaudadora de Grassly. Por ahora no se simulará ningún cobro ni
              se solicitarán datos de pago.
            </AlertDescription>
          </Alert>
        </div>
      </SubscriptionRequiredState>
    </div>
  )
}
