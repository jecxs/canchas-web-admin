import 'server-only'

import ExcelJS from 'exceljs'
import { createClient } from '@/utils/supabase/server'
import { formatMethodLabel, parseRange, shiftDate } from './date-utils'
import { getOperativeReport } from './operative-queries'
import { getIncomeReport } from './queries'
import { getAuditReport } from './audit-queries'
import type { AuditIncident, OperativeReport } from './types'

const BRAND_LIME = 'FFC8FF00'
const BRAND_INK = 'FF1A1A1A'
const BORDER_SOFT = 'FFD1D5DB'
const MONEY_FORMAT = '"S/" #,##0.00'
const INTEGER_FORMAT = '#,##0'
const HOURS_FORMAT = '0.0'
const PERCENT_FORMAT = '0.0%'
const DATE_FORMAT = 'yyyy-mm-dd'
const PAGE_SIZE = 1000
const MAX_PAGES = 50

const NON_BOOKING_STATES = ['pendiente_pago', 'rechazada_pago', 'expirada']
const CHANNEL_LABELS: Record<string, string> = {
  app: 'App Grassly',
  whatsapp: 'WhatsApp',
  presencial: 'Presencial',
}

type CellValue = string | number | Date | null

type Column = {
  header: string
  width: number
  format?: string
  align?: 'left' | 'right' | 'center'
}

type Kpi = {
  label: string
  value: number
  previous?: number
  changePct?: number | null
  format: string
}

type ExportInput = {
  start?: string
  end?: string
  sections?: string[]
}

function included(sections: string[] | undefined, id: string) {
  return !sections || sections.includes(id)
}

function toDate(value: string): Date | null {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function limaTimestamp() {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date())
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 20
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: BRAND_INK }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_LIME } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = { bottom: { style: 'thin', color: { argb: BORDER_SOFT } } }
  })
}

function styleTotalRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true }
    cell.border = { top: { style: 'thin', color: { argb: BORDER_SOFT } } }
  })
}

function addTableSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: Column[],
  rows: CellValue[][],
  total?: CellValue[],
  note?: string,
) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.addRow(columns.map((column) => column.header))
  styleHeaderRow(sheet.getRow(1))
  for (const row of rows) sheet.addRow(row)
  if (total) styleTotalRow(sheet.addRow(total))

  columns.forEach((column, index) => {
    const col = sheet.getColumn(index + 1)
    col.width = column.width
    if (column.format) col.numFmt = column.format
  })

  // La alineación se aplica solo a las filas de datos: así el encabezado queda
  // a la izquierda y la flecha del autofiltro no tapa su texto.
  columns.forEach((column, colIndex) => {
    if (!column.align) return
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      row.getCell(colIndex + 1).alignment = { horizontal: column.align, vertical: 'middle' }
    })
  })

  if (rows.length) {
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
  }

  if (note) {
    sheet.addRow([])
    const noteRow = sheet.addRow([note])
    sheet.mergeCells(noteRow.number, 1, noteRow.number, columns.length)
    noteRow.getCell(1).alignment = { wrapText: true, vertical: 'top' }
    noteRow.getCell(1).font = { size: 10, color: { argb: 'FF6B7280' } }
  }
  return sheet
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  title: string,
  metadata: Array<[string, string]>,
  kpis: Kpi[],
  definitions: string[],
) {
  const sheet = workbook.addWorksheet('Resumen')
  sheet.getColumn(1).width = 34
  sheet.getColumn(2).width = 20
  sheet.getColumn(3).width = 18
  sheet.getColumn(4).width = 14

  const titleRow = sheet.addRow([title])
  titleRow.font = { bold: true, size: 14, color: { argb: BRAND_INK } }
  sheet.addRow([])

  for (const [label, value] of metadata) {
    const row = sheet.addRow([label, value])
    row.getCell(1).font = { bold: true }
  }
  sheet.addRow([])

  styleHeaderRow(sheet.addRow(['Indicador', 'Valor', 'Periodo anterior', 'Variación']))
  for (const kpi of kpis) {
    const row = sheet.addRow([
      kpi.label,
      kpi.value,
      kpi.previous ?? null,
      kpi.changePct === undefined || kpi.changePct === null ? null : kpi.changePct / 100,
    ])
    row.getCell(2).numFmt = kpi.format
    if (kpi.previous !== undefined) row.getCell(3).numFmt = kpi.format
    if (kpi.changePct !== undefined) row.getCell(4).numFmt = PERCENT_FORMAT
  }

  sheet.addRow([])
  const defHeader = sheet.addRow(['Definiciones'])
  defHeader.font = { bold: true, size: 12, color: { argb: BRAND_INK } }
  for (const line of definitions) {
    const row = sheet.addRow([line])
    sheet.mergeCells(row.number, 1, row.number, 4)
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' }
    row.getCell(1).font = { size: 10, color: { argb: 'FF6B7280' } }
  }
  return sheet
}

