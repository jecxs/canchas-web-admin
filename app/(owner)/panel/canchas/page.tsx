import { HugeiconsIcon } from '@hugeicons/react'
import { Building03Icon } from '@hugeicons/core-free-icons'
import { EmptyState } from '@/components/states/empty-state'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CourtEditor } from '@/features/courts/court-editor'
import { getCourtsConfiguration } from '@/features/courts/queries'
import { CourtStatusAction } from '@/features/courts/court-status-action'

export default async function OwnerCourtsPage() {
  const { local, courts, sports } = await getCourtsConfiguration()

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">Espacios físicos</p><h1 className="mt-4 text-4xl font-black tracking-[-.04em]">Canchas</h1><p className="mt-3 max-w-2xl text-muted-foreground">Configura las canchas de {local.nombre}, los deportes que admite cada una y su precio por hora.</p></div>
        <CourtEditor localId={local.id} sports={sports} />
      </div>

      <section className="mt-9">
        {courts.length === 0 ? (
          <EmptyState title="Aún no tienes canchas configuradas" description="Crea el primer espacio físico y asígnale al menos un deporte con su tarifa." action={<CourtEditor localId={local.id} sports={sports} />} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {courts.map((court) => (
              <Card key={court.id} className={!court.active ? 'opacity-70' : undefined}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/18"><HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-5" /></span><div className="min-w-0"><CardTitle className="truncate">{court.name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{court.surface || 'Superficie sin especificar'}</p></div></div>
                    <Badge variant={court.active ? 'success' : 'neutral'}>{court.active ? 'Activa' : 'Inactiva'}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {court.sports.map((sport) => <div key={sport.sportId} className="flex items-center justify-between gap-3 rounded-xl bg-muted/45 px-3 py-2.5 text-sm"><div><p className="font-semibold">{sport.name}</p><p className="text-xs capitalize text-muted-foreground">{sport.support}</p></div><p className="font-extrabold">S/ {sport.hourlyPrice?.toFixed(2) ?? '—'}<span className="font-normal text-muted-foreground"> / h</span></p></div>)}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 border-t pt-5"><CourtEditor localId={local.id} sports={sports} court={court} /><CourtStatusAction localId={local.id} courtId={court.id} active={court.active} courtName={court.name} /></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
