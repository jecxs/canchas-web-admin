import Link from 'next/link'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  CalendarAdd01Icon,
  ChartLineData01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Invoice03Icon,
  Money03Icon,
  PercentIcon,
  Wallet03Icon,
} from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getSubscriptionPresentation, localStatePresentation } from '@/components/dashboard/status'
import { PublicationChecklistCard } from '@/features/local-publication/publication-checklist-card'
import { cn } from '@/lib/utils'
import type { LocalSummary, SubscriptionSummary } from '@/lib/auth/access'
import type { PublicationChecklist } from '@/features/local-publication/types'
import { OwnerMonthChart } from './month-chart'
import type { DashboardNextDay, DashboardReservation, OwnerDashboardData } from './types'

const LIMA = 'America/Lima'

type KpiTone = 'lime' | 'plum' | 'dark' | 'warning'
type NoticeTone = 'info' | 'warning' | 'destructive'

type OwnerDashboardProps = {
  data: OwnerDashboardData
  ownerName: string
  local: LocalSummary
  subscription: SubscriptionSummary | null
  checklist: PublicationChecklist
}

const KPI_TONE: Record<KpiTone, string> = {
  lime: 'bg-primary/20 text-primary-foreground',
  plum: 'bg-plum/12 text-plum',
  dark: 'bg-foreground/8 text-foreground',
  warning: 'bg-warning/25 text-warning-foreground',
}

const NOTICE_TONE: Record<NoticeTone, string> = {
  info: 'border-info/25 bg-info/10 text-info-foreground',
  warning: 'border-warning/40 bg-warning/15 text-warning-foreground',
  destructive: 'border-destructive/25 bg-destructive/10 text-destructive',
}

