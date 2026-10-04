'use client'

import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Calendar03Icon,
  ChartLineData01Icon,
  Invoice03Icon,
  Money03Icon,
} from '@hugeicons/core-free-icons'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/states/empty-state'
import { cn } from '@/lib/utils'
import { groupDaily } from './date-utils'
import { IncomeBarChart, IncomeDonutChart, IncomeRankingChart } from './income-charts'
import type { IncomeReport, ReportGranularity, ReportKpi } from './types'

const GROUPINGS: Array<{ value: ReportGranularity; label: string }> = [
  { value: 'dia', label: 'Diario' },
  { value: 'semana', label: 'Semanal' },
  { value: 'mes', label: 'Mensual' },
]

function formatMoney(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value)
}

function formatCount(value: number) {
  return new Intl.NumberFormat('es-PE').format(value)
}

function TrendBadge({ kpi, dark = false }: { kpi: ReportKpi; dark?: boolean }) {
  if (kpi.changePct === null) {
    return (
      <span
        className={cn(
          'text-[11px] font-semibold',
          dark ? 'text-secondary-foreground/55' : 'text-muted-foreground',
        )}
      >
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
      <HugeiconsIcon
        icon={up ? ArrowUp01Icon : ArrowDown01Icon}
        strokeWidth={2.6}
        className="size-3"
      />
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
  icon: typeof Money03Icon
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
    <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-border/80 text-center">
      <p className="max-w-xs px-6 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function ReportesDashboard({ data }: { data: IncomeReport }) {
  const [granularity, setGranularity] = useState<ReportGranularity>('dia')
  const series = groupDaily(data.daily, granularity)
  const sportPositive = data.bySport.filter((item) => item.income > 0)
  const methodPositive = data.byMethod.filter((item) => item.income > 0)
  const hasCash = data.totals.income !== 0 || data.daily.some((point) => point.income !== 0)
  const topMethodByIncome = methodPositive[0] ?? null
  const topMethodByCount = [...methodPositive].sort((a, b) => b.reservations - a.reservations)[0] ?? null

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Money03Icon}
          label="Ingresos cobrados"
          value={formatMoney(data.kpis.income.value)}
          hint="Cobros registrados en el rango"
          kpi={data.kpis.income}
          dark
        />
        <KpiCard
          icon={Invoice03Icon}
          label="Saldos por cobrar"
          value={formatMoney(data.kpis.outstanding.value)}
          hint="Confirmadas y completadas: total − cobrado"
          kpi={data.kpis.outstanding}
        />
        <KpiCard
          icon={Calendar03Icon}
          label="Reservas"
          value={formatCount(data.kpis.reservations.value)}
          hint="Confirmadas y completadas del periodo"
          kpi={data.kpis.reservations}
        />
        <KpiCard
          icon={ChartLineData01Icon}
          label="Ticket promedio"
          value={formatMoney(data.kpis.averageTicket.value, 2)}
          hint="Cobrado medio por reserva"
          kpi={data.kpis.averageTicket}
        />
      </section>

      <section className="mt-5">
        <Card className="gap-5 py-6">
          <div className="flex flex-col gap-4 px-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-black tracking-[-.02em]">Cobrado en el tiempo</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Movimientos registrados por fecha de pago.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-muted/40 p-1">
              {GROUPINGS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGranularity(option.value)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                    granularity === option.value
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="px-2 sm:px-4">
            {series.some((point) => point.income !== 0) ? (
              <IncomeBarChart data={series} />
            ) : (
              <ChartEmpty message="No hay cobros registrados en este periodo." />
            )}
          </div>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="gap-5 py-6">
          <div className="px-6">
            <h2 className="text-base font-black tracking-[-.02em]">Cobrado por deporte</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Participación de cada deporte sobre lo cobrado.
            </p>
          </div>
          <div className="px-6">
            {sportPositive.length ? (
              <IncomeDonutChart data={sportPositive} />
            ) : (
              <ChartEmpty message="Sin cobros por deporte en este periodo." />
            )}
          </div>
        </Card>

        <Card className="gap-5 py-6">
          <div className="px-6">
            <h2 className="text-base font-black tracking-[-.02em]">Cobros por método</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Medio más usado y mayor ingreso del rango.
            </p>
          </div>
          <div className="px-6">
            {methodPositive.length ? (
              <>
                <IncomeDonutChart data={methodPositive} countNoun="cobros" />
                {topMethodByCount && topMethodByIncome ? (
                  <p className="mt-4 rounded-xl bg-muted/45 px-3 py-2.5 text-xs leading-5">
                    Más usado: <strong>{topMethodByCount.label}</strong> ({formatCount(topMethodByCount.reservations)} cobros)
                    {' · '}Mayor ingreso: <strong>{topMethodByIncome.label}</strong> ({formatMoney(topMethodByIncome.income)})
                  </p>
                ) : null}
              </>
            ) : (
              <ChartEmpty message="Sin cobros registrados por método en este periodo." />
            )}
          </div>
        </Card>
      </section>

      <section className="mt-5">
        <Card className="gap-5 py-6">
          <div className="px-6">
            <h2 className="text-base font-black tracking-[-.02em]">Cobrado por cancha</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Qué espacio físico generó más cobros en el rango.
            </p>
          </div>
          <div className="px-3 sm:px-4">
            {data.byCourt.length ? (
              <IncomeRankingChart data={data.byCourt} />
            ) : (
              <ChartEmpty message="Sin cobros por cancha en este periodo." />
            )}
          </div>
        </Card>
      </section>

      {data.totals.reservations === 0 && !hasCash ? (
        <div className="mt-5">
          <EmptyState
            title="Aún no hay movimientos en este periodo"
            description="Cuando se registren cobros en el rango seleccionado, verás aquí los indicadores, la evolución y el desglose operativo."
          />
        </div>
      ) : null}
    </>
  )
}
