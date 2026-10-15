import { AuditDashboard } from '@/features/reportes/audit-dashboard'
import { getAuditReport } from '@/features/reportes/audit-queries'
import { OperativeDashboard } from '@/features/reportes/operative-dashboard'
import { getOperativeReport } from '@/features/reportes/operative-queries'
import { ReportesDashboard } from '@/features/reportes/reportes-dashboard'
import { getIncomeReport } from '@/features/reportes/queries'
import { ReportesShell } from '@/features/reportes/reportes-shell'
import { isIsoDate } from '@/features/reportes/date-utils'
import type { ReportTab } from '@/features/reportes/types'

type ReportsSearchParams = Promise<{ tab?: string; start?: string; end?: string }>

function resolveTab(value: string | undefined): ReportTab {
  if (value === 'operativo') return 'operativo'
  if (value === 'auditoria') return 'auditoria'
  return 'financiero'
}

export default async function OwnerReportsPage({
  searchParams,
}: {
  searchParams: ReportsSearchParams
}) {
  const params = await searchParams
  const tab = resolveTab(params.tab)
  const start = isIsoDate(params.start) ? params.start : undefined
  const end = isIsoDate(params.end) ? params.end : undefined

  if (tab === 'operativo') {
    const data = await getOperativeReport({ start, end })
    return (
      <ReportesShell
        tab={tab}
        start={data.start}
        end={data.end}
        today={data.today}
        subtitle={`Qué días y horas se llenan las canchas de ${data.localName}, y qué deportes mueven la agenda.`}
      >
        <OperativeDashboard data={data} />
      </ReportesShell>
    )
  }

  if (tab === 'auditoria') {
    const data = await getAuditReport({ start, end })
    return (
      <ReportesShell
        tab={tab}
        start={data.start}
        end={data.end}
        today={data.today}
        subtitle={`Qué se canceló, qué pagos se rechazaron y qué extensiones se autorizaron en ${data.localName}.`}
      >
        <AuditDashboard data={data} />
      </ReportesShell>
    )
  }

  const data = await getIncomeReport({ start, end })
  return (
    <ReportesShell
      tab={tab}
      start={data.start}
      end={data.end}
      today={data.today}
      subtitle={`Cuánto se cobró, por qué medio entró y cuánto queda por cobrar en ${data.localName}.`}
    >
      <ReportesDashboard data={data} />
    </ReportesShell>
  )
}
