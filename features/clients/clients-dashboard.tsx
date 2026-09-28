'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Building03Icon, Calendar03Icon, Cancel01Icon, CheckmarkCircle01Icon, Clock01Icon, Invoice03Icon, Money03Icon, Search01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import type { ReservationStatus } from '@/features/reservations/types'
import { ClientBookingDialog } from './client-booking-dialog'
import type { ClientCourt, ClientReservation, ClientsData, ClientsFilters, ClientSummary } from './types'

type Segment = 'all' | 'account' | 'recurring' | 'recent' | 'incidents'

const LIMA = 'America/Lima'

const RESERVATION_STATUS: Record<ReservationStatus, { label: string; tone: string; dot: string }> = {
  pendiente_pago: { label: 'Pendiente de pago', tone: 'bg-info/15 text-info-foreground', dot: 'bg-info' },
  pendiente_validacion: { label: 'Por validar', tone: 'bg-warning/25 text-warning-foreground', dot: 'bg-warning' },
  rechazada_pago: { label: 'Pago rechazado', tone: 'bg-destructive/12 text-destructive', dot: 'bg-destructive' },
  confirmada: { label: 'Confirmada', tone: 'bg-primary text-primary-foreground', dot: 'bg-primary' },
  completada: { label: 'Completada', tone: 'bg-success/18 text-success-foreground', dot: 'bg-success' },
  no_show: { label: 'Inasistencia', tone: 'bg-secondary text-secondary-foreground', dot: 'bg-secondary' },
  cancelada_cliente: { label: 'Cancelada por cliente', tone: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  cancelada_local: { label: 'Cancelada por local', tone: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  expirada: { label: 'Expirada', tone: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
}

const CHANNEL = { app: 'App Grassly', whatsapp: 'WhatsApp', presencial: 'Presencial' } as const

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
}

function formatDate(value: string | null, options: Intl.DateTimeFormatOptions) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-PE', { timeZone: LIMA, ...options }).format(new Date(value))
}

function formatDateTime(value: string) {
  return formatDate(value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}

function monthKey(value?: string | null) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: LIMA, year: 'numeric', month: '2-digit' }).format(value && !Number.isNaN(new Date(value).getTime()) ? new Date(value) : new Date())
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'CL'
}

function incidentCount(client: ClientSummary) {
  return client.noShows + client.cancelled + client.rejectedPayments
}

function mapReservation(row: {
  reserva_id: string
  cancha_id: string
  cancha_nombre: string
  deporte_id: string
  deporte_nombre: string | null
  inicio: string
  fin: string
  estado: ReservationStatus
  canal_origen: ClientReservation['channel']
  monto_total: number
  monto_adelanto_requerido: number
  es_excepcion_horaria: boolean
  created_at: string
}): ClientReservation {
  return {
    id: row.reserva_id,
    courtId: row.cancha_id,
    courtName: row.cancha_nombre,
    sportId: row.deporte_id,
    sportName: row.deporte_nombre,
    start: row.inicio,
    end: row.fin,
    status: row.estado,
    channel: row.canal_origen,
    totalAmount: Number(row.monto_total),
    advanceAmount: Number(row.monto_adelanto_requerido),
    isTimeException: row.es_excepcion_horaria,
    createdAt: row.created_at,
  }
}

function buildClientsUrl(pathname: string, filters: ClientsFilters) {
  const params = new URLSearchParams()
  if (filters.courtIds.length) params.set('court', filters.courtIds.join(','))
  if (filters.query.trim()) params.set('q', filters.query.trim())
  if (filters.page > 1) params.set('page', String(filters.page))
  return params.size ? `${pathname}?${params.toString()}` : pathname
}

