import { notFound } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { Clock01Icon, Comment01Icon } from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { localStatePresentation } from '@/components/dashboard/status'
import { LocalLogo } from '@/components/dashboard/entity-media'
import { LocalModerationPanel } from '@/features/admin-locales/local-moderation-panel'
import { AdminLocalChecklist } from '@/features/admin-locales/admin-local-checklist'
import { AdminLocalCourts } from '@/features/admin-locales/admin-local-courts'
import { LockSection } from '@/components/dashboard/edit-guard'
import { getAdminLocalAudit, getAdminLocalDetail } from '@/features/admin-locales/queries'
import { OwnerCard } from '@/features/admin-owners/owner-card'
import { getAdminOwnerCard } from '@/features/admin-owners/queries'
import type { AdminLocalReview } from '@/features/admin-locales/types'

const reviewStateLabels: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' }> = {
  pendiente_aprobacion: { label: 'Pendiente', variant: 'warning' },
  aprobada: { label: 'Aprobada', variant: 'success' },
  rechazada: { label: 'Rechazada', variant: 'destructive' },
}

function ReviewStars({ value }: { value: number }) {
  const rating = Math.max(0, Math.min(5, Math.round(value)))
  return (
    <span className="text-sm tracking-tight" aria-label={`${rating} de 5 estrellas`}>
      <span className="text-warning-foreground">{'★'.repeat(rating)}</span>
      <span className="text-muted-foreground/30">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

function AdminLocalReviews({ reviews }: { reviews: AdminLocalReview[] }) {
  const pendingCount = reviews.filter((review) => review.state === 'pendiente_aprobacion').length

  return (
    <div className="mt-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Comment01Icon} strokeWidth={2} className="size-5 text-success-foreground" />
            Reseñas
            <span className="text-sm font-semibold text-muted-foreground">
              ({reviews.length})
            </span>
            {pendingCount ? <Badge variant="warning">{pendingCount} pendiente{pendingCount === 1 ? '' : 's'}</Badge> : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este local todavía no tiene reseñas.</p>
          ) : (
          <ul className="space-y-4">
            {reviews.map((review) => {
              const stateLabel = reviewStateLabels[review.state] ?? { label: review.state, variant: 'warning' as const }
              return (
                <li key={review.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <ReviewStars value={review.rating} />
                      <span className="text-sm font-bold">{review.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={stateLabel.variant}>{stateLabel.label}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                  ) : null}
                  {review.ownerReply ? (
                    <div className="mt-2 rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Respuesta del local</p>
                      <p className="mt-1 text-sm leading-relaxed">{review.ownerReply}</p>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const auditActionLabels: Record<string, string> = {
  solicitud_propietario_registrada: 'Solicitud registrada por el propietario',
  solicitud_local_aprobada: 'Solicitud aprobada para pago',
  solicitud_local_rechazada: 'Solicitud observada',
  trial_local_otorgado: 'Periodo de prueba otorgado',
  local_publicado: 'Local publicado en la app',
  local_despublicado: 'Local retirado del catálogo',
}

function formatDate(value: string, withTime = false) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No registrado'
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const } : {}),
  }).format(date)
}

export default async function AdminLocalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const local = await getAdminLocalDetail(id)
  if (!local) notFound()

  const [ownerCard, audit] = await Promise.all([
    getAdminOwnerCard(local.owner.id),
    getAdminLocalAudit(local.id),
  ])
  const state = localStatePresentation[local.state]

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">Ficha del local</p>
            <Badge variant={state.tone}>{state.label}</Badge>
            <Badge variant={local.published ? 'success' : 'neutral'}>
              {local.published ? 'Publicado' : 'No publicado'}
            </Badge>
          </div>
          <h1 className="mt-4 flex items-center gap-3 text-4xl font-black tracking-[-.04em]">
            <LocalLogo src={local.logoUrl} name={local.name} className="size-14 rounded-2xl" />
            {local.name}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{local.address}</p>
          <div className="mt-5">
            <LocalModerationPanel
              localId={local.id}
              state={local.state}
              published={local.published}
              checklistReady={local.checklist?.ready ?? false}
            />
          </div>
        </div>

        {ownerCard ? <OwnerCard owner={ownerCard} /> : null}
      </div>

      {local.rejectionReason ? (
        <Card className="mt-6 border-destructive/25 bg-destructive/5">
          <CardHeader>
            <CardTitle>Última observación enviada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-destructive">{local.rejectionReason}</p>
          </CardContent>
        </Card>
      ) : null}

      {local.checklist ? (
        <div className="mt-6">
          <AdminLocalChecklist localId={local.id} checklist={local.checklist} />
        </div>
      ) : null}

      <AdminLocalReviews reviews={local.reviews} />

      <div className="mt-5">
        <LockSection>
          <AdminLocalCourts
            localId={local.id}
            localName={local.name}
            courts={local.courts}
            sports={local.sports}
            editable
          />
        </LockSection>
      </div>

      {audit.length ? (
        <div className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-5 text-success-foreground" />
                Historial administrativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 border-l border-border pl-4">
                {audit.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-card" />
                    <p className="text-sm font-bold">{auditActionLabels[entry.action] ?? entry.action}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {entry.actorName ?? 'Sistema'} · {formatDate(entry.createdAt, true)}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
