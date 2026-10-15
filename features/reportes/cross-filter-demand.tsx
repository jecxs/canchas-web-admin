'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { OperativeHeatmap } from './types'

const LIME = 'var(--rp-cal)'
const MUTED = 'color-mix(in oklab, var(--rp-ink) 12%, transparent)'
const AXIS = 'var(--rp-muted)'
const GRID = 'var(--rp-line)'

type DemandPoint = { label: string; reservations: number }

type DemandTooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: DemandPoint }>
}

function DemandTooltip({ active, payload }: DemandTooltipProps) {
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  if (!datum) return null

  return (
    <div className="rounded-xl border border-border/80 bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{datum.label}</p>
      <p className="mt-1 text-sm font-black">{datum.reservations} reservas</p>
    </div>
  )
}

export function CrossFilterDemand({ heatmap }: { heatmap: OperativeHeatmap }) {
  const [diaFiltro, setDiaFiltro] = useState<string | null>(null)

  const selectedIndex = diaFiltro ? heatmap.weekdays.indexOf(diaFiltro) : -1

  const byWeekday = useMemo<DemandPoint[]>(
    () =>
      heatmap.weekdays.map((label, dayIndex) => ({
        label,
        reservations: (heatmap.values[dayIndex] ?? []).reduce((sum, value) => sum + value, 0),
      })),
    [heatmap],
  )

  const byHour = useMemo<DemandPoint[]>(
    () =>
      heatmap.hours.map((hour, hourIndex) => {
        const reservations =
          selectedIndex >= 0
            ? heatmap.values[selectedIndex]?.[hourIndex] ?? 0
            : heatmap.values.reduce((sum, row) => sum + (row[hourIndex] ?? 0), 0)
        return { label: hour, reservations }
      }),
    [heatmap, selectedIndex],
  )

  function toggleDay(day: string) {
    setDiaFiltro((current) => (current === day ? null : day))
  }

  return (
    <section className="rp-panels">
      <div className="rp-panel">
        <h3 className="rp-h3">Reservas por día de la semana</h3>
        <p className="rp-hint">
          Total acumulado por día en el rango.{' '}
          {diaFiltro
            ? 'Haz clic en el día activo para quitar el filtro.'
            : 'Haz clic en un día para filtrar las horas.'}
        </p>
        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byWeekday} barCategoryGap="24%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval={0}
                tick={{ fill: AXIS, fontSize: 11, fontWeight: 700 }}
              />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tick={{ fill: AXIS, fontSize: 11 }} />
              <Tooltip cursor={{ fill: 'color-mix(in oklab, var(--rp-ink) 8%, transparent)' }} content={<DemandTooltip />} />
              <Bar dataKey="reservations" name="Reservas" radius={[6, 6, 0, 0]} maxBarSize={64}>
                {byWeekday.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={diaFiltro === null || diaFiltro === entry.label ? LIME : MUTED}
                    cursor="pointer"
                    onClick={() => toggleDay(entry.label)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rp-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="rp-h3">Reservas por hora</h3>
            <p className="rp-hint">
              {diaFiltro ? `Total por hora de los ${diaFiltro} del rango.` : 'Total por hora en todos los días del rango.'}
            </p>
          </div>
          {diaFiltro ? (
            <button type="button" className="rp-chip shrink-0" onClick={() => setDiaFiltro(null)}>
              Ver toda la semana
            </button>
          ) : null}
        </div>
        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byHour} barCategoryGap="22%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              <Tooltip cursor={{ fill: 'color-mix(in oklab, var(--rp-ink) 8%, transparent)' }} content={<DemandTooltip />} />
              <Bar dataKey="reservations" name="Reservas" radius={[6, 6, 0, 0]} maxBarSize={48} fill={LIME} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