function QuickFilter({ active, label, count, onClick, tone = 'default' }: { active: boolean; label: string; count: number; onClick: () => void; tone?: 'default' | 'warning' | 'success' }) {
  const palette = tone === 'warning' ? 'hover:border-warning/50' : tone === 'success' ? 'hover:border-success/50' : 'hover:border-primary/60'
  return <button type="button" onClick={onClick} className={cn('flex min-w-35 items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors', active ? 'border-secondary bg-secondary text-secondary-foreground shadow-sm' : `bg-card ${palette}`)}><span className={cn('grid size-8 place-items-center rounded-xl text-xs font-black', active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>{count}</span><span><span className="block text-[10px] font-extrabold uppercase tracking-[.1em] opacity-65">{label}</span><span className="mt-0.5 block text-xs font-bold">En esta página</span></span></button>
}

export function ClientsDashboard({ data }: { data: ClientsData }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isRefreshing, startRefresh] = useTransition()
  const [query, setQuery] = useState(data.filters.query)
  const [segment, setSegment] = useState<Segment>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [history, setHistory] = useState<Record<string, ClientReservation[]>>({})
  const [historyStatus, setHistoryStatus] = useState<Record<string, 'loading' | 'error'>>({})
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`clients:${data.localId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => startRefresh(() => router.refresh()))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [data.localId, router])

  const selected = data.clients.find((client) => client.id === selectedId) ?? null

  function selectClient(client: ClientSummary) {
    setSelectedId(client.id)
    if (history[client.id] || historyStatus[client.id] === 'loading') return
    setHistoryStatus((prev) => ({ ...prev, [client.id]: 'loading' }))
    const supabase = createClient()
    supabase.rpc('obtener_reservas_cliente_local_dueno', {
      p_local_id: data.localId,
      p_cliente_id: client.clienteId ?? undefined,
      p_telefono: client.clienteId ? undefined : client.phone ?? undefined,
      p_limite: 50,
    }).then(({ data: rows, error }) => {
      if (error) {
        console.error('[clients:history]', { code: error.code, message: error.message })
        setHistoryStatus((prev) => ({ ...prev, [client.id]: 'error' }))
        return
      }
      setHistory((prev) => ({ ...prev, [client.id]: (rows ?? []).map(mapReservation) }))
      setHistoryStatus((prev) => { const next = { ...prev }; delete next[client.id]; return next })
    })
  }

  const counts = useMemo(() => {
    const currentMonth = monthKey()
    return {
      account: data.clients.filter((client) => client.isAccount).length,
      recurring: data.clients.filter((client) => client.totalReservations >= 2).length,
      recent: data.clients.filter((client) => monthKey(client.firstReservation) === currentMonth).length,
      incidents: data.clients.filter((client) => incidentCount(client) > 0).length,
    }
  }, [data.clients])

  const filtered = useMemo(() => data.clients.filter((client) => {
    if (segment === 'account') return client.isAccount
    if (segment === 'recurring') return client.totalReservations >= 2
    if (segment === 'recent') return monthKey(client.firstReservation) === monthKey()
    if (segment === 'incidents') return incidentCount(client) > 0
    return true
  }), [data.clients, segment])

  function applyFilters(next: Partial<ClientsFilters>) {
    const filters: ClientsFilters = {
      courtIds: next.courtIds ?? data.filters.courtIds,
      query: next.query ?? data.filters.query,
      page: next.page ?? 1,
    }
    setSelectedId(null)
    setSegment('all')
    startRefresh(() => router.replace(buildClientsUrl(pathname, filters), { scroll: false }))
  }

  const courtKey = data.filters.courtIds.join(',')

  useEffect(() => {
    if (query === data.filters.query) return
    const timer = window.setTimeout(() => {
      setSelectedId(null)
      setSegment('all')
      startRefresh(() => router.replace(buildClientsUrl(pathname, { courtIds: courtKey ? courtKey.split(',') : [], query, page: 1 }), { scroll: false }))
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query, data.filters.query, courtKey, pathname, router, startRefresh])

  function toggleCourt(courtId: string) {
    const courtIds = data.filters.courtIds.includes(courtId)
      ? data.filters.courtIds.filter((id) => id !== courtId)
      : [...data.filters.courtIds, courtId]
    applyFilters({ courtIds, query })
  }

  function clearFilters() {
    setQuery('')
    applyFilters({ courtIds: [], query: '', page: 1 })
  }

  const courtLabel = data.filters.courtIds.length === 0
    ? 'Todas las canchas'
    : data.filters.courtIds.length === 1
      ? data.courts.find((court) => court.id === data.filters.courtIds[0])?.name ?? '1 cancha'
      : `${data.filters.courtIds.length} canchas`

  const firstResult = data.pagination.totalCount ? (data.pagination.page - 1) * data.pagination.pageSize + 1 : 0
  const lastResult = Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.totalCount)
  const hasFilters = Boolean(data.filters.query || data.filters.courtIds.length)

  return (
    <div className="mx-auto w-full max-w-[1480px]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="eyebrow">Base de clientes</p><h1 className="mt-3 text-5xl font-black tracking-[-.045em] sm:text-6xl">Clientes</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Consulta quién juega en {data.localName}, su historial y cuánto reserva, con foco en el local o en canchas concretas.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => startRefresh(() => router.refresh())} disabled={isRefreshing}><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className={cn(isRefreshing && 'animate-spin')} />Actualizar</Button><Button asChild size="sm"><Link href="/panel/agenda"><HugeiconsIcon icon={Add01Icon} strokeWidth={2} />Nueva reserva</Link></Button></div>
      </div>

      <div className="mt-7 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <QuickFilter active={segment === 'account'} label="Con cuenta" count={counts.account} onClick={() => setSegment(segment === 'account' ? 'all' : 'account')} />
        <QuickFilter active={segment === 'recurring'} label="Recurrentes" count={counts.recurring} onClick={() => setSegment(segment === 'recurring' ? 'all' : 'recurring')} />
        <QuickFilter active={segment === 'recent'} label="Nuevos" count={counts.recent} onClick={() => setSegment(segment === 'recent' ? 'all' : 'recent')} tone="success" />
        <QuickFilter active={segment === 'incidents'} label="Con incidencias" count={counts.incidents} onClick={() => setSegment(segment === 'incidents' ? 'all' : 'incidents')} tone="warning" />
      </div>

      <div className={cn('mt-6 grid min-h-[620px] gap-5', selected ? 'xl:grid-cols-[minmax(0,1fr)_390px]' : '')}>
        <section className="min-w-0 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
          <div className="border-b border-border/75 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o teléfono" className="pl-10" /></div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-10 justify-start gap-2"><HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="text-primary" />{courtLabel}</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  <DropdownMenuLabel className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Filtrar por cancha</DropdownMenuLabel>
                  <DropdownMenuItem onSelect={(event) => { event.preventDefault(); applyFilters({ courtIds: [], query }) }} className="justify-between">Todas las canchas{data.filters.courtIds.length === 0 && <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4 text-primary" />}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {data.courts.map((court) => <DropdownMenuCheckboxItem key={court.id} checked={data.filters.courtIds.includes(court.id)} onSelect={(event) => { event.preventDefault(); toggleCourt(court.id) }}>{court.name}</DropdownMenuCheckboxItem>)}
                  {!data.courts.length && <p className="px-2 py-1.5 text-xs text-muted-foreground">Este local no tiene canchas.</p>}
                </DropdownMenuContent>
              </DropdownMenu>
              {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Limpiar</Button>}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>Mostrando <strong className="text-foreground">{firstResult}–{lastResult}</strong> de <strong className="text-foreground">{data.pagination.totalCount}</strong> clientes</span><span>{segment !== 'all' ? `${filtered.length} en esta página` : `Página ${data.pagination.page} de ${data.pagination.totalPages}`}</span></div>
          </div>

          <div className="divide-y divide-border/70">
            {filtered.map((client) => <ClientRow key={client.id} client={client} selected={selected?.id === client.id} onClick={() => selectClient(client)} localId={data.localId} courts={data.courts} />)}
            {!filtered.length && <div className="grid min-h-80 place-items-center px-6 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted"><HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-5 text-muted-foreground" /></span><h2 className="mt-4 text-lg font-black">No hay clientes con estos filtros</h2><p className="mt-1 text-sm text-muted-foreground">Prueba otra cancha o término de búsqueda.</p>{hasFilters && <Button variant="ghost" size="sm" className="mt-3" onClick={clearFilters}>Limpiar filtros</Button>}</div></div>}
          </div>
          {data.pagination.totalCount > 0 && <div className="flex items-center justify-between border-t border-border/75 p-4"><Button size="sm" variant="outline" disabled={data.pagination.page <= 1 || isRefreshing} onClick={() => applyFilters({ page: data.pagination.page - 1 })}><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />Anterior</Button><span className="text-xs font-bold text-muted-foreground">Página {data.pagination.page} / {data.pagination.totalPages}</span><Button size="sm" variant="outline" disabled={data.pagination.page >= data.pagination.totalPages || isRefreshing} onClick={() => applyFilters({ page: data.pagination.page + 1 })}>Siguiente<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} /></Button></div>}
        </section>

        {selected && <ClientDetail client={selected} history={history[selected.id]} status={historyStatus[selected.id]} onClose={() => setSelectedId(null)} />}
      </div>
    </div>
  )
}

function ClientRow({ client, selected, onClick, localId, courts }: { client: ClientSummary; selected: boolean; onClick: () => void; localId: string; courts: ClientCourt[] }) {
  const incidents = incidentCount(client)
  return <div className={cn('group flex w-full items-center gap-3 px-4 py-4 transition-colors sm:px-5', selected ? 'bg-primary/10' : 'hover:bg-muted/55')}>
    <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 text-left">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-muted text-xs font-black text-muted-foreground">{initials(client.name)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5"><p className="truncate text-sm font-extrabold">{client.name}</p>{client.isAccount ? <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-extrabold text-primary-foreground">CUENTA</span> : <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-extrabold text-muted-foreground">EXTERNO</span>}{client.totalReservations >= 2 && <span className="rounded-md bg-success/18 px-1.5 py-0.5 text-[9px] font-extrabold text-success-foreground">RECURRENTE</span>}</div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{client.phone ?? 'Sin teléfono'}</p>
        <p className="mt-1 text-xs text-muted-foreground sm:hidden">{client.totalReservations} reserva{client.totalReservations === 1 ? '' : 's'} · {formatMoney(client.totalAmount)}</p>
      </div>
      <div className="hidden min-w-0 shrink-0 sm:block"><p className="text-xs font-bold">{client.totalReservations} reserva{client.totalReservations === 1 ? '' : 's'}</p><p className="mt-1 text-[11px] text-muted-foreground">Última {formatDate(client.lastReservation, { day: 'numeric', month: 'short', year: 'numeric' })}</p></div>
      <div className="hidden min-w-0 shrink-0 sm:block"><p className="text-xs font-bold">{formatMoney(client.totalAmount)}</p><p className={cn('mt-1 text-[11px]', incidents ? 'text-warning-foreground' : 'text-muted-foreground')}>{incidents ? `${incidents} incidencia${incidents === 1 ? '' : 's'}` : 'Sin incidencias'}</p></div>
      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className={cn('hidden size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block', selected && 'text-foreground')} />
    </button>
    <ClientBookingDialog localId={localId} client={client} courts={courts} />
  </div>
}

function ClientDetail({ client, history, status, onClose }: { client: ClientSummary; history?: ClientReservation[]; status?: 'loading' | 'error'; onClose: () => void }) {
  const incidents = incidentCount(client)
  const phoneDigits = client.phone?.replace(/\D/g, '') ?? ''
  return <aside className="min-w-0 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[0_14px_35px_oklch(0.205_0.032_145/0.08)] xl:sticky xl:top-0 xl:max-h-[calc(100dvh-8.5rem)] xl:overflow-y-auto">
    <div className="border-b border-border/75 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="eyebrow">Ficha del cliente</p><h2 className="mt-2 truncate text-2xl font-black tracking-[-.035em]">{client.name}</h2><p className="mt-1 text-xs text-muted-foreground">{client.isAccount ? 'Cuenta Grassly' : 'Cliente externo'}</p></div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar detalle"><HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} /></Button>
      </div>
      {client.phone && <div className="mt-4 flex flex-wrap gap-2"><a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer" className="rounded-xl border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-accent">WhatsApp</a><a href={`tel:${client.phone}`} className="rounded-xl border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-accent">Llamar</a></div>}
    </div>
    <div className="space-y-5 p-5">
      <section className="grid grid-cols-2 gap-2">
        <Metric icon={Invoice03Icon} label="Reservas" value={String(client.totalReservations)} dark />
        <Metric icon={CheckmarkCircle01Icon} label="Confirmadas" value={String(client.confirmed)} />
        <Metric icon={Calendar03Icon} label="Completadas" value={String(client.completed)} />
        <Metric icon={Money03Icon} label="Facturado" value={formatMoney(client.totalAmount)} />
      </section>
      <section className="rounded-2xl border border-border/70 bg-muted/35 p-3.5">
        <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Actividad</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div><dt className="text-muted-foreground">Primera reserva</dt><dd className="mt-0.5 font-bold">{formatDate(client.firstReservation, { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div>
          <div><dt className="text-muted-foreground">Última reserva</dt><dd className="mt-0.5 font-bold">{formatDate(client.lastReservation, { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div>
          <div><dt className="text-muted-foreground">Próxima reserva</dt><dd className="mt-0.5 font-bold">{client.nextReservation ? formatDateTime(client.nextReservation) : 'Sin agendar'}</dd></div>
          <div><dt className="text-muted-foreground">Incidencias</dt><dd className={cn('mt-0.5 font-bold', incidents ? 'text-warning-foreground' : '')}>{incidents ? `${incidents} registrada${incidents === 1 ? '' : 's'}` : 'Ninguna'}</dd></div>
        </dl>
        {client.pendingValidation > 0 && <p className="mt-3 rounded-xl bg-warning/15 px-2.5 py-2 text-xs font-semibold text-warning-foreground">Tiene {client.pendingValidation} comprobante{client.pendingValidation === 1 ? '' : 's'} por validar.</p>}
      </section>
      <section>
        <div className="flex items-center justify-between"><p className="text-sm font-extrabold">Historial de reservas</p><span className="text-[11px] font-bold text-muted-foreground">Últimas 50</span></div>
        {status === 'loading' ? <div className="mt-3 space-y-2">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
          : status === 'error' ? <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2.5 text-xs font-semibold text-destructive">No se pudo cargar el historial. Inténtalo de nuevo.</p>
            : history?.length ? <ol className="mt-3 space-y-2">{history.map((reservation) => <HistoryRow key={reservation.id} reservation={reservation} />)}</ol>
              : <p className="mt-3 rounded-xl bg-muted px-3 py-2.5 text-xs text-muted-foreground">Este cliente todavía no tiene reservas registradas.</p>}
      </section>
      <section className="space-y-2 border-t border-border/70 pt-4">
        <Button asChild size="sm" variant="ghost" className="w-full justify-start"><Link href="/panel/agenda">Abrir en agenda <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} /></Link></Button>
      </section>
    </div>
  </aside>
}

function HistoryRow({ reservation }: { reservation: ClientReservation }) {
  const meta = RESERVATION_STATUS[reservation.status]
  return <li className="rounded-2xl border border-border/70 bg-muted/25 p-3">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0"><p className="text-xs font-extrabold">{formatDate(reservation.start, { weekday: 'short', day: 'numeric', month: 'short' })}</p><p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{formatDate(reservation.start, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} — {formatDate(reservation.end, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}</p></div>
      <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold', meta.tone)}><span className={cn('size-1.5 rounded-full', meta.dot)} />{meta.label}</span>
    </div>
    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground"><span className="truncate">{reservation.courtName} · {reservation.sportName ?? 'Deporte'} · {CHANNEL[reservation.channel]}</span><strong className="shrink-0 text-foreground">{formatMoney(reservation.totalAmount)}</strong></div>
  </li>
}

function Metric({ icon, label, value, dark = false }: { icon: IconSvgElement; label: string; value: string; dark?: boolean }) {
  return <div className={cn('rounded-2xl p-3', dark ? 'bg-secondary text-secondary-foreground' : 'bg-muted')}><div className={cn('flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.1em]', dark ? 'text-secondary-foreground/60' : 'text-muted-foreground')}><HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5 text-primary" />{label}</div><p className="mt-2 text-sm font-black">{value}</p></div>
}
