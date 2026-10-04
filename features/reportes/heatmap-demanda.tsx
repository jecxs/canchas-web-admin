'use client'

import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import type { OperativeHeatmap } from './types'

const EMPTY_COLOR = '#F9FAFB'
const LIME_RGB = '200, 255, 0'

function cellBackground(value: number, max: number) {
  if (value <= 0) return EMPTY_COLOR
  const intensity = Math.max(0.2, value / max)
  return `rgba(${LIME_RGB}, ${intensity})`
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
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className="min-w-[720px]">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `64px repeat(${data.hours.length}, minmax(0, 1fr))` }}
        >
          <div aria-hidden />
          {data.hours.map((hour) => (
            <div
              key={`hour-${hour}`}
              className="pb-1 text-center text-[10px] font-bold tabular-nums text-muted-foreground"
            >
              {hour}
            </div>
          ))}

          {data.weekdays.map((day, dayIndex) => (
            <Fragment key={day}>
              <div className="flex items-center pr-2 text-xs font-bold text-foreground">{day}</div>
              {data.hours.map((hour, hourIndex) => {
                const value = data.values[dayIndex]?.[hourIndex] ?? 0
                return (
                  <div key={`${day}-${hour}`} className="group relative">
                    <div
                      className="flex aspect-square w-full items-center justify-center rounded-md text-xs font-black text-secondary transition-transform duration-150 group-hover:scale-110"
                      style={{ backgroundColor: cellBackground(value, max) }}
                    >
                      {value > 0 ? value : ''}
                    </div>
                    {value > 0 ? (
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-secondary-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
                      >
                        {day} a las {hour} · {value} reserva{value === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] font-semibold text-muted-foreground">
        <span className="mr-1">Menos</span>
        <span className="size-3 rounded-sm" style={{ backgroundColor: EMPTY_COLOR }} />
        {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
          <span
            key={step}
            className="size-3 rounded-sm"
            style={{ backgroundColor: `rgba(${LIME_RGB}, ${step})` }}
          />
        ))}
        <span className="ml-1">Más</span>
      </div>
    </div>
  )
}
