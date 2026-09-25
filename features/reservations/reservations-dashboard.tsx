'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Calendar03Icon, Cancel01Icon, CheckmarkCircle01Icon, Clock01Icon, FilterHorizontalIcon, Invoice03Icon, Money03Icon, Search01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'
import { CancelReservationForm, ConfirmReservationForm, ExtendReservationForm, NoShowReservationForm, PaymentMovementForm, RejectReservationForm } from '@/features/agenda/operation-forms'
import type { OwnerReservation, ReservationChannel, ReservationsData, ReservationsFilters, ReservationStatus } from './types'

type DetailMode = 'summary' | 'confirm' | 'reject' | 'payment' | 'extend' | 'no-show' | 'cancel'

const STATUS: Record<ReservationStatus, { label: string; tone: string; dot: string }> = {
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
const LIMA = 'America/Lima'

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-PE', { timeZone: LIMA, ...options }).format(new Date(value))
}

function formatDateTime(value: string) {
  return formatDate(value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}

function timeRange(reservation: OwnerReservation) {
  return `${formatDate(reservation.start, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} — ${formatDate(reservation.end, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`
}

function duration(reservation: OwnerReservation) {
  const minutes = Math.max(0, Math.round((new Date(reservation.end).getTime() - new Date(reservation.start).getTime()) / 60000))
  const hours = Math.floor(minutes / 60)
  return minutes % 60 ? `${hours} h 30 min` : `${hours} h`
}

function reservationDate(reservation: OwnerReservation) {
  return formatDate(reservation.start, { weekday: 'short', day: 'numeric', month: 'short' })
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'CL'
}

function reservationAgendaHref(reservation: OwnerReservation) {
  const date = formatDate(reservation.start, { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
  return `/panel/agenda?date=${date}&reservation=${reservation.id}`
}

function dateInLima() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: LIMA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function QuickFilter({ active, label, count, onClick, tone = 'default' }: { active: boolean; label: string; count: number; onClick: () => void; tone?: 'default' | 'warning' | 'success' }) {
  const palette = tone === 'warning' ? 'hover:border-warning/50' : tone === 'success' ? 'hover:border-success/50' : 'hover:border-primary/60'
  return <button type="button" onClick={onClick} className={cn('flex min-w-35 items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors', active ? 'border-secondary bg-secondary text-secondary-foreground shadow-sm' : `bg-card ${palette}`)}><span className={cn('grid size-8 place-items-center rounded-xl text-xs font-black', active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>{count}</span><span><span className="block text-[10px] font-extrabold uppercase tracking-[.1em] opacity-65">{label}</span><span className="mt-0.5 block text-xs font-bold">En esta página</span></span></button>
}

export function ReservationsDashboard({ data }: { data: ReservationsData }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isRefreshing, startRefresh] = useTransition()
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState(data.filters.from ?? '')
  const [dateTo, setDateTo] = useState(data.filters.to ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailMode, setDetailMode] = useState<DetailMode>('summary')

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`reservations:${data.localId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => startRefresh(() => router.refresh()))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movimientos_pago_reserva' }, () => startRefresh(() => router.refresh()))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [data.localId, router])

  const counts = useMemo(() => ({
    validation: data.reservations.filter((item) => item.status === 'pendiente_validacion').length,
    confirmed: data.reservations.filter((item) => item.status === 'confirmada').length,
    completed: data.reservations.filter((item) => item.status === 'completada').length,
    incidents: data.reservations.filter((item) => ['rechazada_pago', 'no_show', 'cancelada_cliente', 'cancelada_local'].includes(item.status)).length,
  }), [data.reservations])

  const filtered = useMemo(() => data.reservations.filter((reservation) => {
    const haystack = `${reservation.customerName} ${reservation.customerPhone ?? ''} ${reservation.courtName} ${reservation.id}`.toLowerCase()
    return !query || haystack.includes(query.toLowerCase())
  }), [data.reservations, query])

  const selected = filtered.find((reservation) => reservation.id === selectedId) ?? data.reservations.find((reservation) => reservation.id === selectedId) ?? null

  function select(reservation: OwnerReservation) {
    setSelectedId(reservation.id)
    setDetailMode('summary')
  }

  function refreshDetails() {
    setDetailMode('summary')
    startRefresh(() => router.refresh())
  }

  function updateFilters(next: Partial<ReservationsFilters>, preservePage = false) {
    const filters = { ...data.filters, ...next }
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.courtId) params.set('court', filters.courtId)
    if (filters.channel) params.set('channel', filters.channel)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    const page = preservePage ? filters.page : 1
    if (page > 1) params.set('page', String(page))
    setSelectedId(null)
    startRefresh(() => router.replace(params.size ? `${pathname}?${params.toString()}` : pathname))
  }

  function clearFilters() {
    setQuery('')
    setDateFrom('')
    setDateTo('')
    updateFilters({ status: undefined, courtId: undefined, channel: undefined, from: undefined, to: undefined, page: 1 })
  }

  const firstResult = data.pagination.totalCount ? (data.pagination.page - 1) * data.pagination.pageSize + 1 : 0
  const lastResult = Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.totalCount)
  const today = dateInLima()

  return (
    <div className="mx-auto w-full max-w-[1480px]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="eyebrow">Centro de control</p><h1 className="mt-3 text-5xl font-black tracking-[-.045em] sm:text-6xl">Reservas</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Sigue cada solicitud, pago y reserva de {data.localName}, sin perder el contexto de la operación.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => startRefresh(() => router.refresh())} disabled={isRefreshing}><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className={cn(isRefreshing && 'animate-spin')} />Actualizar</Button><Button asChild size="sm"><Link href="/panel/agenda"><HugeiconsIcon icon={Add01Icon} strokeWidth={2} />Nueva reserva</Link></Button></div>
      </div>

      <div className="mt-7 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <QuickFilter active={data.filters.status === 'pendiente_validacion'} label="Por validar" count={counts.validation} onClick={() => updateFilters({ status: data.filters.status === 'pendiente_validacion' ? undefined : 'pendiente_validacion' })} tone="warning" />
        <QuickFilter active={data.filters.status === 'confirmada'} label="Confirmadas" count={counts.confirmed} onClick={() => updateFilters({ status: data.filters.status === 'confirmada' ? undefined : 'confirmada' })} />
        <QuickFilter active={data.filters.status === 'completada'} label="Completadas" count={counts.completed} onClick={() => updateFilters({ status: data.filters.status === 'completada' ? undefined : 'completada' })} tone="success" />
        <QuickFilter active={data.filters.status === 'rechazada_pago'} label="Incidencias" count={counts.incidents} onClick={() => updateFilters({ status: data.filters.status === 'rechazada_pago' ? undefined : 'rechazada_pago' })} />
      </div>

      <div className={cn('mt-6 grid min-h-[620px] gap-5', selected ? 'xl:grid-cols-[minmax(0,1fr)_390px]' : '')}>
        <section className="min-w-0 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
          <div className="border-b border-border/75 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en esta página" className="pl-10" /></div>
              <div className="flex flex-wrap gap-2"><Select value={data.filters.courtId ?? 'all'} onValueChange={(value) => updateFilters({ courtId: value === 'all' ? undefined : value })}><SelectTrigger className="h-10 w-35 bg-background text-xs"><SelectValue placeholder="Cancha" /></SelectTrigger><SelectContent><SelectItem value="all">Todas las canchas</SelectItem>{data.courts.map((court) => <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>)}</SelectContent></Select><Select value={data.filters.channel ?? 'all'} onValueChange={(value) => updateFilters({ channel: value === 'all' ? undefined : value as ReservationChannel })}><SelectTrigger className="h-10 w-34 bg-background text-xs"><SelectValue placeholder="Canal" /></SelectTrigger><SelectContent><SelectItem value="all">Todo canal</SelectItem><SelectItem value="app">App Grassly</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="presencial">Presencial</SelectItem></SelectContent></Select><Select value={data.filters.status ?? 'all'} onValueChange={(value) => updateFilters({ status: value === 'all' ? undefined : value as ReservationStatus })}><SelectTrigger className="h-10 w-37 bg-background text-xs"><HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} className="size-4" /><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos los estados</SelectItem>{Object.entries(STATUS).map(([key, value]) => <SelectItem key={key} value={key}>{value.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="mt-3 rounded-2xl bg-muted/45 p-3"><div className="flex flex-col gap-3 xl:flex-row xl:items-end"><div className="grid flex-1 gap-2 sm:grid-cols-2"><label className="text-[10px] font-extrabold uppercase tracking-[.1em] text-muted-foreground">Desde<Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1.5 h-9 bg-background text-xs" /></label><label className="text-[10px] font-extrabold uppercase tracking-[.1em] text-muted-foreground">Hasta<Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1.5 h-9 bg-background text-xs" /></label></div><div className="flex flex-wrap gap-1.5"><Button size="xs" variant="ghost" onClick={() => { setDateFrom(today); setDateTo(today); updateFilters({ from: today, to: today }) }}>Hoy</Button><Button size="xs" variant="ghost" onClick={() => { const from = shiftDate(today, -6); setDateFrom(from); setDateTo(today); updateFilters({ from, to: today }) }}>7 días</Button><Button size="xs" variant="ghost" onClick={() => { const from = `${today.slice(0, 7)}-01`; setDateFrom(from); setDateTo(today); updateFilters({ from, to: today }) }}>Este mes</Button><Button size="sm" onClick={() => updateFilters({ from: dateFrom || undefined, to: dateTo || undefined })}>Aplicar fechas</Button></div></div></div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>Mostrando <strong className="text-foreground">{firstResult}–{lastResult}</strong> de <strong className="text-foreground">{data.pagination.totalCount}</strong> reservas</span><span>{query ? `${filtered.length} en esta página` : `Página ${data.pagination.page} de ${data.pagination.totalPages}`}</span></div>
          </div>

          <div className="divide-y divide-border/70">
            {filtered.map((reservation) => <ReservationRow key={reservation.id} reservation={reservation} selected={selected?.id === reservation.id} onClick={() => select(reservation)} />)}
            {!filtered.length && <div className="grid min-h-80 place-items-center px-6 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted"><HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} className="size-5 text-muted-foreground" /></span><h2 className="mt-4 text-lg font-black">No hay reservas con estos filtros</h2><p className="mt-1 text-sm text-muted-foreground">Prueba otro rango, estado, cancha o término de búsqueda.</p><Button variant="ghost" size="sm" className="mt-3" onClick={clearFilters}>Limpiar filtros</Button></div></div>}
          </div>
          {data.pagination.totalCount > 0 && <div className="flex items-center justify-between border-t border-border/75 p-4"><Button size="sm" variant="outline" disabled={data.pagination.page <= 1 || isRefreshing} onClick={() => updateFilters({ page: data.pagination.page - 1 }, true)}><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />Anterior</Button><span className="text-xs font-bold text-muted-foreground">Página {data.pagination.page} / {data.pagination.totalPages}</span><Button size="sm" variant="outline" disabled={data.pagination.page >= data.pagination.totalPages || isRefreshing} onClick={() => updateFilters({ page: data.pagination.page + 1 }, true)}>Siguiente<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} /></Button></div>}
        </section>

        {selected && <ReservationDetail reservation={selected} mode={detailMode} setMode={setDetailMode} onClose={() => setSelectedId(null)} onSuccess={refreshDetails} />}
      </div>
    </div>
  )
}

function ReservationRow({ reservation, selected, onClick }: { reservation: OwnerReservation; selected: boolean; onClick: () => void }) {
  const meta = STATUS[reservation.status]
  return <button type="button" onClick={onClick} className={cn('group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4 text-left transition-colors sm:grid-cols-[100px_minmax(190px,1.25fr)_minmax(130px,1fr)_auto_auto] sm:gap-4 sm:px-5', selected ? 'bg-primary/10' : 'hover:bg-muted/55')}>
    <div className="hidden sm:block"><p className="capitalize text-xs font-extrabold">{reservationDate(reservation)}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{timeRange(reservation)}</p></div>
    <span className="grid size-10 place-items-center rounded-2xl bg-muted text-xs font-black text-muted-foreground">{initials(reservation.customerName)}</span>
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-extrabold">{reservation.customerName}</p>{reservation.isTimeException && <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[9px] font-extrabold text-primary-foreground">+30 MIN</span>}</div><p className="mt-1 truncate text-xs text-muted-foreground sm:hidden">{reservationDate(reservation)} · {timeRange(reservation)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{reservation.courtName} · {reservation.sportName} · {CHANNEL[reservation.channel]}</p></div>
    <div className="hidden min-w-0 sm:block"><p className="text-xs font-bold">{formatMoney(reservation.totalAmount)}</p><p className="mt-1 text-[11px] text-muted-foreground">{duration(reservation)} · adelanto {formatMoney(reservation.advanceAmount)}</p></div>
    <span className={cn('hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold sm:inline-flex', meta.tone)}><span className={cn('size-1.5 rounded-full', meta.dot)} />{meta.label}</span>
    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className={cn('size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5', selected && 'text-foreground')} />
  </button>
}

function ReservationDetail({ reservation, mode, setMode, onClose, onSuccess }: { reservation: OwnerReservation; mode: DetailMode; setMode: (mode: DetailMode) => void; onClose: () => void; onSuccess: () => void }) {
  const meta = STATUS[reservation.status]
  const canReview = reservation.status === 'pendiente_validacion' && Boolean(reservation.proofPath)
  const canExtend = ['confirmada', 'completada'].includes(reservation.status) && !reservation.isTimeException
  const canPayment = ['confirmada', 'completada'].includes(reservation.status)
  const canCancel = ['pendiente_pago', 'pendiente_validacion', 'confirmada'].includes(reservation.status)
  return <aside className="min-w-0 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[0_14px_35px_oklch(0.205_0.032_145/0.08)] xl:sticky xl:top-0 xl:max-h-[calc(100dvh-8.5rem)] xl:overflow-y-auto">
    <div className="border-b border-border/75 p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="eyebrow">Detalle de reserva</p><h2 className="mt-2 truncate text-2xl font-black tracking-[-.035em]">{reservation.customerName}</h2><p className="mt-1 font-mono text-[10px] text-muted-foreground">#{reservation.id.slice(0, 8).toUpperCase()}</p></div><Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar detalle"><HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} /></Button></div><div className="mt-4 flex flex-wrap gap-2"><span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold', meta.tone)}><span className={cn('size-1.5 rounded-full', meta.dot)} />{meta.label}</span><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-extrabold text-muted-foreground">{CHANNEL[reservation.channel]}</span></div></div>
    <div className="space-y-5 p-5">
      {mode !== 'summary' ? <DetailOperation reservation={reservation} mode={mode} onCancel={() => setMode('summary')} onSuccess={onSuccess} /> : <>
        <section className="grid grid-cols-2 gap-2"><Metric icon={Calendar03Icon} label="Fecha" value={formatDate(reservation.start, { day: 'numeric', month: 'long', weekday: 'short' })} /><Metric icon={Clock01Icon} label="Horario" value={`${timeRange(reservation)} · ${duration(reservation)}`} dark /></section>
        <section className="rounded-2xl border border-border/70 bg-muted/35 p-3.5"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Cancha y cliente</p><div className="mt-3 flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" /></span><div className="min-w-0"><p className="text-sm font-extrabold">{reservation.courtName} <span className="font-medium text-muted-foreground">· {reservation.sportName}</span></p><p className="mt-1 text-xs text-muted-foreground">{reservation.customerPhone ?? 'Sin teléfono registrado'}</p></div></div>{reservation.isTimeException && <p className="mt-3 rounded-xl bg-primary/15 px-2.5 py-2 text-xs font-semibold text-foreground">Horario especial autorizado: incluye una extensión de 30 minutos.</p>}</section>
        <section><div className="flex items-center justify-between"><p className="text-sm font-extrabold">Cobro y comprobante</p><HugeiconsIcon icon={Money03Icon} strokeWidth={2} className="size-4 text-primary" /></div><div className="mt-2 grid grid-cols-2 gap-2"><Amount label="Total acordado" value={formatMoney(reservation.totalAmount)} /><Amount label="Adelanto requerido" value={formatMoney(reservation.advanceAmount)} /></div>{reservation.proofUrl ? <a className="mt-3 flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-xs font-bold transition-colors hover:bg-accent" href={reservation.proofUrl} target="_blank" rel="noreferrer"><span>Comprobante recibido</span><HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" /></a> : reservation.proofPath ? <p className="mt-3 rounded-xl bg-muted px-3 py-2.5 text-xs text-muted-foreground">Comprobante registrado de forma privada.</p> : null}</section>
        <DetailTimeline reservation={reservation} />
        {(reservation.notes || reservation.rejectedComment || reservation.cancellationReason) && <section className="rounded-2xl border border-border/70 p-3.5"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Notas e incidencias</p>{reservation.notes && <p className="mt-2 text-xs leading-5">{reservation.notes}</p>}{reservation.rejectedComment && <p className="mt-2 text-xs leading-5 text-destructive">Pago rechazado: {reservation.rejectedComment}</p>}{reservation.cancellationReason && <p className="mt-2 text-xs leading-5 text-muted-foreground">Cancelación: {reservation.cancellationReason}</p>}</section>}
        <section className="space-y-2 border-t border-border/70 pt-4"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Acciones operativas</p>{canReview && <div className="grid grid-cols-2 gap-2"><Button size="sm" onClick={() => setMode('confirm')}><HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} />Validar pago</Button><Button size="sm" variant="outline" onClick={() => setMode('reject')}>Rechazar</Button></div>}{canPayment && <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => setMode('payment')}><HugeiconsIcon icon={Money03Icon} strokeWidth={2} />Registrar cobro</Button>}{canExtend && <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => setMode('extend')}><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />Autorizar +30 min</Button>}{reservation.status === 'confirmada' && <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => setMode('no-show')}>Registrar inasistencia</Button>}{canCancel && <Button size="sm" variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => setMode('cancel')}>Registrar cancelación</Button>}<Button asChild size="sm" variant="ghost" className="w-full justify-start"><Link href={reservationAgendaHref(reservation)}>Abrir en agenda <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} /></Link></Button></section>
      </>}
    </div>
  </aside>
}

function DetailOperation({ reservation, mode, onCancel, onSuccess }: { reservation: OwnerReservation; mode: DetailMode; onCancel: () => void; onSuccess: () => void }) {
  const title: Record<Exclude<DetailMode, 'summary'>, string> = { confirm: 'Validar comprobante', reject: 'Rechazar comprobante', payment: 'Registrar cobro', extend: 'Autorizar extensión', 'no-show': 'Registrar inasistencia', cancel: 'Registrar cancelación' }
  return <section><button type="button" onClick={onCancel} className="text-xs font-bold text-muted-foreground hover:text-foreground">← Volver al detalle</button><h3 className="mt-3 text-lg font-black">{title[mode as Exclude<DetailMode, 'summary'>]}</h3><div className="mt-4">{mode === 'confirm' && <ConfirmReservationForm reservationId={reservation.id} onCancel={onCancel} onSuccess={onSuccess} />}{mode === 'reject' && <RejectReservationForm reservationId={reservation.id} onCancel={onCancel} onSuccess={onSuccess} />}{mode === 'payment' && <PaymentMovementForm reservationId={reservation.id} onCancel={onCancel} onSuccess={onSuccess} />}{mode === 'extend' && <ExtendReservationForm reservationId={reservation.id} onCancel={onCancel} onSuccess={onSuccess} />}{mode === 'no-show' && <NoShowReservationForm reservationId={reservation.id} onCancel={onCancel} onSuccess={onSuccess} />}{mode === 'cancel' && <CancelReservationForm reservationId={reservation.id} canCancelAsClient onCancel={onCancel} onSuccess={onSuccess} />}</div></section>
}

function Metric({ icon, label, value, dark = false }: { icon: IconSvgElement; label: string; value: string; dark?: boolean }) {
  return <div className={cn('rounded-2xl p-3', dark ? 'bg-secondary text-secondary-foreground' : 'bg-muted')}><div className={cn('flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.1em]', dark ? 'text-secondary-foreground/60' : 'text-muted-foreground')}><HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5 text-primary" />{label}</div><p className="mt-2 text-xs font-extrabold capitalize leading-5">{value}</p></div>
}

function Amount({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className={cn('rounded-xl p-2.5', emphasis ? 'bg-warning/20 text-warning-foreground' : 'bg-muted/60')}><p className="text-[9px] font-extrabold uppercase tracking-[.1em] opacity-60">{label}</p><p className="mt-1 text-xs font-black">{value}</p></div>
}

function DetailTimeline({ reservation }: { reservation: OwnerReservation }) {
  const events = [{ label: 'Reserva creada', detail: `${CHANNEL[reservation.channel]} · ${formatDateTime(reservation.createdAt)}`, tone: 'bg-primary' }]
  if (reservation.proofUploadedAt) events.push({ label: 'Comprobante recibido', detail: formatDateTime(reservation.proofUploadedAt), tone: 'bg-warning' })
  if (reservation.status === 'confirmada' || reservation.status === 'completada') events.push({ label: 'Reserva confirmada', detail: `Estado actual: ${STATUS[reservation.status].label}`, tone: 'bg-success' })
  if (reservation.extensions.length) events.push({ label: '+30 min autorizado', detail: `${reservation.extensions.length} extensión${reservation.extensions.length > 1 ? 'es' : ''} registrada${reservation.extensions.length > 1 ? 's' : ''}`, tone: 'bg-primary' })
  if (reservation.rejectedAt) events.push({ label: 'Pago rechazado', detail: formatDateTime(reservation.rejectedAt), tone: 'bg-destructive' })
  if (reservation.cancelledAt) events.push({ label: 'Reserva cancelada', detail: formatDateTime(reservation.cancelledAt), tone: 'bg-muted-foreground' })
  return <section><p className="text-sm font-extrabold">Ruta de la reserva</p><ol className="mt-3 space-y-3 border-l border-border pl-4">{events.map((event, index) => <li key={`${event.label}-${index}`} className="relative"><span className={cn('absolute -left-[21px] top-1 size-2.5 rounded-full ring-4 ring-card', event.tone)} /><p className="text-xs font-bold">{event.label}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{event.detail}</p></li>)}</ol></section>
}