// --- Detalle -------------------------------------------------------------

type IncomeDetailRow = {
  movimiento_id: string
  reserva_id: string
  cancha_id: string
  deporte_id: string
  fecha: string
  monto: number
  medio: string
  tipo: string
  notas: string | null
}

type IncomeDetailReader = {
  rpc: (
    functionName: 'obtener_cobros_reporte_local',
    args: { p_local_id: string; p_desde: string; p_hasta: string },
  ) => {
    range: (from: number, to: number) => Promise<{
      data: IncomeDetailRow[] | null
      error: { message?: string } | null
    }>
  }
}

async function fetchIncomeDetail(localId: string, start: string, end: string) {
  const supabase = await createClient()
  const reader = supabase as unknown as IncomeDetailReader
  const rows: IncomeDetailRow[] = []

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data, error } = await reader
      .rpc('obtener_cobros_reporte_local', {
        p_local_id: localId,
        p_desde: start,
        p_hasta: end,
      })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    if (error) {
      console.error('[reportes-xlsx:movements]', error)
      throw new Error(error.message ?? 'No se pudo cargar el detalle de movimientos.')
    }
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }

  const courtIds = [...new Set(rows.map((row) => row.cancha_id))]
  const sportIds = [...new Set(rows.map((row) => row.deporte_id))]
  const [courtsResult, sportsResult] = await Promise.all([
    courtIds.length ? supabase.from('canchas').select('id,nombre').in('id', courtIds) : Promise.resolve({ data: [] }),
    sportIds.length ? supabase.from('deportes').select('id,nombre').in('id', sportIds) : Promise.resolve({ data: [] }),
  ])
  const courtNames = new Map((courtsResult.data ?? []).map((court) => [court.id, court.nombre]))
  const sportNames = new Map((sportsResult.data ?? []).map((sport) => [sport.id, sport.nombre]))

  return rows.map<CellValue[]>((row) => [
    toDate(row.fecha),
    row.reserva_id.slice(0, 8).toUpperCase(),
    courtNames.get(row.cancha_id) ?? 'Sin nombre',
    sportNames.get(row.deporte_id) ?? 'Sin nombre',
    row.tipo,
    formatMethodLabel(row.medio),
    Number(row.monto) || 0,
    row.notas ?? '',
  ])
}

type OperativeDetailRow = {
  id: string
  cancha_id: string
  deporte_id: string
  estado: string
  canal_origen: string
  rango: unknown
}

