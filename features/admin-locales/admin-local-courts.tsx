'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Building03Icon } from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LockToggle, useEditGuard } from '@/components/dashboard/edit-guard'
import { CourtEditor } from '@/features/courts/court-editor'
import { CourtStatusAction } from '@/features/courts/court-status-action'
import { SportIcon } from '@/features/courts/sport-icon'
import type { CourtItem, SportOption } from '@/features/courts/types'

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 }).format(value)
}

export function AdminLocalCourts({
  localId,
  localName,
  courts,
  sports,
  editable,
}: {
  localId: string
  localName: string
  courts: CourtItem[]
  sports: SportOption[]
  editable: boolean
}) {
  const guard = useEditGuard()
  const unlocked = !guard || guard.editing
  const showActions = editable && unlocked

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-5 text-success-foreground" />
              Canchas del local
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {courts.length} {courts.length === 1 ? 'cancha registrada' : 'canchas registradas'} en {localName}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showActions ? <CourtEditor localId={localId} sports={sports} /> : null}
            {editable ? <LockToggle /> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {courts.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {courts.map((court) => (
              <div key={court.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${court.active ? 'bg-primary/20 text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold">{court.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{court.surface || 'Superficie sin especificar'}</p>
                    </div>
                  </div>
                  <Badge variant={court.active ? 'success' : 'neutral'}>{court.active ? 'Activa' : 'Inactiva'}</Badge>
                </div>

                <div className="mt-3 space-y-1.5">
                  {court.sports.map((sport) => (
                    <div key={sport.sportId} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <SportIcon name={sport.name} inactive={!court.active} size="sm" />
                        <span className="min-w-0 truncate font-semibold capitalize">
                          {sport.name} <span className="font-normal text-muted-foreground">· {sport.support}</span>
                        </span>
                      </span>
                      <span className="shrink-0 font-extrabold">
                        {sport.hourlyPrice != null ? `${formatMoney(sport.hourlyPrice)}/h` : '—'}
                      </span>
                    </div>
                  ))}
                </div>

                {showActions ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                    <CourtEditor localId={localId} sports={sports} court={court} />
                    <CourtStatusAction localId={localId} courtId={court.id} active={court.active} courtName={court.name} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">El local aún no registró canchas.</p>
        )}
      </CardContent>
    </Card>
  )
}
