import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowRight01Icon,
  CalendarAdd01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PublicationChecklistCard } from '@/features/local-publication/publication-checklist-card'
import { cn } from '@/lib/utils'
import type { LocalSummary, SubscriptionSummary } from '@/lib/auth/access'
import type { PublicationChecklist } from '@/features/local-publication/types'
import { AutoMarquee } from '@/components/dashboard/auto-marquee'
import { ClientAvatar } from '@/components/dashboard/client-avatar'
import { ClientsSpotlight } from './clients-spotlight'
import { CourtRotationPause } from './court-rotation-pause'
import { CourtsCarousel } from './courts-carousel'
import { CourtsSyncProvider } from './courts-sync'
import { NextTurnCard } from './next-turn-card'
import { OwnerMonthChart } from './month-chart'
import type { DashboardReservation, OwnerDashboardData } from './types'

const LIMA = 'America/Lima'

type NoticeTone = 'info' | 'warning' | 'destructive'

type OwnerDashboardProps = {
  data: OwnerDashboardData
  ownerName: string
  local: LocalSummary
  subscription: SubscriptionSummary | null
  checklist: PublicationChecklist
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
  checklist,
}: {
  local: LocalSummary
  subscription: SubscriptionSummary | null
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
      href: checklist.ready ? '#publicacion' : '/panel/configuracion',
      cta: checklist.ready ? 'Publicar local' : 'Completar ficha',
    }
  }

  return null
}