async function fetchOperativeDetail(localId: string, start: string, end: string) {
  const supabase = await createClient()
  const { data: courtRows } = await supabase
    .from('canchas')
    .select('id,nombre')
    .eq('local_id', localId)
    .order('nombre')
  const courts = courtRows ?? []
  if (!courts.length) return []

  const courtIds = courts.map((court) => court.id)
  const startIso = `${start}T00:00:00-05:00`
  const endIso = `${shiftDate(end, 1)}T00:00:00-05:00`
  const rows: OperativeDetailRow[] = []

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data, error } = await supabase
      .from('reservas')
      .select('id,cancha_id,deporte_id,estado,canal_origen,rango')
      .in('cancha_id', courtIds)
      .overlaps('rango', `[${startIso},${endIso})`)
      .order('rango', { ascending: true })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    if (error) {
      console.error('[reportes-xlsx:reservations]', error)
      throw new Error(error.message ?? 'No se pudo cargar el detalle de reservas.')
    }
    rows.push(...((data ?? []) as OperativeDetailRow[]))
    if (!data || data.length < PAGE_SIZE) break
  }

  const sportIds = [...new Set(rows.map((row) => row.deporte_id))]
  const { data: sportRows } = sportIds.length
    ? await supabase.from('deportes').select('id,nombre').in('id', sportIds)
    : { data: [] }
  const courtNames = new Map(courts.map((court) => [court.id, court.nombre]))
  const sportNames = new Map((sportRows ?? []).map((sport) => [sport.id, sport.nombre]))

  return rows
    .filter((row) => !NON_BOOKING_STATES.includes(row.estado))
    .map<CellValue[]>((row) => {
      const { start: rangeStart, end: rangeEnd } = parseRange(row.rango)
      const duration = rangeStart && rangeEnd
        ? (new Date(rangeEnd).getTime() - new Date(rangeStart).getTime()) / 3_600_000
        : 0
      return [
        toDate(rangeStart),
        rangeStart ? rangeStart.slice(11, 16) : '',
        courtNames.get(row.cancha_id) ?? 'Sin nombre',
        sportNames.get(row.deporte_id) ?? 'Sin nombre',
        Number.isFinite(duration) ? duration : 0,
        row.estado,
        CHANNEL_LABELS[row.canal_origen] ?? row.canal_origen,
      ]
    })
}

// --- Workbooks -----------------------------------------------------------

const FINANCIAL_DEFINITIONS = [
  'Ingresos cobrados: movimientos de caja (adelanto + saldo − reembolso) agrupados por fecha de pago dentro del rango.',
  'Cancelaciones: si una reserva confirmada se cancela con devolución aprobada, sus cobros no se cuentan como ingreso.',
  'Saldos por cobrar: reservas confirmadas o completadas del rango menos el cobrado acumulado de cada reserva.',
  'Reservas: reservas en estado confirmada o completada, agrupadas por su fecha de inicio.',
  'Ticket promedio: ingresos cobrados ÷ cantidad de reservas.',
  'Zona horaria: America/Lima.',
]

const OPERATIVE_DEFINITIONS = [
  'Se cuentan reservas confirmadas y completadas (se excluyen apartados provisionales y canceladas).',
  'Horas ocupadas: suma de (hora de fin − hora de inicio) de cada reserva.',
  'Hora muerta: se calcula solo dentro del horario de atención del local.',
  'Mapa de calor: suma del rango agrupada por día de la semana y hora de inicio.',
  'Zona horaria: America/Lima.',
]

const AUDIT_DEFINITIONS = [
  'Se agrupa por la fecha del EVENTO (cancelación o rechazo), no por la fecha del partido.',
  'Cancelaciones: reservas canceladas por el cliente o el dueño.',
  'Rechazos de pago: comprobantes rechazados por el local.',
  'El motivo de cancelación es texto libre; el motivo de rechazo es estructurado.',
  'Zona horaria: America/Lima.',
]

const AUDIT_INCIDENT_COLUMNS: Column[] = [
  { header: 'Tipo', width: 18 },
  { header: 'Fecha evento', width: 18, format: 'yyyy-mm-dd hh:mm' },
  { header: 'Cliente', width: 24 },
  { header: 'Cancha', width: 24 },
  { header: 'Deporte', width: 16 },
  { header: 'Fecha partido', width: 14, format: DATE_FORMAT },
  { header: 'Actor', width: 12 },
  { header: 'Motivo', width: 44 },
]

const AUDIT_ACTOR_LABELS: Record<AuditIncident['actor'], string> = {
  cliente: 'Cliente',
  dueno: 'Dueño',
  sistema: 'Sistema',
}

function auditIncidentRow(incident: AuditIncident): CellValue[] {
  return [
    incident.type === 'cancelacion' ? 'Cancelación' : 'Rechazo de pago',
    toDate(incident.eventAt),
    incident.customerName,
    incident.courtName,
    incident.sportName,
    toDate(incident.gameDate),
    AUDIT_ACTOR_LABELS[incident.actor],
    incident.reason ?? '',
  ]
}

