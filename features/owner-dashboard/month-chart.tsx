'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardMonthPoint } from './types'

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

type TooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: DashboardMonthPoint }>
}

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  if (!datum) return null

  return (
    <div className="rounded-xl border border-border/80 bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">Día {datum.label}</p>
      <div className="mt-1 space-y-1">
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" />
            Cobrado
          </span>
          <span className="font-black">{formatMoney(datum.income)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="size-2 rounded-full bg-plum" />
            Por cobrar
          </span>
          <span className="font-black text-plum">{formatMoney(datum.outstanding)}</span>
        </div>
      </div>
    </div>
  )
}

export function OwnerMonthChart({
  data,
  variant = 'light',
}: {
  data: DashboardMonthPoint[]
  variant?: 'light' | 'dark'
}) {
  if (!data.length) return null

  const dark = variant === 'dark'
  const axis = dark ? 'rgba(255,255,255,.55)' : 'var(--muted-foreground)'
  const grid = dark ? 'rgba(255,255,255,.12)' : 'var(--border)'
  const cursor = dark
    ? 'rgba(255,255,255,.06)'
    : 'color-mix(in oklab, var(--foreground) 6%, transparent)'

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="24%" margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={grid} strokeDasharray="3 4" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={12}
            interval="preserveStartEnd"
            tick={{ fill: axis, fontSize: 10, fontWeight: 700 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => formatCompact(value)}
            tick={{ fill: axis, fontSize: 10 }}
          />
          <Tooltip cursor={{ fill: cursor }} content={<ChartTooltip />} />
          <Bar dataKey="income" stackId="money" radius={[0, 0, 0, 0]} maxBarSize={26} fill="var(--primary)" />
          <Bar dataKey="outstanding" stackId="money" radius={[5, 5, 0, 0]} maxBarSize={26} fill="var(--plum)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
