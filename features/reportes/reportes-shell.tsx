import { DateRangePicker } from './date-range-picker'
import { ExportMenu } from './export-menu'
import { ReportesTabs } from './reportes-tabs'
import type { ReportTab } from './types'

export function ReportesShell({
  tab,
  start,
  end,
  today,
  subtitle,
  children,
}: {
  tab: ReportTab
  start: string
  end: string
  today: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="reportes mx-auto w-full max-w-[1120px]">
      <div className="rp-head">
        <div>
          <h1 className="rp-title">Reportes</h1>
          <p className="rp-lede">{subtitle}</p>
        </div>
        <div className="rp-actions">
          <DateRangePicker key={`${tab}-${start}-${end}`} start={start} end={end} today={today} tab={tab} />
          <ExportMenu tab={tab} start={start} end={end} />
        </div>
      </div>
      <ReportesTabs activeTab={tab} start={start} end={end} />
      <div>{children}</div>
    </div>
  )
}