function money(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function percent(value: number) {
  return `${Math.round(value)}%`
}

function hours(value: number) {
  const rounded = Math.round(value * 10) / 10
  return `${rounded} h`
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

function dateKey(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: LIMA,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date()),
  )
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function daysUntil(today: string, target: string) {
  const diff = Date.parse(`${target.slice(0, 10)}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)
  if (!Number.isFinite(diff)) return 0
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

function waitingLabel(value: string | null) {
  if (!value) return 'Sin comprobante'
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000))
  if (minutes < 60) return `hace ${minutes} min`
  const hoursValue = Math.round(minutes / 60)
  if (hoursValue < 24) return `hace ${hoursValue} h`
  return `hace ${Math.round(hoursValue / 24)} d`
}

function buildNotice({
  local,
  subscription,
  trialDays,
  checklist,
}: {
  local: LocalSummary
  subscription: SubscriptionSummary | null
  trialDays: number | null
  checklist: PublicationChecklist
}) {
  if (local.moderation) {
    return {
      tone: 'warning' as const,
      title: 'Hay una revisión administrativa activa',
      message: local.moderation.reason,
      href: '/panel/estado-local',
      cta: 'Ver detalle',
    }
  }

  if (local.estado === 'trial' && trialDays !== null) {
    return {
      tone: trialDays <= 3 ? ('warning' as const) : ('info' as const),
      title: trialDays === 0 ? 'Tu periodo de prueba vence hoy' : `Te quedan ${trialDays} días de prueba`,
      message: 'Activa tu suscripción para mantener el panel, las reservas y tu visibilidad en la app.',
      href: '/panel/suscripcion',
      cta: 'Ver plan',
    }
  }

  if (local.estado === 'en_gracia' || subscription?.estado_facturacion === 'en_gracia') {
    return {
      tone: 'warning' as const,
      title: 'Tu cuenta está en periodo de gracia',
      message: subscription?.gracia_hasta
        ? `Regulariza tu pago antes del ${new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: LIMA }).format(new Date(subscription.gracia_hasta))} para no perder el acceso.`
        : 'Regulariza tu pago para no perder el acceso al panel y a las reservas.',
      href: '/panel/suscripcion',
      cta: 'Regularizar',
    }
  }

  if (subscription?.estado === 'pago_fallido') {
    return {
      tone: 'destructive' as const,
      title: 'No pudimos procesar tu último pago',
      message: 'Actualiza tu método de pago para evitar la suspensión del servicio.',
      href: '/panel/suscripcion',
      cta: 'Actualizar pago',
    }
  }

  if (!local.publicado) {
    return {
      tone: 'info' as const,
      title: 'Tu local todavía no está publicado',
      message: checklist.ready
        ? 'Ya cumples los requisitos. Publícalo para empezar a recibir reservas desde la app.'
        : 'Completa los requisitos de publicación para aparecer en la app y recibir reservas.',
      href: '#publicacion',
      cta: checklist.ready ? 'Publicar local' : 'Completar ficha',
    }
  }

  return null
}

function Metric({
  label,
  value,
  hint,
  icon,
  tone,
  href,
}: {
  label: string
  value: string
  hint: string
  icon: IconSvgElement
  tone: KpiTone
  href: string
}) {
  return (
    <Link href={href} className="group flex min-w-0 items-start gap-3">
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl transition-transform group-hover:-translate-y-0.5', KPI_TONE[tone])}>
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-extrabold uppercase tracking-[.14em] text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-3xl font-black leading-none tabular-nums">{value}</p>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{hint}</p>
      </div>
    </Link>
  )
}

function StatCell({
  label,
  value,
  hint,
  dark = false,
}: {
  label: string
  value: string
  hint: string
  dark?: boolean
}) {
  return (
    <div className="px-4 py-3">
      <p
        className={cn(
          'text-[10px] font-extrabold uppercase tracking-[.12em]',
          dark ? 'text-white/45' : 'text-muted-foreground',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-1 font-display text-2xl font-black leading-none tabular-nums',
          dark ? 'text-white' : 'text-foreground',
        )}
      >
        {value}
      </p>
      <p className={cn('mt-1 text-[11px] leading-4', dark ? 'text-white/40' : 'text-muted-foreground')}>
        {hint}
      </p>
    </div>
  )
}

function PendingRow({ reservation }: { reservation: DashboardReservation }) {
  return (
    <Link
      href={`/panel/agenda?date=${dateKey(reservation.start)}&reservation=${reservation.id}`}
      className="flex items-start gap-3 py-3.5 transition-colors hover:bg-muted/40"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warning/20 text-warning-foreground">
        <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{reservation.customerName}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {reservation.courtName} · {formatDateTime(reservation.start)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-black">{money(reservation.totalAmount)}</p>
        <p className="text-[11px] text-muted-foreground">{waitingLabel(reservation.proofUploadedAt)}</p>
      </div>
    </Link>
  )
}

function Donut({
  segments,
  center,
  centerLabel,
  size = 96,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  center: string
  centerLabel: string
  size?: number
}) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0)
  const safeSegments =
    total > 0
      ? segments.map((segment) => ({ ...segment, value: Math.max(0, segment.value) }))
      : [{ label: 'Sin datos', value: 1, color: 'rgba(255,255,255,.16)' }]
  const safeTotal = total > 0 ? total : 1
  const gradient = safeSegments
    .map((segment, index) => {
      const before = safeSegments
        .slice(0, index)
        .reduce((sum, item) => sum + item.value, 0)
      const start = (before / safeTotal) * 360
      const end = ((before + segment.value) / safeTotal) * 360
      return `${segment.color} ${start}deg ${end}deg`
    })
    .join(', ')

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(from -90deg, ${gradient})` }}
      />
      <div className="absolute inset-[15%] grid place-items-center rounded-full bg-plum text-center">
        <div>
          <p className="font-display text-xl font-black leading-none text-white tabular-nums">{center}</p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[.12em] text-white/45">{centerLabel}</p>
        </div>
      </div>
    </div>
  )
}

