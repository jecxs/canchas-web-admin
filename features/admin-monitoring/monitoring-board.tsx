'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/states/empty-state'
import { cn } from '@/lib/utils'
import { fieldLabel, PERSON_FIELDS } from './labels'
import type { MonitoringChange, MonitoringData, MonitoringEvent, MonitoringFilters, MonitoringOption } from './types'

function formatDay(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'neutral' | 'destructive' | 'outline'

function actionTone(action: string): BadgeVariant {
  const value = action.toLowerCase()
  if (/despublicad|rechazad|eliminad|suspendid|cancelad/.test(value)) return 'destructive'
  if (/publicad|aprobad|reactivad|confirmad|cobrad|cread|otorgad/.test(value)) return 'success'
  if (/actualizad|cambiad|editad|registrad/.test(value)) return 'info'
  return 'neutral'
}

function toneDot(tone: BadgeVariant) {
  if (tone === 'success') return 'bg-success'
  if (tone === 'destructive') return 'bg-destructive'
  return 'bg-plum'
}

// Nombre legible de la entidad del evento (local → su nombre; perfil → nombre resuelto).
function resolveEntityName(event: MonitoringEvent, people: Record<string, string>): string | null {
  if (event.entityType === 'local' && event.localName) return event.localName
  if (event.entityId && people[event.entityId]) return people[event.entityId]
  return null
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function looksLikeDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}(T|$)/.test(value)
}

function formatDate(value: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = new Date(dateOnly ? `${value}T12:00:00-05:00` : value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(dateOnly ? {} : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
  }).format(date)
}

