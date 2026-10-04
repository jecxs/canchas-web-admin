'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Invoice03Icon,
} from '@hugeicons/core-free-icons'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/states/empty-state'
import { cn } from '@/lib/utils'
import { AuditBarChart, AuditDonutChart, IncidentsOverTimeChart } from './audit-charts'
import { AuditIncidentsTable } from './audit-incidents-table'
import type { AuditReport, ReportKpi } from './types'

function TrendBadge({ kpi, dark = false }: { kpi: ReportKpi; dark?: boolean }) {
  if (kpi.changePct === null) {
    return (
      <span className={cn('text-[11px] font-semibold', dark ? 'text-secondary-foreground/55' : 'text-muted-foreground')}>
        Sin periodo previo
      </span>
    )
  }

  const up = kpi.changePct >= 0
  const positive = up === kpi.goodWhenUp
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
        positive
          ? dark
            ? 'bg-primary text-primary-foreground'
            : 'bg-primary/22 text-success-foreground'
          : dark
            ? 'bg-destructive/35 text-white'
            : 'bg-destructive/12 text-destructive',
      )}
    >
      <HugeiconsIcon icon={up ? ArrowUp01Icon : ArrowDown01Icon} strokeWidth={2.6} className="size-3" />
      {Math.abs(kpi.changePct).toFixed(1)}%
      <span className="font-medium opacity-70">vs ant.</span>
    </span>
  )
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  kpi,
  dark = false,
}: {
  icon: typeof Cancel01Icon
  label: string
  value: string
  hint: string
  kpi: ReportKpi
  dark?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-5 rounded-2xl border p-5 shadow-sm',
        dark ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border/80 bg-card',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={cn(
            'flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.12em]',
            dark ? 'text-secondary-foreground/65' : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'grid size-7 place-items-center rounded-lg',
              dark ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground',
            )}
          >
            <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
          </span>
          {label}
        </div>
        <TrendBadge kpi={kpi} dark={dark} />
      </div>
      <div>
        <p className="text-3xl font-black leading-none tracking-[-.03em]">{value}</p>
        <p className={cn('mt-2 text-[11px]', dark ? 'text-secondary-foreground/60' : 'text-muted-foreground')}>
          {hint}
        </p>
      </div>
    </div>
  )
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="grid h-56 place-items-center rounded-2xl border border-dashed border-border/80 text-center">
      <p className="max-w-xs px-6 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function AuditDashboard({ data }: { data: AuditReport }) {
  const totalKpi: ReportKpi = {
    value: data.kpis.cancelaciones.value + data.kpis.rechazos.value,
    previous: data.kpis.cancelaciones.previous + data.kpis.rechazos.previous,
    changePct: null,
    goodWhenUp: false,
  }
  totalKpi.changePct =
    totalKpi.previous === 0 ? null : ((totalKpi.value - totalKpi.previous) / totalKpi.previous) * 100

  const hasData = data.totals.cancelaciones + data.totals.rechazos > 0

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={Cancel01Icon}
          label="Cancelaciones"
          value={String(data.kpis.cancelaciones.value)}
          hint="Reservas canceladas en el rango"
          kpi={data.kpis.cancelaciones}
          dark
        />
        <KpiCard
          icon={Invoice03Icon}
          label="Rechazos de pago"
          value={String(data.kpis.rechazos.value)}
          hint="Comprobantes rechazados"
          kpi={data.kpis.rechazos}
        />
        <KpiCard
          icon={Alert02Icon}
          label="Total de incidencias"
          value={String(totalKpi.value)}
          hint="Cancelaciones + rechazos"
          kpi={totalKpi}
        />
      </section>

      <section className="mt-5">
        <Card className="gap-5 py-6">
          <div className="px-6">
            <h2 className="text-base font-black tracking-[-.02em]">Incidencias en el tiempo</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Eventos por día según su fecha de cancelación o rechazo.
            </p>
          </div>
          <div className="px-2 sm:px-4">
            {hasData ? (
              <IncidentsOverTimeChart data={data.series} />
            ) : (
              <ChartEmpty message="Sin incidencias en este periodo." />
            )}
          </div>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="gap-5 py-6">
          <div className="px-6">
            <h2 className="text-base font-black tracking-[-.02em]">Cancelaciones por tipo</h2>
            <p className="mt-1 text-xs text-muted-foreground">Quién canceló: cliente o dueño.</p>
          </div>
          <div className="px-6">
            {data.cancellationsByType.length ? (
              <AuditDonutChart data={data.cancellationsByType} />
            ) : (
              <ChartEmpty message="Sin cancelaciones en este periodo." />
            )}
          </div>
        </Card>

        <Card className="gap-5 py-6">
          <div className="px-6">
            <h2 className="text-base font-black tracking-[-.02em]">Rechazos por motivo</h2>
            <p className="mt-1 text-xs text-muted-foreground">Motivos estructurados de rechazo.</p>
          </div>
          <div className="px-3 sm:px-4">
            {data.rejectionsByReason.length ? (
              <AuditBarChart data={data.rejectionsByReason} />
            ) : (
              <ChartEmpty message="Sin rechazos en este periodo." />
            )}
          </div>
        </Card>
      </section>

      <section className="mt-5">
        <Card className="gap-5 py-6">
          <div className="px-6">
            <h2 className="text-base font-black tracking-[-.02em]">Detalle de incidencias</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Cancelaciones y rechazos del rango, ordenados por fecha del evento.
            </p>
          </div>
          <div className="px-6">
            <AuditIncidentsTable incidents={data.incidents} />
          </div>
        </Card>
      </section>

      <p className="mt-5 text-xs text-muted-foreground">
        {data.totals.cancelaciones} cancelaciones · {data.totals.rechazos} rechazos de pago
      </p>

      {!hasData ? (
        <div className="mt-5">
          <EmptyState
            title="Aún no hay incidencias en este periodo"
            description="Cuando se cancelen reservas o se rechacen comprobantes en el rango, aparecerán aquí."
          />
        </div>
      ) : null}
    </>
  )
}
