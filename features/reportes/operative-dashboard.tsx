'use client'

import { CrossFilterDemand } from './cross-filter-demand'
import { HeatmapDemanda } from './heatmap-demanda'
import type { OperativeReport } from './types'

function formatHours(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} h`
}

const SPORT_COLORS = ['var(--rp-ink)', 'var(--rp-cal)', 'var(--rp-violet)', 'var(--rp-violet-300)']

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="rp-empty">
      <p>{message}</p>
    </div>
  )
}

function Readout({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="rp-ritem">
      <span className="rp-rk">{label}</span>
      <span className="rp-rv">{value ?? '—'}</span>
    </div>
  )
}

export function OperativeDashboard({ data }: { data: OperativeReport }) {
  const maxSport = Math.max(1, ...data.bySport.map((sport) => sport.reservations))
  const channelTotal = data.byChannel.reduce((sum, item) => sum + item.value, 0) || 1

  return (
    <>
      <section className="rp-block">
        <div className="rp-blockhead">
          <div>
            <h2 className="rp-h2">Uso de canchas por día y hora</h2>
            <p className="rp-hint">
              Cada celda es una hora de cancha reservada en el periodo. Más contenido, más llena la hora.
            </p>
          </div>
        </div>
        {data.heatmap.hours.length ? (
          <div className="rp-cancha">
            <HeatmapDemanda data={data.heatmap} />
          </div>
        ) : (
          <ChartEmpty message="Sin reservas en este periodo." />
        )}
      </section>

      <section className="rp-block rp-metrics">
        <div className="rp-metric">
          <span className="rp-mval rp-violet">{formatHours(data.totals.hours)}</span>
          <span className="rp-mlab">Horas de cancha ocupadas</span>
        </div>
        <div className="rp-metric">
          <span className="rp-mval">{data.totals.reservations}</span>
          <span className="rp-mlab">Reservas en el periodo</span>
        </div>
        <div className="rp-metric">
          <span className="rp-mval">{data.totals.extensiones}</span>
          <span className="rp-mlab">Extensiones de +30 min</span>
        </div>
        <div className="rp-metric">
          <span className="rp-mval">{formatHours(data.totals.extraHours)}</span>
          <span className="rp-mlab">Horas extra autorizadas</span>
        </div>
      </section>

      <section className="rp-block rp-readout">
        <Readout label="Día más lleno" value={data.insights.busiestDay?.label} />
        <Readout label="Día más flojo" value={data.insights.quietestDay?.label} />
        <Readout label="Hora pico" value={data.insights.peakHour?.label} />
        <Readout label="Hora muerta" value={data.insights.deadHour?.label} />
      </section>

      {data.totals.reservations > 0 ? (
        <div className="rp-block">
          <CrossFilterDemand heatmap={data.heatmap} />
        </div>
      ) : null}

      <section className="rp-block rp-panels">
        <div className="rp-panel">
          <h3 className="rp-h3">Deportes más jugados</h3>
          {data.bySport.length ? (
            <div>
              {data.bySport.map((sport) => (
                <div className="rp-rank" key={sport.id}>
                  <span className="rp-ranklab capitalize">{sport.label}</span>
                  <span className="rp-ranktrack">
                    <i style={{ width: `${Math.round((sport.reservations / maxSport) * 100)}%` }} />
                  </span>
                  <span className="rp-rankval">{sport.reservations} reservas</span>
                </div>
              ))}
            </div>
          ) : (
            <ChartEmpty message="Sin reservas por deporte en este periodo." />
          )}
        </div>

        <div className="rp-panel">
          <h3 className="rp-h3">De dónde vienen las reservas</h3>
          {data.byChannel.length ? (
            <>
              <div className="rp-split" aria-hidden="true">
                {data.byChannel.map((item) => (
                  <i
                    key={item.name}
                    style={{
                      width: `${(item.value / channelTotal) * 100}%`,
                      background: item.name === 'App Grassly' ? 'var(--rp-violet)' : 'var(--rp-cal)',
                    }}
                  />
                ))}
              </div>
              <div className="rp-splitlegend">
                {data.byChannel.map((item) => (
                  <span key={item.name}>
                    <span
                      className="rp-dot"
                      style={{ background: item.name === 'App Grassly' ? 'var(--rp-violet)' : 'var(--rp-cal)' }}
                    />
                    {item.name} <b>{item.value}</b>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <ChartEmpty message="Sin reservas en este periodo." />
          )}
        </div>
      </section>

      <section className="rp-block">
        <div className="rp-blockhead">
          <div>
            <h2 className="rp-h2">Horas por cancha y deporte</h2>
            <p className="rp-hint">Cuántas horas se jugaron en cada espacio, separadas por deporte.</p>
          </div>
        </div>
        {data.byCourtSport.length && data.sports.length ? (
          <div>
            {data.byCourtSport.map((row) => {
              const total = Object.values(row.values).reduce((sum, value) => sum + value, 0) || 1
              return (
                <div className="rp-stackrow" key={row.id}>
                  <div className="rp-stacktop">
                    <span>{row.label}</span>
                    <span>{formatHours(total)}</span>
                  </div>
                  <div className="rp-stack">
                    {data.sports.map((sport, index) => {
                      const value = row.values[sport.id] ?? 0
                      if (value <= 0) return null
                      return (
                        <i
                          key={sport.id}
                          title={`${sport.label}: ${formatHours(value)}`}
                          style={{
                            width: `${(value / total) * 100}%`,
                            background: SPORT_COLORS[index % SPORT_COLORS.length],
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
            <div className="rp-splitlegend">
              {data.sports.map((sport, index) => (
                <span key={sport.id}>
                  <span className="rp-dot" style={{ background: SPORT_COLORS[index % SPORT_COLORS.length] }} />
                  {sport.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <ChartEmpty message="Sin horas jugadas por cancha en este periodo." />
        )}
      </section>
    </>
  )
}
