'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import type { AuditSeriesPoint } from './types'

const CANCEL = 'var(--rp-red)'
const REJECT = 'var(--rp-amber)'
const EXT = 'var(--rp-violet)'
const AXIS = 'var(--rp-muted)'
const GRID = 'var(--rp-line)'

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
      <p className="text-xs text-muted-foreground">{datum.label}</p>
      <ul className="mt-1.5 space-y-0.5 text-[11px]">
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: CANCEL }} />
          Cancelaciones
          <span className="ml-auto font-bold text-foreground">{datum.cancelaciones}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: REJECT }} />
          Rechazos
          <span className="ml-auto font-bold text-foreground">{datum.rechazos}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: EXT }} />
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
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={12}
            interval="preserveStartEnd"
            tick={{ fill: AXIS, fontSize: 11, fontWeight: 700 }}
          />
          <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tick={{ fill: AXIS, fontSize: 11 }} />
          <Tooltip cursor={{ fill: 'color-mix(in oklab, var(--rp-ink) 8%, transparent)' }} content={<IncidentsTooltip />} />
          <Bar dataKey="cancelaciones" name="Cancelaciones" stackId="i" fill={CANCEL} />
          <Bar dataKey="rechazos" name="Rechazos de pago" stackId="i" fill={REJECT} />
          <Bar dataKey="extensiones" name="Extensiones" stackId="i" fill={EXT} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
