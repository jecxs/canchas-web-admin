'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AuditIncident, AuditIncidentActor, AuditIncidentType } from './types'

const TYPE_LABELS: Record<AuditIncidentType, string> = {
  cancelacion: 'Cancelación',
  rechazo: 'Rechazo de pago',
}

const ACTOR_LABELS: Record<AuditIncidentActor, string> = {
  cliente: 'Cliente',
  dueno: 'Dueño',
  sistema: 'Sistema',
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

function formatDate(value: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00-05:00`))
}

export function AuditIncidentsTable({ incidents }: { incidents: AuditIncident[] }) {
  const [filter, setFilter] = useState<'todos' | AuditIncidentType>('todos')

  const counts = useMemo(
    () => ({
      todos: incidents.length,
      cancelacion: incidents.filter((incident) => incident.type === 'cancelacion').length,
      rechazo: incidents.filter((incident) => incident.type === 'rechazo').length,
    }),
    [incidents],
  )

  const filtered = useMemo(
    () => (filter === 'todos' ? incidents : incidents.filter((incident) => incident.type === filter)),
    [incidents, filter],
  )

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(['todos', 'cancelacion', 'rechazo'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors',
              filter === key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/80 text-muted-foreground hover:text-foreground',
            )}
          >
            {key === 'todos' ? 'Todas' : TYPE_LABELS[key]} ({counts[key]})
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/80 text-left text-[11px] font-extrabold uppercase tracking-[.08em] text-muted-foreground">
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Fecha evento</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Cancha · Deporte</th>
              <th className="px-3 py-2">Fecha partido</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((incident) => (
              <tr key={incident.id} className="border-b border-border/60">
                <td className="px-3 py-2.5">
                  <Badge variant={incident.type === 'cancelacion' ? 'destructive' : 'warning'}>
                    {TYPE_LABELS[incident.type]}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                  {formatDateTime(incident.eventAt)}
                </td>
                <td className="px-3 py-2.5 font-semibold">{incident.customerName}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {incident.courtName} · {incident.sportName}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                  {formatDate(incident.gameDate)}
                </td>
                <td className="px-3 py-2.5">{ACTOR_LABELS[incident.actor]}</td>
                <td className="max-w-[260px] px-3 py-2.5 text-muted-foreground">{incident.reason ?? '—'}</td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Sin incidencias en este periodo.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
