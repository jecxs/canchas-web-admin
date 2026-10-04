'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { OperativeHeatmap } from './types'

const LIME = '#C8FF00'
const MUTED = '#E5E7EB'

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
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">
        {datum.label}
      </p>
      <p className="mt-1 text-sm font-black">{datum.reservations} reservas acumuladas</p>
    </div>
  )
}

export function CrossFilterDemand({ heatmap }: { heatmap: OperativeHeatmap }) {
  const [diaFiltro, setDiaFiltro] = useState<string | null>(null)

  // Fila seleccionada dentro de la matriz día × hora.
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
    <section className="grid gap-5 xl:grid-cols-2">
      <Card className="gap-5 py-6">
        <div className="px-6">
          <h2 className="text-base font-black tracking-[-.02em]">Demanda por día</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Total acumulado por día de la semana en el rango.{' '}
            {diaFiltro
              ? 'Haz clic en el día activo para quitar el filtro.'
              : 'Haz clic en un día para filtrar las horas.'}
          </p>
        </div>
        <div className="px-2 sm:px-4">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byWeekday} barCategoryGap="24%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  interval={0}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 700 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  allowDecimals={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                />
                <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.45 }} content={<DemandTooltip />} />
                <Bar dataKey="reservations" name="Reservas" radius={[8, 8, 0, 0]} maxBarSize={72}>
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
      </Card>

      <Card className="gap-5 py-6">
        <div className="flex items-start justify-between gap-3 px-6">
          <div>
            <h2 className="text-base font-black tracking-[-.02em]">Demanda por hora</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {diaFiltro
                ? `Total acumulado por hora de los ${diaFiltro} del rango.`
                : 'Total acumulado por hora en todos los días del rango.'}
            </p>
          </div>
          {diaFiltro ? (
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => setDiaFiltro(null)}
              className="shrink-0 text-muted-foreground"
            >
              Ver toda la semana
            </Button>
          ) : null}
        </div>
        <div className="px-2 sm:px-4">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byHour} barCategoryGap="22%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.45 }} content={<DemandTooltip />} />
                <Bar dataKey="reservations" name="Reservas" radius={[8, 8, 0, 0]} maxBarSize={56} fill={LIME} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </section>
  )
}
