'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import type { ReportSeriesPoint } from './types'

const AXIS = 'var(--rp-muted)'
const GRID = 'var(--rp-line)'
const LIME = 'var(--rp-cal)'

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

type ChartTooltipProps = { active?: boolean; payload?: Array<{ payload?: ReportSeriesPoint }> }

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  if (!datum) return null

  return (
    <div className="rounded-xl border border-border/80 bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{datum.label}</p>
      <p className="mt-1 text-sm font-black">{formatMoney(datum.income)}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {datum.movements} cobro{datum.movements === 1 ? '' : 's'}
      </p>
    </div>
  )
}

export function IncomeBarChart({
  data,
  className,
  maxBarSize = 56,
}: {
  data: ReportSeriesPoint[]
  className?: string
  maxBarSize?: number
}) {
  if (!data.length) return null

  return (
    <div className={cn('h-80 w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="18%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={16}
            interval="preserveStartEnd"
            tick={{ fill: AXIS, fontSize: 11, fontWeight: 700 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => formatCompact(value)}
            tick={{ fill: AXIS, fontSize: 11 }}
          />
          <Tooltip cursor={{ fill: 'color-mix(in oklab, var(--rp-ink) 8%, transparent)' }} content={<ChartTooltip />} />
          <Bar dataKey="income" radius={[6, 6, 0, 0]} maxBarSize={maxBarSize} fill={LIME} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
