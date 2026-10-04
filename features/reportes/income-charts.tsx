'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { ReportBreakdownItem, ReportSeriesPoint } from './types'

const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCompact(value: number) {
  if (Math.abs(value) >= 1000) {
    const thousands = value / 1000
    return `S/ ${thousands.toFixed(Number.isInteger(thousands) ? 0 : 1)}k`
  }
  return `S/ ${value}`
}

type TooltipDatum = { label?: string; income?: number; reservations?: number }
type ChartTooltipProps = { active?: boolean; payload?: Array<{ payload?: TooltipDatum }> }

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  if (!datum) return null

  return (
    <div className="rounded-xl border border-border/80 bg-popover px-3 py-2 shadow-md">
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">
        {datum.label}
      </p>
      <p className="mt-1 text-sm font-black">{formatMoney(datum.income ?? 0)}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {datum.reservations ?? 0} reserva{(datum.reservations ?? 0) === 1 ? '' : 's'}
      </p>
    </div>
  )
}

export function IncomeBarChart({
  data,
  className,
}: {
  data: ReportSeriesPoint[]
  className?: string
}) {
  if (!data.length) return null

  return (
    <div className={cn('h-80 w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="16%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={16}
            interval="preserveStartEnd"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 700 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={58}
            tickFormatter={(value: number) => formatCompact(value)}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          />
          <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.45 }} content={<ChartTooltip />} />
          <Bar dataKey="income" radius={[8, 8, 0, 0]} maxBarSize={72} fill="var(--chart-1)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

type DonutTooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: ReportBreakdownItem }>
  total: number
  countNoun: string
}

function DonutTooltip({ active, payload, total, countNoun }: DonutTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null
  const pct = total ? (item.income / total) * 100 : 0

  return (
    <div className="rounded-xl border border-border/80 bg-popover px-3 py-2 shadow-md">
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground capitalize">
        {item.label}
      </p>
      <p className="mt-1 text-sm font-black">{formatMoney(item.income)}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {pct.toFixed(1)}% · {item.reservations} {countNoun}
      </p>
    </div>
  )
}

export function IncomeDonutChart({
  data,
  countNoun = 'reservas',
  className,
}: {
  data: ReportBreakdownItem[]
  countNoun?: string
  className?: string
}) {
  const total = data.reduce((sum, item) => sum + item.income, 0)
  if (!data.length || total <= 0) return null

  return (
    <div className={cn('flex flex-col items-center gap-5 sm:flex-row sm:gap-7', className)}>
      <div className="relative size-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<DonutTooltip total={total} countNoun={countNoun} />} wrapperStyle={{ zIndex: 20 }} />
            <Pie
              data={data}
              dataKey="income"
              nameKey="label"
              innerRadius="62%"
              outerRadius="94%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.id} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">
            Total
          </span>
          <span className="mt-1 text-lg font-black">{formatMoney(total)}</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {data.map((entry, index) => {
          const pct = total ? (entry.income / total) * 100 : 0
          return (
            <li key={entry.id} className="flex items-center gap-3">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold capitalize">
                {entry.label}
              </span>
              <span className="text-sm font-black tabular-nums">{pct.toFixed(1)}%</span>
              <span className="w-20 text-right text-xs text-muted-foreground tabular-nums">
                {formatMoney(entry.income)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function IncomeRankingChart({
  data,
  className,
}: {
  data: ReportBreakdownItem[]
  className?: string
}) {
  if (!data.length) return null
  const height = Math.max(220, data.length * 46)

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          barCategoryGap="28%"
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatCompact(value)}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={124}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 700 }}
          />
          <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.45 }} content={<ChartTooltip />} />
          <Bar dataKey="income" radius={[0, 8, 8, 0]} maxBarSize={26} fill="var(--chart-1)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
