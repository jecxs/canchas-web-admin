import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, Building03Icon, UserIcon } from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ApplicationDecisionPanel } from '@/features/admin-applications/application-decision-panel'
import { getAdminApplication } from '@/features/admin-applications/queries'
import type { AdminApplicationStatus } from '@/features/admin-applications/types'

const statusPresentation: Record<
  AdminApplicationStatus,
  { label: string; variant: 'warning' | 'info' | 'destructive' }
> = {
  pendiente_aprobacion: { label: 'Pendiente de revisión', variant: 'warning' },
  aprobado_pendiente_pago: { label: 'Aprobado, pendiente de pago', variant: 'info' },
  rechazado: { label: 'Solicitud observada', variant: 'destructive' },
}

function DataItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-semibold">{value || 'No registrado'}</dd>
    </div>
  )
}

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const application = await getAdminApplication(id)
  if (!application) notFound()

  const status = statusPresentation[application.status]

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/admin/solicitudes">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          Volver a solicitudes
        </Link>
      </Button>

      <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">Revisión de solicitud</p>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-[-.04em]">{application.name}</h1>
          <p className="mt-3 text-muted-foreground">
            Verifica únicamente los datos solicitados durante el registro inicial.
          </p>
        </div>
        <ApplicationDecisionPanel localId={application.id} status={application.status} />
      </div>

      <div className="mt-9 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-2 grid size-10 place-items-center rounded-xl bg-primary/18 text-foreground">
              <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-5" />
            </div>
            <CardTitle>Propietario</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-6 sm:grid-cols-2">
              <DataItem label="Nombre completo" value={application.owner.name} />
              <DataItem label="DNI" value={application.owner.dni} />
              <DataItem label="Correo" value={application.owner.email} />
              <DataItem label="Teléfono" value={application.owner.phone} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 grid size-10 place-items-center rounded-xl bg-primary/18 text-foreground">
              <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-5" />
            </div>
            <CardTitle>Local declarado</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-6 sm:grid-cols-2">
              <DataItem label="Nombre comercial" value={application.name} />
              <DataItem label="RUC (opcional)" value={application.ruc} />
              <div className="sm:col-span-2"><DataItem label="Dirección referencial" value={application.address} /></div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {application.rejectionReason && (
        <Card className="mt-5 border-destructive/25 bg-destructive/5">
          <CardHeader><CardTitle>Última observación enviada</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-destructive">{application.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      <Separator className="my-8" />
      <p className="text-sm text-muted-foreground">
        La galería, el logo, las coordenadas, horarios, canchas y reglas operativas se
        completan después de habilitar el panel. No forman parte de esta validación.
      </p>
    </div>
  )
}
