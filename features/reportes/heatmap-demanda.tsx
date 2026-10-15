'use client'

import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import type { OperativeHeatmap } from './types'

// Rampa lima: pálido → lima intensa. Sin verdes oscuros.
const SCALE = ['#EEF3DF', '#DDF0A8', '#CDE97E', '#BCE23A', '#9CCB1E', '#7FB000']
const EMPTY = 'color-mix(in oklab, var(--rp-ink) 6%, transparent)'

function cellBackground(value: number, max: number) {
  if (value <= 0) return EMPTY
  const idx = Math.min(SCALE.length - 1, Math.floor((value / max) * (SCALE.length - 1)))
  return SCALE[idx]
}

export function HeatmapDemanda({
  data,
  className,
}: {
  data: OperativeHeatmap
  className?: string
}) {
  if (!data.hours.length || !data.values.length) return null
  const max = Math.max(1, ...data.values.flat())

  return (
    <div className={cn('rp-heat-scroll', className)}>
      <div
        className="rp-heat"
        style={{ gridTemplateColumns: `88px repeat(${data.hours.length}, minmax(0, 1fr))` }}
      >
        <div aria-hidden />
        {data.hours.map((hour) => (
          <div key={`hour-${hour}`} className="rp-hcol">
            {hour}
          </div>
        ))}

        {data.weekdays.map((day, dayIndex) => (
          <Fragment key={day}>
            <div className="rp-hrow">{day}</div>
            {data.hours.map((hour, hourIndex) => {
              const value = data.values[dayIndex]?.[hourIndex] ?? 0
              return (
                <div key={`${day}-${hour}`} className="group relative">
                  <div className="rp-cell" style={{ backgroundColor: cellBackground(value, max) }}>
                    {value > 0 ? value : ''}
                  </div>
                  {value > 0 ? (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-secondary-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
                    >
                      {day} a las {hour}: {value} reserva{value === 1 ? '' : 's'}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>

      <div className="rp-legend" aria-hidden="true">
        <span className="mr-1">Menos</span>
        <i style={{ backgroundColor: EMPTY }} />
        {SCALE.map((color) => (
          <i key={color} style={{ backgroundColor: color }} />
        ))}
        <span className="ml-1">Más</span>
      </div>
    </div>
  )
}
