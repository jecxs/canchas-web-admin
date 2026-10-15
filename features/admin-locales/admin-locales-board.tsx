'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Clock01Icon,
  Search01Icon,
  Store01Icon,
} from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/states/empty-state'
import { localStatePresentation } from '@/components/dashboard/status'
import { LocalLogo } from '@/components/dashboard/entity-media'
import { cn } from '@/lib/utils'
import type { AdminLocalListItem, AdminLocalState, AdminLocalesData } from './types'

// Orden y selección de estados que se muestran como filtros en el tablero.
const BOARD_STATES: AdminLocalState[] = [
  'pendiente_aprobacion',
  'aprobado_pendiente_pago',
  'trial',
  'en_gracia',
  'suspendido',
  'activo',
]

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
      )}
    >
      {label}
      <span className={cn('grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[10px]', active ? 'bg-primary-foreground/20' : 'bg-muted')}>
        {count}
      </span>
    </button>
  )
}

function SummaryStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="shrink-0 text-center">
      <p className="text-2xl font-black leading-none text-primary">{value}</p>
      <p className="mt-1 whitespace-nowrap text-[11px] font-semibold text-white/80">{label}</p>
    </div>
  )
}

function LocalCard({ local }: { local: AdminLocalListItem }) {
  const state = localStatePresentation[local.state]

  return (
    <Link
      href={`/admin/locales/${local.id}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      aria-label={`Revisar local ${local.name}`}
    >
      <Card className="relative h-full gap-0 py-0 transition-[transform,border-color,box-shadow,background-color] duration-300 ease-out group-hover:-translate-y-1 group-hover:border-plum/50 group-hover:bg-plum/[.05] group-hover:shadow-md group-active:translate-y-0 group-active:scale-[.995]">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <LocalLogo src={local.logoUrl} name={local.name} className="size-11 rounded-2xl transition-transform duration-300 group-hover:scale-105" />
              <div className="min-w-0">
                <h2 className="truncate text-base font-extrabold tracking-tight transition-colors group-hover:text-plum">{local.name}</h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{local.address}</p>
              </div>
            </div>
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors duration-300 group-hover:border-plum group-hover:bg-plum group-hover:text-white"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={state.tone}>{state.label}</Badge>
            <Badge variant={local.published ? 'success' : 'neutral'}>
              {local.published ? 'Publicado' : 'No publicado'}
            </Badge>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-3.5" />
              {local.courtsCount} {local.courtsCount === 1 ? 'cancha' : 'canchas'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5" />
              {formatDate(local.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function AdminLocalesBoard({ data }: { data: AdminLocalesData }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')

  const { filters, summary } = data
  const allVisibility = typeof filters.published !== 'boolean'
  const notPublished = summary.total - summary.published

  function updateParams(next: { estado?: AdminLocalState; publicado?: boolean }) {
    const params = new URLSearchParams()
    if (next.estado) params.set('estado', next.estado)
    if (typeof next.publicado === 'boolean') params.set('publicado', String(next.publicado))
    startTransition(() => router.replace(params.size ? `${pathname}?${params.toString()}` : pathname))
  }

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return data.locals
    return data.locals.filter((local) =>
      `${local.name} ${local.ownerName} ${local.address} ${local.ruc ?? ''}`.toLowerCase().includes(term),
    )
  }, [data.locals, query])

  return (
    <div className={cn('mx-auto w-full max-w-7xl', isPending && 'opacity-70 transition-opacity')}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <h1 className="text-5xl font-black tracking-[-.05em] sm:text-6xl">Locales</h1>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={!filters.state && allVisibility}
              label="Todos"
              count={summary.total}
              onClick={() => updateParams({ estado: undefined, publicado: undefined })}
            />
            {BOARD_STATES.map((state) => (
              <FilterChip
                key={state}
                active={filters.state === state}
                label={localStatePresentation[state].label}
                count={summary.byState[state]}
                onClick={() =>
                  updateParams({ estado: filters.state === state ? undefined : state, publicado: filters.published })
                }
              />
            ))}
            <FilterChip
              active={filters.published === true}
              label="Publicados"
              count={summary.published}
              onClick={() => updateParams({ estado: filters.state, publicado: filters.published === true ? undefined : true })}
            />
            <FilterChip
              active={filters.published === false}
              label="No publicados"
              count={notPublished}
              onClick={() => updateParams({ estado: filters.state, publicado: filters.published === false ? undefined : false })}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-5 whitespace-nowrap rounded-full border-2 border-primary bg-primary-foreground px-6 py-3 shadow-sm">
          <SummaryStat value={summary.total} label="locales" />
          <SummaryStat value={summary.published} label="publicados" />
          <SummaryStat value={summary.byState.pendiente_aprobacion} label="por revisar" />
        </div>
      </div>

      <div className="mt-6 border-t border-border" />

      <div className="mt-6 flex justify-center">
        <div className="relative w-full max-w-xl">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por local, propietario o dirección"
            className="pl-10"
          />
        </div>
      </div>

      <section className="mt-6">
        {filtered.length ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((local) => (
              <LocalCard key={local.id} local={local} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay locales con estos filtros"
            description="Cambia el estado, la visibilidad o el término de búsqueda para ver otros locales."
          />
        )}
      </section>
    </div>
  )
}