export async function buildIncomeWorkbook(input: ExportInput) {
  const report = await getIncomeReport(input)
  const sections = input.sections

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Grassly'
  workbook.created = new Date()

  if (included(sections, 'resumen')) {
    addSummarySheet(
      workbook,
      `Reporte financiero — ${report.localName}`,
      [
        ['Local', report.localName],
        ['Periodo', `${report.start} a ${report.end}`],
        ['Generado', limaTimestamp()],
      ],
      [
        { label: 'Ingresos cobrados', value: report.kpis.income.value, previous: report.kpis.income.previous, changePct: report.kpis.income.changePct, format: MONEY_FORMAT },
        { label: 'Saldos por cobrar', value: report.kpis.outstanding.value, previous: report.kpis.outstanding.previous, changePct: report.kpis.outstanding.changePct, format: MONEY_FORMAT },
        { label: 'Reservas', value: report.kpis.reservations.value, previous: report.kpis.reservations.previous, changePct: report.kpis.reservations.changePct, format: INTEGER_FORMAT },
        { label: 'Ticket promedio', value: report.kpis.averageTicket.value, previous: report.kpis.averageTicket.previous, changePct: report.kpis.averageTicket.changePct, format: MONEY_FORMAT },
      ],
      FINANCIAL_DEFINITIONS,
    )
  }

  if (included(sections, 'dia')) {
    const periodTotal = report.daily.reduce((sum, point) => sum + point.income, 0)
    const periodReservations = report.daily.reduce((sum, point) => sum + point.reservations, 0)
    addTableSheet(
      workbook,
      'Cobros por día',
      [
        { header: 'Fecha', width: 14, format: DATE_FORMAT },
        { header: 'Monto (S/)', width: 16, format: MONEY_FORMAT, align: 'right' },
        { header: 'Reservas', width: 12, format: INTEGER_FORMAT, align: 'right' },
      ],
      report.daily.map((point) => [toDate(point.date), point.income, point.reservations]),
      ['Total', periodTotal, periodReservations],
    )
  }

  if (included(sections, 'deporte')) {
    const sportTotal = report.bySport.reduce((sum, item) => sum + item.income, 0)
    addTableSheet(
      workbook,
      'Por deporte',
      [
        { header: 'Deporte', width: 24 },
        { header: 'Monto (S/)', width: 16, format: MONEY_FORMAT, align: 'right' },
        { header: 'Reservas', width: 12, format: INTEGER_FORMAT, align: 'right' },
        { header: '% del total', width: 12, format: PERCENT_FORMAT, align: 'right' },
      ],
      report.bySport.map((item) => [item.label, item.income, item.reservations, sportTotal ? item.income / sportTotal : 0]),
      ['Total', sportTotal, report.bySport.reduce((sum, item) => sum + item.reservations, 0), sportTotal ? 1 : 0],
    )
  }

  if (included(sections, 'cancha')) {
    const courtTotal = report.byCourt.reduce((sum, item) => sum + item.income, 0)
    addTableSheet(
      workbook,
      'Por cancha',
      [
        { header: 'Cancha', width: 28 },
        { header: 'Monto (S/)', width: 16, format: MONEY_FORMAT, align: 'right' },
        { header: 'Reservas', width: 12, format: INTEGER_FORMAT, align: 'right' },
        { header: '% del total', width: 12, format: PERCENT_FORMAT, align: 'right' },
      ],
      report.byCourt.map((item) => [item.label, item.income, item.reservations, courtTotal ? item.income / courtTotal : 0]),
      ['Total', courtTotal, report.byCourt.reduce((sum, item) => sum + item.reservations, 0), courtTotal ? 1 : 0],
    )
  }

  if (included(sections, 'metodo')) {
    const methodTotal = report.byMethod.reduce((sum, item) => sum + item.income, 0)
    addTableSheet(
      workbook,
      'Por método',
      [
        { header: 'Método', width: 20 },
        { header: 'Monto (S/)', width: 16, format: MONEY_FORMAT, align: 'right' },
        { header: 'Cobros', width: 12, format: INTEGER_FORMAT, align: 'right' },
        { header: '% del total', width: 12, format: PERCENT_FORMAT, align: 'right' },
      ],
      report.byMethod.map((item) => [item.label, item.income, item.reservations, methodTotal ? item.income / methodTotal : 0]),
      ['Total', methodTotal, report.byMethod.reduce((sum, item) => sum + item.reservations, 0), methodTotal ? 1 : 0],
    )
  }

  if (included(sections, 'detalle')) {
    const detail = await fetchIncomeDetail(report.localId, report.start, report.end)
    addTableSheet(
      workbook,
      'Detalle de movimientos',
      [
        { header: 'Fecha', width: 14, format: DATE_FORMAT },
        { header: 'Reserva', width: 12 },
        { header: 'Cancha', width: 28 },
        { header: 'Deporte', width: 18 },
        { header: 'Tipo', width: 12 },
        { header: 'Método', width: 16 },
        { header: 'Monto (S/)', width: 16, format: MONEY_FORMAT, align: 'right' },
        { header: 'Notas', width: 40 },
      ],
      detail,
    )
  }

  return { report, workbook }
}