function PendingRow({ reservation }: { reservation: DashboardReservation }) {
  return (
    <Link
      href={`/panel/agenda?date=${dateKey(reservation.start)}&reservation=${reservation.id}`}
      className="flex items-start gap-3 rounded-xl border border-border/70 bg-card px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:shadow-sm active:translate-y-0"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warning/20 text-warning-foreground">
        <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <ClientAvatar
            src={reservation.customerAvatarUrl}
            name={reservation.customerName}
            size="sm"
            className="size-6"
            fallbackClassName="bg-primary/15 text-primary-foreground"
          />
          <p className="truncate text-sm font-bold">{reservation.customerName}</p>
        </div>
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
    <div className="relative shrink-0 animate-in zoom-in-95 duration-700" style={{ width: size, height: size }}>
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from -90deg, ${gradient})`,
          WebkitMaskImage:
            'radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 14px))',
          maskImage:
            'radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 14px))',
        }}
      />
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-xl font-black leading-none text-white tabular-nums">{center}</p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[.12em] text-white/45">{centerLabel}</p>
        </div>
      </div>
    </div>
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
  const notice = buildNotice({ local, subscription, checklist })
  const activeCourts = data.courts.filter((court) => court.active)

  return (
    <div className="w-full" data-owner-dashboard>
      <section className="relative z-0 -mx-4 pb-4 overflow-hidden rounded-b-[2rem] bg-secondary text-secondary-foreground shadow-floating md:-mx-6 lg:-mx-8 min-[1200px]:sticky min-[1200px]:top-0">
        <div
          aria-hidden="true"
          className="owner-blob pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="owner-blob-slow pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-plum/35 blur-3xl"
        />

        <CourtsSyncProvider courts={activeCourts}>
          <div className="relative grid gap-4 px-6 pt-5 pb-10 sm:px-8 sm:pt-6 lg:px-8 min-[1200px]:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] 2xl:gap-5 2xl:px-12">
          <div className="order-1 flex flex-col gap-3 duration-500 fill-mode-both animate-in fade-in slide-in-from-bottom-2">
            <div>
              <p className="text-base font-bold text-white/65 sm:text-xl">
                {greeting()}, {firstName}
              </p>
              <h1 className="mt-1 font-display text-4xl font-black leading-[.92] tracking-tight text-white sm:text-5xl 2xl:text-6xl">
                <AutoMarquee>Bienvenido a {local.nombre}</AutoMarquee>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-secondary-foreground/70">
                {local.direccion}
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <div id="publicacion" className="w-full min-w-0 scroll-mt-24 sm:w-3/5">
                <PublicationChecklistCard
                  localId={local.id}
                  localName={local.nombre}
                  published={local.publicado}
                  checklist={checklist}
                />
              </div>

              <CourtRotationPause className="group relative w-full min-w-0 sm:flex-1">
                <Card className="relative flex h-full w-full min-w-0 flex-row rounded-xl border border-white/10 bg-white/[.06] p-3 text-white transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-plum/40 group-hover:bg-plum/10 group-hover:shadow-md">
                  <Link
                    href="/panel/canchas"
                    aria-label="Ir al módulo de canchas"
                    className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60"
                  />
                  <CourtsCarousel>
                    <Button
                      asChild
                      size="sm"
                      className="relative z-10 w-full overflow-hidden whitespace-nowrap"
                    >
                      <Link href="/panel/agenda">
                        <HugeiconsIcon icon={CalendarAdd01Icon} strokeWidth={2} />
                        <AutoMarquee
                          className="min-w-0 flex-1"
                          gapClassName="pr-6"
                          gapPx={24}
                          centerWhenFits
                        >
                          Nueva reserva
                        </AutoMarquee>
                      </Link>
                    </Button>
                  </CourtsCarousel>
                </Card>
              </CourtRotationPause>
            </div>
          </div>

          <div className="order-2 flex h-full flex-col gap-2 delay-100 duration-500 fill-mode-both animate-in fade-in slide-in-from-bottom-2">
            <NextTurnCard
              nextByCourt={data.nextByCourt}
              fallbackNext={data.todaySummary.nextReservation}
            />

            <div className="mt-auto grid grid-cols-2 gap-2">
              <Link
                href={`/panel/agenda?date=${data.today}`}
                className="group rounded-2xl border border-white/10 bg-white/[.06] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-plum/40 hover:bg-plum/10 hover:shadow-md 2xl:p-5"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-primary transition-colors group-hover:text-plum">Reservas hoy</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-white/45 2xl:text-[9px]">Total</p>
                    <p className="mt-0.5 font-display text-xl font-black leading-none tabular-nums 2xl:text-2xl">
                      {data.todaySummary.reservations}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-white/45 2xl:text-[9px]">Faltante</p>
                    <p className="mt-0.5 font-display text-xl font-black leading-none tabular-nums 2xl:text-2xl">
                      {data.todaySummary.remainingReservations}
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                href={`/panel/agenda?date=${data.today}`}
                className="group rounded-2xl border border-white/10 bg-white/[.06] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-plum/40 hover:bg-plum/10 hover:shadow-md 2xl:p-5"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-primary transition-colors group-hover:text-plum">Ocupación hoy</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-white/45 2xl:text-[9px]">Total</p>
                    <p className="mt-0.5 font-display text-xl font-black leading-none tabular-nums 2xl:text-2xl">
                      {percent(data.todaySummary.occupancyRate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-white/45 2xl:text-[9px]">Faltante</p>
                    <p className="mt-0.5 font-display text-xl font-black leading-none tabular-nums 2xl:text-2xl">
                      {percent(
                        data.todaySummary.availableHours > 0
                          ? (data.todaySummary.remainingHours / data.todaySummary.availableHours) * 100
                          : 0,
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            </div>

          </div>

          <div className="order-3">
            <Link href="/panel/reportes?tab=operativo" className="group block h-full rounded-2xl">
              <Card className="h-full gap-0 rounded-2xl border border-white/10 bg-white/[.06] p-0 text-white backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-plum/40 group-hover:bg-plum/10 group-hover:shadow-md">
                <div className="flex h-full flex-col p-3.5 2xl:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-primary transition-colors duration-300 group-hover:text-plum">
                      Actividad del mes
                    </p>
                    <span className="shrink-0 text-[10px] font-bold text-plum opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      Ver detalle
                    </span>
                  </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col items-center rounded-xl bg-white/[.04] p-3 2xl:p-4">
                    <p className="mt-2 mb-2 text-[11px] font-bold text-white/80">Ocupación del mes</p>
                    <Donut
                      size={88}
                      segments={[
                        { label: 'Ocupado', value: data.month.occupancyRate, color: 'var(--primary)' },
                        {
                          label: 'Libre',
                          value: Math.max(0, 100 - data.month.occupancyRate),
                          color: 'rgba(255,255,255,.16)',
                        },
                      ]}
                      center={percent(data.month.occupancyRate)}
                      centerLabel=""
                    />

                    <p className="text-[9px] text-white/70">
                      {hours(data.month.soldHours)} de {hours(data.month.availableHours)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center rounded-xl bg-white/[.04] p-3 2xl:p-4">
                    <p className="mt-2 mb-2 text-[11px] font-bold text-white/80">Reservas del mes</p>
                    <Donut
                      size={88}
                      segments={[
                        { label: 'App', value: data.month.appReservations, color: 'var(--primary)' },
                        {
                          label: 'Manual',
                          value: data.month.manualReservations,
                          color: 'rgba(255,255,255,.4)',
                        },
                      ]}
                      center={String(data.month.appReservations + data.month.manualReservations)}
                      centerLabel=""
                    />

                    <div className="mt-0.5 flex items-center gap-2 text-[9px] text-white/70">
                      <span className="flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-primary" />
                        App {data.month.appReservations}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-white/70" />
                        Manual {data.month.manualReservations}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            </Link>
          </div>
        </div>
        </CourtsSyncProvider>
      </section>

      <div className="relative z-10 -mx-4 -mt-10 rounded-t-[2rem] bg-white px-4 pb-7 pt-4 shadow-[0_-24px_50px_-32px_rgba(0,0,0,0.35)] duration-500 fill-mode-both animate-in fade-in md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="space-y-8">
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

          <section className="grid gap-5 min-[1200px]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Card
              className="gap-0 overflow-hidden rounded-2xl border border-foreground/15 bg-lime-50/30 py-0 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary hover:shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6 pb-2">
                <h1 className="text-xl font-extrabold uppercase text-plum">
                  Ingresos de este mes
                </h1>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-plum/40 bg-plum text-white hover:bg-plum/90 hover:text-white"
                >
                  <Link href="/panel/reportes">
                    Ver reportes
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                  </Link>
                </Button>
              </div>

              <div className="grid gap-6 px-6 pb-6 pt-4 sm:grid-cols-2">
                <div className="text-center">
                  <div className="flex items-stretch justify-center">
                    <div className="min-w-0 flex-1 px-2 2xl:px-3">
                      <p className="text-[11px] font-semibold text-muted-foreground">Cobrado en el mes</p>
                      <p className="mt-1 whitespace-nowrap font-display text-2xl font-black leading-none tabular-nums sm:text-3xl 2xl:text-4xl">
                        {money(data.month.collected)}
                      </p>
                    </div>
                    <span aria-hidden="true" className="w-px self-stretch bg-border/70" />
                    <div className="min-w-0 flex-1 px-2 2xl:px-3">
                      <p className="text-[11px] font-semibold text-muted-foreground">Cobrado hoy</p>
                      <p className="mt-1 whitespace-nowrap font-display text-2xl font-black leading-none tabular-nums sm:text-3xl 2xl:text-4xl">
                        {money(data.todaySummary.collected)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    adelantos, saldos y extensiones registrados en caja
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-stretch justify-center">
                    <div className="min-w-0 flex-1 px-2 2xl:px-3">
                      <p className="text-[11px] font-semibold text-muted-foreground">Por cobrar del mes</p>
                      <p className="mt-1 whitespace-nowrap font-display text-2xl font-black leading-none text-plum tabular-nums sm:text-3xl 2xl:text-4xl">
                        {money(data.month.outstanding)}
                      </p>
                    </div>
                    <span aria-hidden="true" className="w-px self-stretch bg-border/70" />
                    <div className="min-w-0 flex-1 px-2 2xl:px-3">
                      <p className="text-[11px] font-semibold text-muted-foreground">Por cobrar hoy</p>
                      <p className="mt-1 whitespace-nowrap font-display text-2xl font-black leading-none text-plum tabular-nums sm:text-3xl 2xl:text-4xl">
                        {money(data.todaySummary.outstanding)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    saldo pendiente de reservas confirmadas y completadas
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-end gap-3 pb-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full bg-primary" />
                      Cobrado
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full bg-plum" />
                      Por cobrar
                    </span>
                  </div>
                  <OwnerMonthChart data={data.month.daily} />
                </div>
              </div>

            </Card>

            <div className="flex flex-col gap-4">
              <Card className="flex h-[19rem] flex-col gap-0 overflow-hidden rounded-2xl border border-foreground/15 bg-lime-50/30 py-0 shadow-sm backdrop-blur-sm">
                <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-4 pb-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="owner-shake grid size-6 shrink-0 place-items-center text-orange-500"
                    >
                      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5" />
                    </span>
                    <h1 className="text-xl font-extrabold uppercase text-plum">Requiere tu atención</h1>
                  </div>
                  <Badge variant={data.pendingValidationCount > 0 ? 'warning' : 'success'}>
                    {data.pendingValidationCount > 0
                      ? `${data.pendingValidationCount} por validar`
                      : 'Todo al día'}
                  </Badge>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                  {data.pendingValidations.length ? (
                    data.pendingValidations.map((reservation) => (
                      <PendingRow key={reservation.id} reservation={reservation} />
                    ))
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
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

                <div className="shrink-0 px-4 pb-4 pt-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full border-plum/40 bg-plum text-white hover:bg-plum/90 hover:text-white"
                  >
                    <Link href="/panel/reservas?status=pendiente_validacion">
                      Revisar todos los comprobantes
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                    </Link>
                  </Button>
                </div>
              </Card>

              <ClientsSpotlight
                todayClients={data.todayClients}
                frequentClients={data.frequentClients}
              />
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