function NextDayCard({ day }: { day: DashboardNextDay }) {
  return (
    <Link
      href={`/panel/agenda?date=${day.date}`}
      className={cn(
        'rounded-xl border p-3 transition-colors',
        day.isToday
          ? 'border-primary bg-primary/15'
          : 'border-white/10 bg-white/[.05] hover:bg-white/10',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'text-[10px] font-extrabold uppercase tracking-[.12em]',
            day.isToday ? 'text-primary' : 'text-white/45',
          )}
        >
          {day.weekday}
        </span>
        {day.pendingValidation > 0 ? (
          <span className="size-1.5 rounded-full bg-warning" title={`${day.pendingValidation} por validar`} />
        ) : null}
      </div>
      <p className="mt-1 font-display text-3xl font-black leading-none text-white tabular-nums">
        {day.dayNumber}
      </p>
      <p className="mt-2 text-xs font-bold text-white/85">{day.reservations} reservas</p>
      <p className="text-[11px] text-white/45">{hours(day.soldHours)} vendidas</p>
    </Link>
  )
}

export function OwnerDashboard({
  data,
  ownerName,
  local,
  subscription,
  checklist,
}: OwnerDashboardProps) {
  const firstName = ownerName.trim().split(/\s+/)[0] || ownerName
  const state = localStatePresentation[local.estado]
  const subscriptionState = getSubscriptionPresentation(subscription)
  const trialDays =
    local.estado === 'trial' && local.fecha_fin_trial
      ? daysUntil(data.today, local.fecha_fin_trial)
      : null
  const notice = buildNotice({ local, subscription, trialDays, checklist })
  const next = data.todaySummary.nextReservation
  const showChecklist = !local.publicado || !checklist.ready

  return (
    <div className="w-full" data-owner-dashboard>
      <section className="sticky top-0 z-0 -mx-4 min-h-[360px] overflow-hidden rounded-b-[2rem] bg-secondary text-secondary-foreground shadow-floating md:-mx-6 lg:-mx-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-plum/35 blur-3xl"
        />

        <div className="relative grid gap-7 px-6 pt-5 pb-14 sm:px-8 sm:pt-6 sm:pb-16 lg:px-12 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground">{state.label}</Badge>
                <Badge className="border-white/15 bg-white/10 text-white">
                  {local.publicado ? 'Publicado en la app' : 'No publicado'}
                </Badge>
                {subscription ? (
                  <Badge className="border-white/15 bg-white/10 text-white/75">{subscriptionState.label}</Badge>
                ) : null}
              </div>

              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.18em] text-primary">
                Resumen del negocio
              </p>
              <h1 className="mt-2 font-display text-4xl font-black leading-[.92] tracking-tight sm:text-5xl lg:text-6xl">
                {greeting()}, {firstName}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-secondary-foreground/70">
                {local.nombre} · {local.direccion}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/panel/agenda">
                  <HugeiconsIcon icon={CalendarAdd01Icon} strokeWidth={2} />
                  Nueva reserva
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/panel/reservas?status=pendiente_validacion">
                  <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} />
                  Validar pagos
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="text-white/75 hover:bg-white/10 hover:text-white"
              >
                <Link href="/panel/reportes">
                  Ver reportes
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid content-start gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-primary">Próximo turno</p>
                <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-white/55" />
              </div>
              {next ? (
                <>
                  <p className="mt-3 font-display text-3xl font-black leading-none">{formatTime(next.start)}</p>
                  <p className="mt-2 text-sm font-bold">
                    {next.courtName} · {next.sportName}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    {formatDateTime(next.start)} · {next.customerName}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-white/65">No tienes reservas próximas.</p>
              )}
              <Link
                href={next ? `/panel/agenda?date=${dateKey(next.start)}` : '/panel/agenda'}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                Abrir agenda
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/45">Reservas hoy</p>
                <p className="mt-2 font-display text-3xl font-black leading-none tabular-nums">
                  {data.todaySummary.reservations}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/45">Ocupación</p>
                <p className="mt-2 font-display text-3xl font-black leading-none tabular-nums">
                  {percent(data.todaySummary.occupancyRate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 -mx-4 -mt-10 rounded-t-[2rem] bg-background px-4 pb-12 pt-7 shadow-[0_-24px_50px_-32px_rgba(0,0,0,0.45)] md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="space-y-7">
          {notice ? (
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm',
                NOTICE_TONE[notice.tone],
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold">{notice.title}</p>
                  <p className="mt-0.5 text-xs leading-5 opacity-80">{notice.message}</p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="bg-transparent">
                <Link href={notice.href}>{notice.cta}</Link>
              </Button>
            </div>
          ) : null}

          <section className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-border/70 pb-6 sm:grid-cols-3 xl:grid-cols-5">
            <Metric
              label="Reservas de hoy"
              value={String(data.todaySummary.reservations)}
              hint={`${data.todaySummary.confirmed} confirmadas · ${data.todaySummary.pendingValidation} por validar`}
              icon={Calendar03Icon}
              tone="lime"
              href="/panel/agenda"
            />
            <Metric
              label="Ocupación de hoy"
              value={percent(data.todaySummary.occupancyRate)}
              hint={`${hours(data.todaySummary.soldHours)} vendidas de ${hours(data.todaySummary.availableHours)}`}
              icon={PercentIcon}
              tone="dark"
              href="/panel/agenda"
            />
            <Metric
              label="Cobrado hoy"
              value={money(data.todaySummary.collected)}
              hint={`${data.todaySummary.collectedCount} cobros · neto ${money(data.todaySummary.collectedNet)}`}
              icon={Money03Icon}
              tone="lime"
              href="/panel/caja"
            />
            <Metric
              label="Por cobrar hoy"
              value={money(data.todaySummary.outstanding)}
              hint="Saldo pendiente de las reservas de hoy"
              icon={Wallet03Icon}
              tone="plum"
              href="/panel/reservas"
            />
            <Metric
              label="Por validar"
              value={String(data.pendingValidationCount)}
              hint={
                data.unreadNotifications > 0
                  ? `${data.unreadNotifications} avisos sin leer`
                  : 'Comprobantes esperando revisión'
              }
              icon={Invoice03Icon}
              tone="warning"
              href="/panel/reservas?status=pendiente_validacion"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Card
              className="gap-0 overflow-hidden rounded-2xl border-plum/15 py-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 100% 0%, color-mix(in oklab, var(--plum) 9%, transparent), transparent 38%)',
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-plum/[.04] px-5 py-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-muted-foreground">
                    Ingresos de {data.month.label}
                  </p>
                  <h2 className="mt-1 text-lg font-black tracking-tight">Cómo va el mes</h2>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/panel/reportes">
                    Ver reportes
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                  </Link>
                </Button>
              </div>

              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Cobrado real</p>
                  <p className="mt-1 font-display text-4xl font-black leading-none tabular-nums">
                    {money(data.month.collected)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    adelantos, saldos y extensiones registrados en caja
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Por cobrar</p>
                  <p className="mt-1 font-display text-4xl font-black leading-none text-plum tabular-nums">
                    {money(data.month.outstanding)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    saldo pendiente de reservas confirmadas y completadas
                  </p>
                </div>
              </div>

              <div className="px-5 pb-3">
                <OwnerMonthChart data={data.month.daily} />
              </div>

              <div className="grid grid-cols-2 gap-px border-t bg-plum/10 sm:grid-cols-4">
                <StatCell
                  label="Reservas"
                  value={String(data.month.reservations)}
                  hint="confirmadas y completadas"
                />
                <StatCell
                  label="Ticket promedio"
                  value={money(data.month.averageTicket)}
                  hint="por reserva cobrada"
                />
                <StatCell
                  label="Inasistencias"
                  value={String(data.month.noShowCount)}
                  hint={`${percent(data.month.noShowRate)} de las jugadas · no se presentaron`}
                />
                <StatCell
                  label="Recurrentes"
                  value={String(data.month.recurringClients)}
                  hint="clientes con 2+ reservas en 14 días"
                />
              </div>
            </Card>

            <section className="flex flex-col border-t border-border/60 pt-6 xl:border-t-0 xl:border-l xl:pl-6 xl:pt-0">
              <div className="flex items-start justify-between gap-3 border-b pb-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-muted-foreground">
                    Bandeja operativa
                  </p>
                  <h2 className="mt-1 text-lg font-black tracking-tight">Requiere tu atención</h2>
                </div>
                <Badge variant={data.pendingValidationCount > 0 ? 'warning' : 'success'}>
                  {data.pendingValidationCount > 0
                    ? `${data.pendingValidationCount} por validar`
                    : 'Todo al día'}
                </Badge>
              </div>

              <div className="divide-y divide-border/60">
                {data.pendingValidations.length ? (
                  data.pendingValidations.map((reservation) => (
                    <PendingRow key={reservation.id} reservation={reservation} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <span className="grid size-11 place-items-center rounded-2xl bg-success/18 text-success-foreground">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-5" />
                    </span>
                    <p className="mt-3 text-sm font-bold">No hay comprobantes por validar</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cuando un cliente suba su comprobante aparecerá aquí.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/panel/reservas?status=pendiente_validacion">
                    Revisar todos los comprobantes
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                  </Link>
                </Button>
              </div>
            </section>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <Card
              className="gap-0 overflow-hidden rounded-2xl border-0 bg-secondary py-0 text-secondary-foreground shadow-md"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 0% 0%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 38%), radial-gradient(circle at 100% 100%, color-mix(in oklab, var(--plum) 22%, transparent), transparent 42%)',
              }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[.04] px-5 py-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/50">
                    Planificación
                  </p>
                  <h2 className="mt-1 text-lg font-black tracking-tight text-white">Próximos 7 días</h2>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <Link href="/panel/agenda?view=week">
                    Ver semana
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 xl:grid-cols-7">
                {data.nextDays.map((day) => (
                  <NextDayCard key={day.date} day={day} />
                ))}
              </div>
            </Card>

            <Card className="relative gap-0 overflow-hidden rounded-2xl border-0 bg-plum py-5 text-white shadow-md">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/25 blur-2xl"
              />
              <div className="relative px-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/55">
                      Actividad del mes
                    </p>
                    <h2 className="mt-1 text-lg font-black tracking-tight">Ocupación y origen</h2>
                  </div>
                  <Link
                    href="/panel/reportes?tab=operativo"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                  >
                    Ver detalle
                    <HugeiconsIcon icon={ChartLineData01Icon} strokeWidth={2} className="size-3" />
                  </Link>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-center rounded-xl bg-white/[.06] p-3">
                    <Donut
                      size={96}
                      segments={[
                        { label: 'Ocupado', value: data.month.occupancyRate, color: 'var(--primary)' },
                        {
                          label: 'Libre',
                          value: Math.max(0, 100 - data.month.occupancyRate),
                          color: 'rgba(255,255,255,.16)',
                        },
                      ]}
                      center={percent(data.month.occupancyRate)}
                      centerLabel="ocupación"
                    />
                    <p className="mt-2 text-xs font-bold text-white/80">Ocupación</p>
                    <p className="text-[10px] text-white/45">
                      {hours(data.month.soldHours)} de {hours(data.month.availableHours)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center rounded-xl bg-white/[.06] p-3">
                    <Donut
                      size={96}
                      segments={[
                        { label: 'App', value: data.month.appReservations, color: 'var(--primary)' },
                        {
                          label: 'Manual',
                          value: data.month.manualReservations,
                          color: 'rgba(255,255,255,.4)',
                        },
                      ]}
                      center={String(data.month.appReservations + data.month.manualReservations)}
                      centerLabel="reservas"
                    />
                    <p className="mt-2 text-xs font-bold text-white/80">Origen</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/45">
                      <span className="flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-primary" />
                        App {data.month.appReservations}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-white/40" />
                        Manual {data.month.manualReservations}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-white/50">
                  <span>
                    Recurrentes: <strong className="font-bold text-white">{data.month.recurringClients}</strong>
                  </span>
                  <span>2+ reservas en 14 días</span>
                </div>
              </div>
            </Card>
          </section>

          {showChecklist ? (
            <section id="publicacion" className="scroll-mt-20 space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="eyebrow">Publicación</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">
                    {local.publicado ? 'Revisa la información de tu local' : 'Completa tu local para recibir reservas'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={checklist.ready ? 'info' : 'neutral'}>
                    {checklist.ready ? 'Listo para publicar' : 'Faltan requisitos'}
                  </Badge>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/panel/configuracion">
                      Configurar
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                    </Link>
                  </Button>
                </div>
              </div>
              <PublicationChecklistCard
                localId={local.id}
                localName={local.nombre}
                published={local.publicado}
                checklist={checklist}
              />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
