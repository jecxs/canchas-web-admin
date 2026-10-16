'use client'

import { IncidentsOverTimeChart } from './audit-charts'
import { AuditIncidentsTable } from './audit-incidents-table'
import type { AuditBreakdownItem, AuditReport } from './types'

const CANCEL = 'var(--rp-red)'
const REJECT = 'var(--rp-amber)'
const EXT = 'var(--rp-violet)'
const CANCEL_SOFT = 'color-mix(in oklab, var(--rp-red) 45%, transparent)'
const EXT_SOFT = 'color-mix(in oklab, var(--rp-violet) 40%, transparent)'

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="rp-empty">
      <p>{message}</p>
    </div>
  )
}

function Split({ items, colors }: { items: AuditBreakdownItem[]; colors: string[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1
  return (
    <>
      <div className="rp-split" aria-hidden="true">
        {items.map((item, index) => (
          <i key={item.id} style={{ width: `${(item.count / total) * 100}%`, background: colors[index % colors.length] }} />
        ))}
      </div>
      <div className="rp-splitlegend">
        {items.map((item, index) => (
          <span key={item.id}>
            <span className="rp-dot" style={{ background: colors[index % colors.length] }} />
            {item.label} <b>{item.count}</b>
          </span>
        ))}
      </div>
    </>
  )
}

export function AuditDashboard({ data }: { data: AuditReport }) {
  const hasData = data.totals.cancelaciones + data.totals.rechazos + data.totals.extensiones > 0
  const totalIncidents = data.totals.cancelaciones + data.totals.rechazos + data.totals.extensiones
  const maxReason = Math.max(1, ...data.rejectionsByReason.map((item) => item.count))

  return (
    <>
      <section className="rp-block">
        <div className="rp-blockhead">
          <div>
            <h2 className="rp-h2">Incidencias en el tiempo</h2>
            <p className="rp-hint">Eventos por día según su fecha de cancelación, rechazo o extensión.</p>
          </div>
          <div className="rp-keys" aria-hidden="true">
            <span><span className="rp-dot" style={{ background: CANCEL }} />Cancelaciones</span>
            <span><span className="rp-dot" style={{ background: REJECT }} />Rechazos</span>
            <span><span className="rp-dot" style={{ background: EXT }} />Extensiones</span>
          </div>
        </div>
        {hasData ? (
          <IncidentsOverTimeChart data={data.series} />
        ) : (
          <ChartEmpty message="Sin incidencias en este periodo." />
        )}
      </section>

      <section className="rp-block rp-metrics">
        <div className="rp-metric">
          <span className="rp-mval rp-red">{data.totals.cancelaciones}</span>
          <span className="rp-mlab">Cancelaciones</span>
        </div>
        <div className="rp-metric">
          <span className="rp-mval rp-amber">{data.totals.rechazos}</span>
          <span className="rp-mlab">Rechazos de pago</span>
        </div>
        <div className="rp-metric">
          <span className="rp-mval rp-violet">{data.totals.extensiones}</span>
          <span className="rp-mlab">Extensiones de +30 min</span>
        </div>
        <div className="rp-metric">
          <span className="rp-mval">{totalIncidents}</span>
          <span className="rp-mlab">Total de incidencias</span>
        </div>
      </section>

      <section className="rp-block rp-panels">
        <div className="rp-panel">
          <h3 className="rp-h3">Rechazos por motivo</h3>
          {data.rejectionsByReason.length ? (
            <div>
              {data.rejectionsByReason.map((item) => (
                <div className="rp-rank" key={item.id}>
                  <span className="rp-ranklab">{item.label}</span>
                  <span className="rp-ranktrack">
                    <i style={{ width: `${Math.round((item.count / maxReason) * 100)}%`, background: REJECT }} />
                  </span>
                  <span className="rp-rankval">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <ChartEmpty message="Sin rechazos en este periodo." />
          )}
        </div>

        <div className="rp-panel">
          <div className="rp-mini">
            <h3 className="rp-h3">Cancelaciones por quién</h3>
            {data.cancellationsByType.length ? (
              <Split items={data.cancellationsByType} colors={[CANCEL, CANCEL_SOFT]} />
            ) : (
              <p className="rp-hint">Sin cancelaciones en este periodo.</p>
            )}
          </div>
          <div className="rp-mini">
            <h3 className="rp-h3">Extensiones por cobro</h3>
            {data.extensionsByChargeStatus.length ? (
              <Split items={data.extensionsByChargeStatus} colors={[EXT, EXT_SOFT]} />
            ) : (
              <p className="rp-hint">Sin extensiones en este periodo.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rp-block">
        <div className="rp-blockhead">
          <div>
            <h2 className="rp-h2">Detalle de incidencias</h2>
            <p className="rp-hint">Cancelaciones, rechazos y extensiones del rango, ordenados por fecha del evento.</p>
          </div>
        </div>
        <AuditIncidentsTable incidents={data.incidents} />
      </section>
    </>
  )
}