function formatFieldValue(field: string, value: unknown, people: Record<string, string>): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'string') {
    if (PERSON_FIELDS.has(field) && UUID_RE.test(value)) return people[value] ?? 'Usuario desconocido'
    if (looksLikeDate(value)) return formatDate(value)
    return value.replace(/_/g, ' ')
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function FilterSelect({
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  label: string
  value: string | undefined
  options: MonitoringOption[]
  allLabel: string
  onChange: (value: string | undefined) => void
}) {
  return (
    <Select value={value ?? 'all'} onValueChange={(next) => onChange(next === 'all' ? undefined : next)}>
      <SelectTrigger aria-label={label} className="h-9 w-full bg-background text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ChangeLine({ change, people }: { change: MonitoringChange; people: Record<string, string> }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 text-xs">
      <span className="font-bold">{fieldLabel(change.field)}</span>
      <span className="text-muted-foreground">{formatFieldValue(change.field, change.before, people)}</span>
      <span className="text-muted-foreground" aria-hidden="true">
        →
      </span>
      <span className="font-semibold">{formatFieldValue(change.field, change.after, people)}</span>
    </li>
  )
}

function DetailPanel({ event, people }: { event: MonitoringEvent; people: Record<string, string> }) {
  const metadata = isPlainObject(event.metadata) ? event.metadata : {}
  const changeLabels = new Set(event.changes.map((change) => fieldLabel(change.field)))
  const metadataEntries = Object.entries(metadata).filter(
    ([key]) => key !== 'clave' && !changeLabels.has(fieldLabel(key)),
  )
  const entityName = resolveEntityName(event, people)
  const hasDetail = event.changes.length > 0 || metadataEntries.length > 0

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-muted/40 p-3">
      {entityName ? (
        <p className="text-[11px] text-muted-foreground">
          Entidad <span className="font-semibold text-foreground">{entityName}</span>
        </p>
      ) : null}
      {event.changes.length ? (
        <ul className="space-y-1.5">
          {event.changes.map((change) => (
            <ChangeLine key={change.field} change={change} people={people} />
          ))}
        </ul>
      ) : null}
      {metadataEntries.length ? (
        <ul className="space-y-1.5">
          {metadataEntries.map(([key, value]) => (
            <li key={key} className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="font-bold">{fieldLabel(key)}</span>
              <span>{formatFieldValue(key, value, people)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {!hasDetail ? <p className="text-xs text-muted-foreground">Sin más detalles.</p> : null}
    </div>
  )
}

export function MonitoringBoard({ data }: { data: MonitoringData }) {
  const router = useRouter()
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string | null>(null)

  const { summary, pagination, items, options, filters, people } = data
  const hasFilters = Boolean(filters.desde || filters.hasta || filters.local || filters.rol || filters.accion || filters.entidad)

  function buildSearch(next: MonitoringFilters, page = 1) {
    const params = new URLSearchParams()
    if (next.desde) params.set('desde', next.desde)
    if (next.hasta) params.set('hasta', next.hasta)
    if (next.local) params.set('local', next.local)
    if (next.rol) params.set('rol', next.rol)
    if (next.accion) params.set('accion', next.accion)
    if (next.entidad) params.set('entidad', next.entidad)
    if (page > 1) params.set('page', String(page))
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  function commit(patch: Partial<MonitoringFilters>) {
    const next = { ...filters, ...patch }
    router.replace(buildSearch(next, 1))
  }

  function clearFilters() {
    router.replace(pathname)
  }

  const firstResult = pagination.totalCount ? (pagination.page - 1) * pagination.pageSize + 1 : 0
  const lastResult = Math.min(pagination.page * pagination.pageSize, pagination.totalCount)

  return (
    <div className="reportes mx-auto w-full max-w-5xl">
      <h1 className="text-4xl font-black tracking-[-.04em] sm:text-5xl">Monitoreo</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Bitácora de la plataforma: quién hizo qué y qué cambió en cada local, propietario o parámetro.
      </p>

      <section className="rp-block grid gap-6 sm:grid-cols-3">
        <div>
          <p className="font-display text-5xl leading-none font-black tabular-nums">{summary.total}</p>
          <p className="mt-2 text-xs font-bold text-muted-foreground">Eventos en el periodo</p>
        </div>
        <div className="sm:border-l sm:border-border/80 sm:pl-6">
          <p className="text-xs font-bold">Acciones principales</p>
          <ul className="mt-3 space-y-2">
            {summary.byAction.slice(0, 4).map((item) => (
              <li key={item.value} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">{item.label}</span>
                <span className="font-bold tabular-nums">{item.count}</span>
              </li>
            ))}
            {!summary.byAction.length ? <li className="text-sm text-muted-foreground">Sin eventos</li> : null}
          </ul>
        </div>
        <div className="sm:border-l sm:border-border/80 sm:pl-6">
          <p className="text-xs font-bold">Entidades afectadas</p>
          <ul className="mt-3 space-y-2">
            {summary.byEntity.slice(0, 4).map((item) => (
              <li key={item.value} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">{item.label}</span>
                <span className="font-bold tabular-nums">{item.count}</span>
              </li>
            ))}
            {!summary.byEntity.length ? <li className="text-sm text-muted-foreground">Sin eventos</li> : null}
          </ul>
        </div>
      </section>

      <section className="rp-block">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
            Desde
            <Input
              type="date"
              name="desde"
              value={filters.desde ?? ''}
              onChange={(event) => commit({ desde: event.target.value || undefined })}
              className="h-9 bg-background text-xs"
            />
          </label>
          <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
            Hasta
            <Input
              type="date"
              name="hasta"
              value={filters.hasta ?? ''}
              onChange={(event) => commit({ hasta: event.target.value || undefined })}
              className="h-9 bg-background text-xs"
            />
          </label>
          <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
            Local
            <FilterSelect label="Local" value={filters.local} options={options.locales} allLabel="Todos" onChange={(value) => commit({ local: value })} />
          </label>
          <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
            Rol del actor
            <FilterSelect label="Rol del actor" value={filters.rol} options={options.roles} allLabel="Todos" onChange={(value) => commit({ rol: value as MonitoringFilters['rol'] })} />
          </label>
          <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
            Acción
            <FilterSelect label="Acción" value={filters.accion} options={options.actions} allLabel="Todas" onChange={(value) => commit({ accion: value })} />
          </label>
          <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
            Entidad
            <FilterSelect label="Entidad" value={filters.entidad} options={options.entities} allLabel="Todas" onChange={(value) => commit({ entidad: value })} />
          </label>
        </div>
        {hasFilters ? (
          <div className="mt-3 flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        ) : null}
      </section>

      <section className="rp-block">
        {items.length ? (
          <ol>
            {items.map((event, index) => {
              const tone = actionTone(event.action)
              const open = expanded === event.id
              const expandable = event.changes.length > 0 || Object.keys(isPlainObject(event.metadata) ? event.metadata : {}).length > 0
              return (
                <li key={event.id} className="grid grid-cols-[64px_1fr] gap-x-3 sm:grid-cols-[92px_1fr]">
                  <div className="pt-0.5 text-right">
                    <p className="text-xs font-bold text-foreground">{formatDay(event.createdAt)}</p>
                    <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">{formatTime(event.createdAt)}</p>
                  </div>
                  <div className={cn('relative border-l border-plum/30 pl-5', index === items.length - 1 ? 'pb-0' : 'pb-6')}>
                    <span className={cn('absolute top-1 -left-[6.5px] size-3 rounded-full ring-2 ring-background', toneDot(tone))} aria-hidden="true" />
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                      <div className="min-w-0">
                        <Badge variant={tone}>{event.actionLabel}</Badge>
                        <p className="mt-1.5 text-sm">
                          <span className="font-semibold">{event.actorName}</span>
                          <span className="ml-1.5 text-xs font-bold text-plum">{event.actorRoleLabel}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 text-right">
                        <p className="flex flex-wrap items-center justify-end gap-x-2">
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{event.entityLabel}</span>
                          {event.localName ? <span className="text-sm font-bold text-foreground">{event.localName}</span> : null}
                        </p>
                        {expandable ? (
                          <button
                            type="button"
                            onClick={() => setExpanded(open ? null : event.id)}
                            aria-expanded={open}
                            className="inline-flex items-center gap-1 text-xs font-bold text-foreground hover:underline"
                          >
                            <HugeiconsIcon icon={open ? ArrowUp01Icon : ArrowDown01Icon} strokeWidth={2} className="size-3.5" aria-hidden="true" />
                            {open ? 'Ocultar cambio' : 'Ver cambio'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {open ? <DetailPanel event={event} people={people} /> : null}
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <EmptyState title="Sin eventos en este periodo" description="Ajusta los filtros o espera nueva actividad administrativa." />
        )}
      </section>

      {pagination.totalCount > 0 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Mostrando {firstResult}–{lastResult} de {pagination.totalCount}
          </p>
          <div className="flex items-center gap-2">
            {pagination.page <= 1 ? (
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={buildSearch(filters, pagination.page - 1)}>Anterior</Link>
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              {pagination.page} / {pagination.totalPages}
            </span>
            {pagination.page >= pagination.totalPages ? (
              <Button variant="outline" size="sm" disabled>
                Siguiente
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={buildSearch(filters, pagination.page + 1)}>Siguiente</Link>
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
