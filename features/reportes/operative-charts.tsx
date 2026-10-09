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
import type {
  ChannelOriginItem,
  OperativeCourtSportRow,
  OperativeSportItem,
  OperativeSportSeries,
} from './types'

const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function formatHours(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} h`
}

type SportTooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: OperativeSportItem }>
  total: number
}

function SportTooltip({ active, payload, total }: SportTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null
  const pct = total ? (item.reservations / total) * 100 : 0

  return (
    <div className="rounded-xl border border-border/80 bg-popover px-3 py-2 shadow-md">
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground capitalize">
        {item.label}
      </p>
      <p className="mt-1 text-sm font-black">{pct.toFixed(1)}%</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {item.reservations} reservas · {formatHours(item.hours)}
      </p>
    </div>
  )
}

export function SportsUsageDonut({
  data,
  className,
}: {
  data: OperativeSportItem[]
  className?: string
}) {
  const total = data.reduce((sum, item) => sum + item.reservations, 0)
  if (!data.length || total <= 0) return null

  return (
    <div className={cn('flex flex-col items-center gap-5 sm:flex-row sm:gap-7', className)}>
      <div className="relative size-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<SportTooltip total={total} />} wrapperStyle={{ zIndex: 20 }} />
            <Pie
              data={data}
              dataKey="reservations"
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
            Reservas
          </span>
          <span className="mt-1 text-lg font-black">{total}</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {data.map((entry, index) => {
          const pct = total ? (entry.reservations / total) * 100 : 0
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
                {entry.reservations} · {formatHours(entry.hours)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type StackedTooltipProps = {
  active?: boolean
  payload?: Array<{ dataKey?: string | number; value?: number; name?: string; payload?: { label?: string } }>
}

function StackedTooltip({ active, payload }: StackedTooltipProps) {
  if (!active || !payload?.length) return null
  const label = payload[0]?.payload?.label
  const items = payload.filter((entry) => (entry.value ?? 0) > 0)
  const total = items.reduce((sum, entry) => sum + (entry.value ?? 0), 0)

  return (
    <div className="rounded-xl border border-border/80 bg-popover px-3 py-2 shadow-md">
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{formatHours(total)}</p>
      <ul className="mt-1.5 space-y-0.5">
        {items.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="capitalize">{entry.name}</span>
            <span className="ml-auto font-bold text-foreground">{formatHours(entry.value ?? 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CourtSportStackedChart({
  rows,
  sports,
  className,
}: {
  rows: OperativeCourtSportRow[]
  sports: OperativeSportSeries[]
  className?: string
}) {
  if (!rows.length || !sports.length) return null
  const data = rows.map((row) => ({ label: row.label, ...row.values }))
  const height = Math.max(240, rows.length * 52)

  return (
    <div className={cn('w-full', className)}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            barCategoryGap="26%"
            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => formatHours(value)}
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
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.45 }}
              content={<StackedTooltip />}
              formatter={(value) => formatHours(Number(value))}
            />
            {sports.map((sport, index) => (
              <Bar
                key={sport.id}
                dataKey={sport.id}
                name={sport.label}
                stackId="hours"
                fill={PALETTE[index % PALETTE.length]}
                radius={index === sports.length - 1 ? [0, 6, 6, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {sports.map((sport, index) => (
          <li key={sport.id} className="flex items-center gap-1.5 text-xs font-semibold capitalize">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
            />
            {sport.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

type ChannelTooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: ChannelOriginItem }>
  total: number
}

function ChannelTooltip({ active, payload, total }: ChannelTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null
  const pct = total ? (item.value / total) * 100 : 0

  return (
    <div className="rounded-xl border border-border/80 bg-popover px-3 py-2 shadow-md">
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">
        {item.name}
      </p>
      <p className="mt-1 text-sm font-black">{pct.toFixed(1)}%</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{item.value} reservas</p>
    </div>
  )
}

export function ChannelOriginChart({
  data,
  className,
}: {
  data: ChannelOriginItem[]
  className?: string
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (!total) return null
  const app = data.find((item) => item.name === 'App Grassly')?.value ?? 0
  const appPct = total ? (app / total) * 100 : 0

  return (
    <div className={cn('flex flex-col items-center gap-6 sm:flex-row sm:gap-8', className)}>
      <div className="relative size-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChannelTooltip total={total} />} wrapperStyle={{ zIndex: 20 }} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="94%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">
            Automático
          </span>
          <span className="mt-1 text-lg font-black">{appPct.toFixed(0)}%</span>
        </div>
      </div>
      <ul className="w-full space-y-3">
        {data.map((entry) => {
          const pct = total ? (entry.value / total) * 100 : 0
          return (
            <li key={entry.name} className="flex items-center gap-3">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.fill }} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{entry.name}</span>
              <span className="text-sm font-black tabular-nums">{entry.value}</span>
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
