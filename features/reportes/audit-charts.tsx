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
import type { AuditBreakdownItem, AuditSeriesPoint } from './types'

const CANCEL_COLOR = 'var(--destructive)'
const REJECT_COLOR = 'var(--warning)'
const EXTENSION_COLOR = 'var(--chart-1)'
const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

type IncidentsTooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: AuditSeriesPoint }>
}

function IncidentsTooltip({ active, payload }: IncidentsTooltipProps) {
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  if (!datum) return null

  return (
    <div className="rounded-xl border border-border/80 bg-popover px-3 py-2 shadow-md">
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">
        {datum.label}
      </p>
      <ul className="mt-1.5 space-y-0.5 text-[11px]">
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: CANCEL_COLOR }} />
          Cancelaciones
          <span className="ml-auto font-bold text-foreground">{datum.cancelaciones}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: REJECT_COLOR }} />
          Rechazos
          <span className="ml-auto font-bold text-foreground">{datum.rechazos}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: EXTENSION_COLOR }} />
          Extensiones
          <span className="ml-auto font-bold text-foreground">{datum.extensiones}</span>
        </li>
      </ul>
    </div>
  )
}

export function IncidentsOverTimeChart({
  data,
  className,
}: {
  data: AuditSeriesPoint[]
  className?: string
}) {
  if (!data.length) return null

  return (
    <div className={cn('h-80 w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="22%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={12}
            interval="preserveStartEnd"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 700 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            allowDecimals={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          />
          <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.45 }} content={<IncidentsTooltip />} />
          <Bar dataKey="cancelaciones" name="Cancelaciones" stackId="i" fill={CANCEL_COLOR} />
          <Bar dataKey="rechazos" name="Rechazos de pago" stackId="i" fill={REJECT_COLOR} />
          <Bar dataKey="extensiones" name="Extensiones" stackId="i" fill={EXTENSION_COLOR} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

type BreakdownTooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: AuditBreakdownItem }>
  total?: number
}

function BreakdownTooltip({ active, payload, total }: BreakdownTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null
  const pct = total ? (item.count / total) * 100 : 0

  return (
    <div className="rounded-xl border border-border/80 bg-popover px-3 py-2 shadow-md">
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">
        {item.label}
      </p>
      <p className="mt-1 text-sm font-black">{item.count}</p>
      {total ? <p className="mt-0.5 text-[11px] text-muted-foreground">{pct.toFixed(1)}%</p> : null}
    </div>
  )
}

export function AuditDonutChart({
  data,
  className,
}: {
  data: AuditBreakdownItem[]
  className?: string
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0)
  if (!total) return null

  return (
    <div className={cn('flex flex-col items-center gap-5 sm:flex-row sm:gap-7', className)}>
      <div className="relative size-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<BreakdownTooltip total={total} />} wrapperStyle={{ zIndex: 20 }} />
            <Pie
              data={data}
              dataKey="count"
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
          <span className="text-lg font-black">{total}</span>
          <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">
            Total
          </span>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {data.map((entry, index) => {
          const pct = total ? (entry.count / total) * 100 : 0
          return (
            <li key={entry.id} className="flex items-center gap-3">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{entry.label}</span>
              <span className="text-sm font-black tabular-nums">{entry.count}</span>
              <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                {pct.toFixed(1)}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function AuditBarChart({
  data,
  color = REJECT_COLOR,
  className,
}: {
  data: AuditBreakdownItem[]
  color?: string
  className?: string
}) {
  if (!data.length) return null
  const height = Math.max(180, data.length * 48)

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
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => String(value)}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={150}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 700 }}
          />
          <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.45 }} content={<BreakdownTooltip />} />
          <Bar dataKey="count" name="Incidencias" radius={[0, 8, 8, 0]} maxBarSize={26} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
