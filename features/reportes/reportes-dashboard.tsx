'use client'

import { useState } from 'react'
import { groupDaily } from './date-utils'
import { IncomeBarChart } from './income-charts'
import type { IncomeReport, ReportGranularity, ReportSeriesPoint } from './types'

const GROUPINGS: Array<{ value: ReportGranularity; label: string }> = [
  { value: 'dia', label: 'Diario' },
  { value: 'semana', label: 'Semanal' },
  { value: 'mes', label: 'Mensual' },
]

function formatMoney(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value)
}

function formatCount(value: number) {
  return new Intl.NumberFormat('es-PE').format(value)
}

function methodColor(label: string) {
  const value = label.toLowerCase()
  if (value.includes('efectivo')) return 'var(--rp-cal)'
  if (value.includes('yape')) return 'var(--rp-violet-700)'
  if (value.includes('plin')) return 'var(--rp-violet-300)'
  return 'var(--rp-violet)'
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="rp-empty">
      <p>{message}</p>
    </div>
  )
}

export function ReportesDashboard({ data }: { data: IncomeReport }) {
  const [granularity, setGranularity] = useState<ReportGranularity>('dia')
  const series = groupDaily(data.daily, granularity)
  const sportPositive = data.bySport.filter((item) => item.income > 0)
  const methodPositive = data.byMethod.filter((item) => item.income > 0)
  const courtSeries: ReportSeriesPoint[] = data.byCourt.map((item) => ({
    key: item.id,
    label: item.label,
    income: item.income,
    movements: item.reservations,
  }))
  const maxSport = Math.max(1, ...sportPositive.map((item) => item.income))
  const methodTotal = methodPositive.reduce((sum, item) => sum + item.income, 0) || 1
  const hasSeries = series.some((point) => point.income !== 0)

  return (
    <>
      <section className="rp-block">
        <div className="rp-blockhead">
          <div>
            <h2 className="rp-h2">Cobrado en el tiempo</h2>
            <p className="rp-hint">Cobros registrados por fecha de pago.</p>
          </div>
          <div className="rp-switch" role="group" aria-label="Agrupar por">
            {GROUPINGS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={granularity === option.value}
                onClick={() => setGranularity(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {hasSeries ? (
          <IncomeBarChart data={series} />
        ) : (
          <ChartEmpty message="No hay cobros registrados en este periodo." />
        )}
      </section>

      <section className="rp-block rp-metrics">
        <div className="rp-metric">
          <span className="rp-mval">{formatMoney(data.totals.income)}</span>
          <span className="rp-mlab">Ingresos cobrados</span>
          <span className="rp-msub">en el periodo</span>
        </div>
        <div className="rp-metric">
          <span className="rp-mval rp-amber">{formatMoney(data.totals.outstanding)}</span>
          <span className="rp-mlab">Saldos por cobrar</span>
          <span className="rp-msub">reservas confirmadas sin cerrar</span>
        </div>
        <div className="rp-metric">
          <span className="rp-mval">{formatCount(data.totals.reservations)}</span>
          <span className="rp-mlab">Reservas</span>
          <span className="rp-msub">confirmadas y completadas</span>
        </div>
        <div className="rp-metric">
          <span className="rp-mval">{formatMoney(data.totals.averageTicket, 2)}</span>
          <span className="rp-mlab">Ticket promedio</span>
          <span className="rp-msub">cobrado por reserva</span>
        </div>
      </section>

      <section className="rp-block rp-panels">
        <div className="rp-panel">
          <h3 className="rp-h3">Cobrado por cancha</h3>
          {courtSeries.length ? (
            <IncomeBarChart data={courtSeries} className="h-64" maxBarSize={64} />
          ) : (
            <ChartEmpty message="Sin cobros por cancha en este periodo." />
          )}
        </div>
        <div className="rp-panel">
          <h3 className="rp-h3">Cobrado por deporte</h3>
          {sportPositive.length ? (
            <div>
              {sportPositive.map((item) => (
                <div className="rp-rank" key={item.id}>
                  <span className="rp-ranklab capitalize">{item.label}</span>
                  <span className="rp-ranktrack">
                    <i style={{ width: `${Math.round((item.income / maxSport) * 100)}%` }} />
                  </span>
                  <span className="rp-rankval">{formatMoney(item.income)}</span>
                </div>
              ))}
            </div>
          ) : (
            <ChartEmpty message="Sin cobros por deporte en este periodo." />
          )}
        </div>
      </section>

      <section className="rp-block">
        <div className="rp-blockhead">
          <div>
            <h2 className="rp-h2">Cobros por método de pago</h2>
            <p className="rp-hint">Yape, Plin y transferencia entran por lo digital; el efectivo, en caja.</p>
          </div>
        </div>
        {methodPositive.length ? (
          <>
            <div className="rp-split" aria-hidden="true">
              {methodPositive.map((item) => (
                <i
                  key={item.id}
                  style={{ width: `${(item.income / methodTotal) * 100}%`, background: methodColor(item.label) }}
                />
              ))}
            </div>
            <div className="rp-splitlegend">
              {methodPositive.map((item) => (
                <span key={item.id}>
                  <span className="rp-dot" style={{ background: methodColor(item.label) }} />
                  {item.label} <b>{formatMoney(item.income)}</b>
                </span>
              ))}
            </div>
          </>
        ) : (
          <ChartEmpty message="Sin cobros registrados por método en este periodo." />
        )}
      </section>
    </>
  )
}
