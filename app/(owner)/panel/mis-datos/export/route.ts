import { buildCajaWorkbook, buildReservationsWorkbook, workbookToBuffer } from '@/features/owner-data/xlsx-export'
import { isIsoDate } from '@/features/reportes/date-utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function safeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'local'
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const tipo = params.get('tipo') === 'caja' ? 'caja' : 'reservas'
  const from = isIsoDate(params.get('from')) ? (params.get('from') as string) : undefined
  const to = isIsoDate(params.get('to')) ? (params.get('to') as string) : undefined

  const result = tipo === 'caja'
    ? await buildCajaWorkbook({ from, to })
    : await buildReservationsWorkbook({ from, to })
  const buffer = await workbookToBuffer(result.workbook)

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="grassly-${tipo}-${safeName(result.localName)}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
}