export async function buildOperativeWorkbook(input: ExportInput) {
  const report = await getOperativeReport(input)
  const sections = input.sections

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Grassly'
  workbook.created = new Date()

  const insight = (value: OperativeReport['insights']['busiestDay']) =>
    value ? `${value.label} (${value.detail})` : 'Sin datos'

  if (included(sections, 'resumen')) {
    const summarySheet = addSummarySheet(
      workbook,
      `Reporte operativo — ${report.localName}`,
      [
        ['Local', report.localName],
        ['Periodo', `${report.start} a ${report.end}`],
        ['Generado', limaTimestamp()],
      ],
      [
        { label: 'Total de reservas', value: report.totals.reservations, format: INTEGER_FORMAT },
        { label: 'Horas ocupadas', value: report.totals.hours, format: HOURS_FORMAT },
      ],
      OPERATIVE_DEFINITIONS,
    )
    summarySheet.addRow([])
    styleHeaderRow(summarySheet.addRow(['Indicador', 'Detalle']))
    summarySheet.addRow(['Día más reservado', insight(report.insights.busiestDay)])
    summarySheet.addRow(['Día menos reservado', insight(report.insights.quietestDay)])
    summarySheet.addRow(['Hora pico', insight(report.insights.peakHour)])
    summarySheet.addRow(['Hora muerta', insight(report.insights.deadHour)])
  }

  if (included(sections, 'calor')) {
    addTableSheet(
      workbook,
      'Mapa de calor',
      [
        { header: 'Día', width: 16 },
        ...report.heatmap.hours.map((hour) => ({
          header: hour,
          width: 11,
          format: INTEGER_FORMAT,
          align: 'right' as const,
        })),
      ],
      report.heatmap.weekdays.map((day, dayIndex) => [
        day,
        ...report.heatmap.hours.map((_, hourIndex) => report.heatmap.values[dayIndex]?.[hourIndex] ?? 0),
      ]),
      undefined,
      'Cómo leer: cada celda es la cantidad de reservas que inician ese día de la semana a esa hora, sumando todos los días del rango seleccionado. Cuanto mayor el número, mayor la demanda en ese horario.',
    )
  }

  if (included(sections, 'canchaDeporte')) {
    addTableSheet(
      workbook,
      'Cancha por deporte',
      [
        { header: 'Cancha', width: 28 },
        ...report.sports.map((sport) => ({
          header: `${sport.label} (h)`,
          width: 14,
          format: HOURS_FORMAT,
          align: 'right' as const,
        })),
        { header: 'Total (h)', width: 14, format: HOURS_FORMAT, align: 'right' },
      ],
      report.byCourtSport.map((row) => [
        row.label,
        ...report.sports.map((sport) => row.values[sport.id] ?? 0),
        report.sports.reduce((sum, sport) => sum + (row.values[sport.id] ?? 0), 0),
      ]),
    )
  }

  if (included(sections, 'deporte')) {
    const sportTotal = report.bySport.reduce((sum, item) => sum + item.reservations, 0)
    addTableSheet(
      workbook,
      'Por deporte',
      [
        { header: 'Deporte', width: 24 },
        { header: 'Reservas', width: 12, format: INTEGER_FORMAT, align: 'right' },
        { header: 'Horas (h)', width: 12, format: HOURS_FORMAT, align: 'right' },
        { header: '% del total', width: 12, format: PERCENT_FORMAT, align: 'right' },
      ],
      report.bySport.map((item) => [item.label, item.reservations, item.hours, sportTotal ? item.reservations / sportTotal : 0]),
      ['Total', sportTotal, report.bySport.reduce((sum, item) => sum + item.hours, 0), sportTotal ? 1 : 0],
    )
  }

  if (included(sections, 'canal')) {
    const channelTotal = report.byChannel.reduce((sum, item) => sum + item.value, 0)
    addTableSheet(
      workbook,
      'Canal de origen',
      [
        { header: 'Canal', width: 24 },
        { header: 'Reservas', width: 12, format: INTEGER_FORMAT, align: 'right' },
        { header: '% del total', width: 12, format: PERCENT_FORMAT, align: 'right' },
      ],
      report.byChannel.map((item) => [item.name, item.value, channelTotal ? item.value / channelTotal : 0]),
      ['Total', channelTotal, channelTotal ? 1 : 0],
    )
  }

  if (included(sections, 'detalle')) {
    const detail = await fetchOperativeDetail(report.localId, report.start, report.end)
    addTableSheet(
      workbook,
      'Detalle de reservas',
      [
        { header: 'Fecha', width: 14, format: DATE_FORMAT },
        { header: 'Hora', width: 10 },
        { header: 'Cancha', width: 28 },
        { header: 'Deporte', width: 18 },
        { header: 'Duración (h)', width: 14, format: HOURS_FORMAT, align: 'right' },
        { header: 'Estado', width: 20 },
        { header: 'Canal', width: 16 },
      ],
      detail,
    )
  }

  return { report, workbook }
}

