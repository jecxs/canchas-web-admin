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
    <div className="mx-auto w-full max-w-[1440px]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Inteligencia del negocio</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-5xl">Reportes</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportMenu tab={tab} start={start} end={end} />
          <DateRangePicker key={`${tab}-${start}-${end}`} start={start} end={end} today={today} tab={tab} />
        </div>
      </div>
      <ReportesTabs activeTab={tab} start={start} end={end} />
      <div className="mt-6">{children}</div>
    </div>
  )
}
