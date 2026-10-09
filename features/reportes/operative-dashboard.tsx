'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Calendar03Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/states/empty-state'
import { cn } from '@/lib/utils'
import {
  ChannelOriginChart,
  CourtSportStackedChart,
  SportsUsageDonut,
} from './operative-charts'
import { CrossFilterDemand } from './cross-filter-demand'
import { HeatmapDemanda } from './heatmap-demanda'
import type { OperativeInsight, OperativeReport } from './types'

function formatHours(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} h`
}

function InsightCard({
  icon,
  label,
  insight,
  dark = false,
}: {
  icon: typeof Calendar03Icon
  label: string
  insight: OperativeInsight | null
  dark?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-5 rounded-2xl border p-5 shadow-sm',
        dark ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border/80 bg-card',
      )}
    >
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
      <div>
        <p className="text-2xl font-black leading-none tracking-[-.03em] capitalize">
          {insight ? insight.label : '—'}
        </p>
        <p className={cn('mt-2 text-[11px]', dark ? 'text-secondary-foreground/60' : 'text-muted-foreground')}>
          {insight ? insight.detail : 'Sin datos en el periodo'}
        </p>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: typeof Calendar03Icon
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="flex flex-col justify-between gap-5 rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">
        <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-foreground">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
        </span>
        {label}
      </div>
      <div>
        <p className="text-3xl font-black leading-none tracking-[-.03em] tabular-nums">{value}</p>
        <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-border/80 text-center">
      <p className="max-w-xs px-6 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function OperativeDashboard({ data }: { data: OperativeReport }) {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          icon={ArrowUp01Icon}
          label="Día más reservado"
          insight={data.insights.busiestDay}
          dark
        />
        <InsightCard
          icon={ArrowDown01Icon}
          label="Día menos reservado"
          insight={data.insights.quietestDay}
        />
        <InsightCard icon={Clock01Icon} label="Hora pico" insight={data.insights.peakHour} />
        <InsightCard icon={Clock01Icon} label="Hora muerta" insight={data.insights.deadHour} />
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={Clock01Icon}
          label="Extensiones"
          value={String(data.totals.extensiones)}
          hint="+30 min autorizadas en el rango"
        />
        <StatCard
          icon={Clock01Icon}
          label="Horas extra"
          value={formatHours(data.totals.extraHours)}
          hint="30 min por extensión"
        />
      </section>

      <div className="mt-5">
        <CrossFilterDemand heatmap={data.heatmap} />
      </div>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="gap-5 py-6">
          <div className="px-6">
            <h2 className="text-base font-black tracking-[-.02em]">Deporte más jugado</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Participación por cantidad de reservas.
            </p>
          </div>
          <div className="px-6">
            {data.bySport.length ? (
              <SportsUsageDonut data={data.bySport} />
            ) : (
              <ChartEmpty message="Sin reservas por deporte en este periodo." />
            )}
          </div>
        </Card>

        <Card className="gap-5 py-6">
          <div className="px-6">
            <h2 className="text-base font-black tracking-[-.02em]">Canal de Origen</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Distribución de reservas automáticas vs. manuales.
            </p>
          </div>
          <div className="px-6">
            {data.byChannel.length ? (
              <ChannelOriginChart data={data.byChannel} />
            ) : (
              <ChartEmpty message="Sin reservas en este periodo." />
            )}
          </div>
        </Card>
      </section>

      <section className="mt-5">
        <Card className="gap-5 py-6">
          <div className="px-6">
            <h2 className="text-base font-black tracking-[-.02em]">Cancha por deporte</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Horas jugadas en cada cancha, apiladas por deporte.
            </p>
          </div>
          <div className="px-3 sm:px-4">
            {data.byCourtSport.length && data.sports.length ? (
              <CourtSportStackedChart rows={data.byCourtSport} sports={data.sports} />
            ) : (
              <ChartEmpty message="Sin horas jugadas por cancha en este periodo." />
            )}
          </div>
        </Card>
      </section>

      <section className="mt-5">
        <Card className="gap-5 py-6">
          <div className="px-6">
            <h2 className="text-base font-black tracking-[-.02em]">Mapa de calor semanal</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Reservas por día y hora acumuladas en el rango. Los tonos más intensos concentran más reservas.
            </p>
          </div>
          <div className="px-4 sm:px-6">
            {data.heatmap.hours.length ? (
              <HeatmapDemanda data={data.heatmap} />
            ) : (
              <ChartEmpty message="Sin reservas en este periodo." />
            )}
          </div>
        </Card>
      </section>

      <p className="mt-5 text-xs text-muted-foreground">
        {data.totals.reservations} reservas · {formatHours(data.totals.hours)} ocupadas
      </p>

      {data.totals.reservations === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="Aún no hay reservas en este periodo"
            description="Cuando se registren reservas en el rango seleccionado, verás aquí la demanda por día y hora, el deporte más jugado y el uso por cancha."
          />
        </div>
      ) : null}
    </>
  )
}
