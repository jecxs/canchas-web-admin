'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { AuditIncident, AuditIncidentActor, AuditIncidentType } from './types'

const TYPE_LABELS: Record<AuditIncidentType, string> = {
  cancelacion: 'Cancelación',
  rechazo: 'Rechazo de pago',
  extension: 'Extensión',
}

const TYPE_BADGE: Record<AuditIncidentType, string> = {
  cancelacion: 'rp-b-cancel',
  rechazo: 'rp-b-reject',
  extension: 'rp-b-ext',
}

const ACTOR_LABELS: Record<AuditIncidentActor, string> = {
  cliente: 'Cliente',
  dueno: 'Dueño',
  sistema: 'Sistema',
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
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
      extension: incidents.filter((incident) => incident.type === 'extension').length,
    }),
    [incidents],
  )

  const filtered = useMemo(
    () => (filter === 'todos' ? incidents : incidents.filter((incident) => incident.type === filter)),
    [incidents, filter],
  )

  return (
    <div>
      <div className="rp-filters" role="group" aria-label="Filtrar incidencias">
        {(['todos', 'cancelacion', 'rechazo', 'extension'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className="rp-filter"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {key === 'todos' ? 'Todas' : TYPE_LABELS[key]} {counts[key]}
          </button>
        ))}
      </div>

      <div className="rp-tablescroll">
        <table className="rp-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Fecha evento</th>
              <th>Cliente</th>
              <th>Cancha</th>
              <th>Deporte</th>
              <th>Partido</th>
              <th>Actor</th>
              <th className="rp-num">Monto</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((incident) => (
              <tr key={incident.id}>
                <td>
                  <span className={cn('rp-badge', TYPE_BADGE[incident.type])}>{TYPE_LABELS[incident.type]}</span>
                </td>
                <td className="rp-muted">{formatDateTime(incident.eventAt)}</td>
                <td>{incident.customerName}</td>
                <td className="rp-muted">{incident.courtName}</td>
                <td className="rp-muted">{incident.sportName}</td>
                <td className="rp-muted">{formatDate(incident.gameDate)}</td>
                <td>{ACTOR_LABELS[incident.actor]}</td>
                <td className="rp-num">{incident.amount != null ? formatMoney(incident.amount) : '—'}</td>
                <td className="rp-muted rp-clip">{incident.reason ?? '—'}</td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td colSpan={9} className="rp-muted" style={{ textAlign: 'center', padding: '2rem' }}>
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