export async function buildAuditWorkbook(input: ExportInput) {
  const report = await getAuditReport(input)
  const sections = input.sections

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Grassly'
  workbook.created = new Date()

  if (included(sections, 'resumen')) {
    addSummarySheet(
      workbook,
      `Reporte de auditoría — ${report.localName}`,
      [
        ['Local', report.localName],
        ['Periodo', `${report.start} a ${report.end}`],
        ['Generado', limaTimestamp()],
      ],
      [
        { label: 'Cancelaciones', value: report.totals.cancelaciones, format: INTEGER_FORMAT },
        { label: 'Rechazos de pago', value: report.totals.rechazos, format: INTEGER_FORMAT },
      ],
      AUDIT_DEFINITIONS,
    )
  }

  if (included(sections, 'incidencias')) {
    addTableSheet(
      workbook,
      'Incidencias por día',
      [
        { header: 'Fecha', width: 14, format: DATE_FORMAT },
        { header: 'Cancelaciones', width: 16, format: INTEGER_FORMAT, align: 'right' },
        { header: 'Rechazos de pago', width: 18, format: INTEGER_FORMAT, align: 'right' },
      ],
      report.series.map((point) => [toDate(point.date), point.cancelaciones, point.rechazos]),
    )
  }

  if (included(sections, 'cancelaciones')) {
    addTableSheet(
      workbook,
      'Cancelaciones',
      AUDIT_INCIDENT_COLUMNS,
      report.incidents.filter((incident) => incident.type === 'cancelacion').map(auditIncidentRow),
    )
  }

  if (included(sections, 'rechazos')) {
    addTableSheet(
      workbook,
      'Rechazos de pago',
      AUDIT_INCIDENT_COLUMNS,
      report.incidents.filter((incident) => incident.type === 'rechazo').map(auditIncidentRow),
    )
  }

  if (included(sections, 'detalle')) {
    addTableSheet(
      workbook,
      'Detalle de incidencias',
      AUDIT_INCIDENT_COLUMNS,
      report.incidents.map(auditIncidentRow),
    )
  }

  return { report, workbook }
}

export async function workbookToBuffer(workbook: ExcelJS.Workbook) {
  const data = await workbook.xlsx.writeBuffer()
  return new Uint8Array(data as ArrayBuffer)
}
