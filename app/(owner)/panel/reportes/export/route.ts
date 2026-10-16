import { isIsoDate } from '@/features/reportes/date-utils'
import {
  buildAuditWorkbook,
  buildIncomeWorkbook,
  buildOperativeWorkbook,
  workbookToBuffer,
} from '@/features/reportes/xlsx-export'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const tabParam = params.get('tab')
  const tab = tabParam === 'operativo' ? 'operativo' : tabParam === 'auditoria' ? 'auditoria' : 'financiero'

  const startParam = params.get('start')
  const endParam = params.get('end')
  const start = isIsoDate(startParam) ? startParam : undefined
  const end = isIsoDate(endParam) ? endParam : undefined

  const sectionsParam = params.get('sections')
  const sections = sectionsParam
    ? sectionsParam.split(',').map((section) => section.trim()).filter(Boolean)
    : undefined

  const result =
    tab === 'operativo'
      ? await buildOperativeWorkbook({ start, end, sections })
      : tab === 'auditoria'
        ? await buildAuditWorkbook({ start, end, sections })
        : await buildIncomeWorkbook({ start, end, sections })

  const buffer = await workbookToBuffer(result.workbook)

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-${tab}-${result.report.start}_${result.report.end}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
}
