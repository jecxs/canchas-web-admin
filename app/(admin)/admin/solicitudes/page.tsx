import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Task01Icon } from '@hugeicons/core-free-icons'
import { EmptyState } from '@/components/states/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AdminDecisionFeedback } from '@/features/admin-applications/admin-decision-feedback'
import { getAdminApplications } from '@/features/admin-applications/queries'
import type {
  AdminApplication,
  AdminApplicationStatus,
} from '@/features/admin-applications/types'

const statusPresentation: Record<
  AdminApplicationStatus,
  { label: string; variant: 'warning' | 'info' | 'destructive' }
> = {
  pendiente_aprobacion: { label: 'Pendiente de revisión', variant: 'warning' },
  aprobado_pendiente_pago: { label: 'Pendiente de pago', variant: 'info' },
  rechazado: { label: 'Observada', variant: 'destructive' },
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function ApplicationCard({ application }: { application: AdminApplication }) {
  const status = statusPresentation[application.status]

  return (
    <Card className="gap-0 py-0 transition-colors hover:border-foreground/15">
      <CardContent className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-xs text-muted-foreground">
              Recibida el {formatDate(application.createdAt)}
            </span>
          </div>
          <h2 className="mt-3 truncate text-lg font-extrabold tracking-tight">
            {application.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {application.owner.name} · {application.address}
          </p>
          {application.status === 'rechazado' && application.rejectionReason && (
            <p className="mt-3 line-clamp-2 rounded-xl bg-destructive/7 px-3 py-2 text-sm text-destructive">
              {application.rejectionReason}
            </p>
          )}
        </div>
        <Button asChild variant="outline" className="w-full md:w-auto">
          <Link href={`/admin/solicitudes/${application.id}`}>
            Revisar
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ resultado }, applications] = await Promise.all([
    searchParams,
    getAdminApplications(),
  ])
  const pending = applications.filter((item) => item.status === 'pendiente_aprobacion')
  const processed = applications.filter((item) => item.status !== 'pendiente_aprobacion')

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminDecisionFeedback
        result={typeof resultado === 'string' ? resultado : undefined}
      />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Incorporación de negocios</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-.04em]">Solicitudes</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Revisa los datos básicos y decide si el propietario inicia con pago o
            con un periodo de prueba.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <HugeiconsIcon icon={Task01Icon} strokeWidth={2} className="size-5" />
          </span>
          <div>
            <p className="text-2xl font-black leading-none">{pending.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">por revisar</p>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Pendientes de revisión</h2>
          <Badge variant={pending.length ? 'warning' : 'neutral'}>{pending.length}</Badge>
        </div>
        {pending.length ? (
          <div className="grid gap-3">
            {pending.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay solicitudes pendientes"
            description="Las nuevas solicitudes de propietarios aparecerán aquí para su revisión."
          />
        )}
      </section>

      {processed.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Decisiones recientes</h2>
            <Badge variant="neutral">{processed.length}</Badge>
          </div>
          <div className="grid gap-3">
            {processed.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
