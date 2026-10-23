import 'server-only'

import ExcelJS from 'exceljs'
import { fetchCajaExport, fetchReservationsExport, getOwnerDataContext } from './queries'
import type { OwnerDataRange, ReservationExportRow, CajaExportRow } from './types'

const BRAND_LIME = 'FFC8FF00'
const BRAND_INK = 'FF1A1A1A'
const BORDER_SOFT = 'FFD1D5DB'
const MONEY_FORMAT = '"S/" #,##0.00'
const HOURS_FORMAT = '0.00'

type CellValue = string | number | null

type Column = {
  header: string
  width: number
  format?: string
  align?: 'left' | 'right' | 'center'
}

const STATUS_LABELS: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  checkout_online: 'Checkout online',
  pago_en_proceso: 'Pago en proceso',
  pendiente_validacion: 'Pendiente de validación',
  rechazada_pago: 'Pago rechazado',
  confirmada: 'Confirmada',
  completada: 'Completada',
  no_show: 'Inasistencia',
  cancelada_cliente: 'Cancelada por el cliente',
  cancelada_local: 'Cancelada por el local',
  expirada: 'Expirada',
}

const CHANNEL_LABELS: Record<string, string> = {
  app: 'App Grassly',
  whatsapp: 'WhatsApp',
  presencial: 'Presencial',
}

const REFUND_LABELS: Record<string, string> = {
  no_aplica: 'No aplica',
  solicitado: 'Solicitado',
  aprobado: 'Gestionado / aprobado',
  rechazado: 'No corresponde',
}

const REJECTION_LABELS: Record<string, string> = {
  pago_no_recibido: 'Pago no recibido',
  monto_incorrecto: 'Monto incorrecto',
  comprobante_ilegible: 'Comprobante ilegible',
  datos_no_coinciden: 'Datos no coinciden',
  otro: 'Otro',
}

const MOVEMENT_LABELS: Record<string, string> = {
  adelanto: 'Adelanto',
  saldo: 'Saldo',
  reembolso: 'Reembolso',
}

const MEDIO_LABELS: Record<string, string> = {
  mercadopago: 'Mercado Pago',
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  comprobante: 'Comprobante',
  manual: 'Registro manual',
  otro: 'Otro',
  reembolso: 'Reembolso',
}

function limaDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function limaTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function limaDateTime(value: string) {
  return `${limaDate(value)} ${limaTime(value)}`
}

function durationHours(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Number.isFinite(diff) ? Number((diff / 3_600_000).toFixed(2)) : 0
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

function addTableSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: Column[],
  rows: CellValue[][],
  total?: CellValue[],
) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.addRow(columns.map((column) => column.header))
  styleHeaderRow(sheet.getRow(1))
  for (const row of rows) sheet.addRow(row)
  if (total) {
    const totalRow = sheet.addRow(total)
    totalRow.eachCell((cell) => {
      cell.font = { bold: true }
      cell.border = { top: { style: 'thin', color: { argb: BORDER_SOFT } } }
    })
  }

  columns.forEach((column, index) => {
    const col = sheet.getColumn(index + 1)
    col.width = column.width
    if (column.format) col.numFmt = column.format
  })

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
  return sheet
}

function addSummarySheet(workbook: ExcelJS.Workbook, title: string, metadata: Array<[string, string]>, totals: Array<[string, number, string]>) {
  const sheet = workbook.addWorksheet('Resumen')
  sheet.getColumn(1).width = 34
  sheet.getColumn(2).width = 20

  const titleRow = sheet.addRow([title])
  titleRow.font = { bold: true, size: 14, color: { argb: BRAND_INK } }
  sheet.addRow([])

  for (const [label, value] of metadata) {
    const row = sheet.addRow([label, value])
    row.getCell(1).font = { bold: true }
  }

  sheet.addRow([])
  styleHeaderRow(sheet.addRow(['Indicador', 'Valor']))
  for (const [label, value, format] of totals) {
    const row = sheet.addRow([label, value])
    row.getCell(2).numFmt = format
  }
  return sheet
}

function generatedAt() {
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' }).format(new Date())
}

function reservationRow(row: ReservationExportRow): CellValue[] {
  return [
    row.reserva_id.slice(0, 8).toUpperCase(),
    limaDate(row.inicio),
    limaTime(row.inicio),
    limaTime(row.fin),
    durationHours(row.inicio, row.fin),
    row.cancha,
    row.deporte,
    row.cliente,
    row.telefono ?? '',
    STATUS_LABELS[row.estado] ?? row.estado,
    CHANNEL_LABELS[row.canal] ?? row.canal,
    row.monto_total,
    row.monto_adelanto,
    row.monto_cobrado,
    row.saldo_pendiente,
    row.monto_reembolsado,
    REFUND_LABELS[row.reembolso_resultado] ?? row.reembolso_resultado,
    row.extension_monto,
    row.tiene_comprobante ? 'Sí' : 'No',
    row.notas ?? '',
    limaDateTime(row.created_at),
    row.cancelada_at ? limaDateTime(row.cancelada_at) : '',
    row.motivo_cancelacion ?? '',
    row.motivo_rechazo ? (REJECTION_LABELS[row.motivo_rechazo] ?? row.motivo_rechazo) : '',
  ]
}

export async function buildReservationsWorkbook(range: OwnerDataRange) {
  const context = await getOwnerDataContext()
  if (!context) throw new Error('No tienes un local asociado para exportar.')

  const rows = await fetchReservationsExport(context.localId, range)
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Grassly'
  workbook.created = new Date()

  const collected = rows.reduce((sum, row) => sum + row.monto_cobrado, 0)
  const outstanding = rows.reduce((sum, row) => sum + row.saldo_pendiente, 0)
  const refunded = rows.reduce((sum, row) => sum + row.monto_reembolsado, 0)

  addSummarySheet(
    workbook,
    `Reservas — ${context.localName}`,
    [
      ['Local', context.localName],
      ['Generado', generatedAt()],
      ['Zona horaria', 'America/Lima'],
    ],
    [
      ['Reservas exportadas', rows.length, '#,##0'],
      ['Cobrado (S/)', collected, MONEY_FORMAT],
      ['Saldo pendiente (S/)', outstanding, MONEY_FORMAT],
      ['Reembolsado (S/)', refunded, MONEY_FORMAT],
    ],
  )

  addTableSheet(
    workbook,
    'Reservas',
    [
      { header: 'Reserva', width: 12 },
      { header: 'Fecha', width: 12 },
      { header: 'Hora inicio', width: 11, align: 'center' },
      { header: 'Hora fin', width: 11, align: 'center' },
      { header: 'Duración (h)', width: 11, format: HOURS_FORMAT, align: 'right' },
      { header: 'Cancha', width: 22 },
      { header: 'Deporte', width: 16 },
      { header: 'Cliente', width: 26 },
      { header: 'Teléfono', width: 16 },
      { header: 'Estado', width: 24 },
      { header: 'Canal', width: 15 },
      { header: 'Total (S/)', width: 13, format: MONEY_FORMAT, align: 'right' },
      { header: 'Adelanto (S/)', width: 14, format: MONEY_FORMAT, align: 'right' },
      { header: 'Cobrado (S/)', width: 13, format: MONEY_FORMAT, align: 'right' },
      { header: 'Saldo (S/)', width: 13, format: MONEY_FORMAT, align: 'right' },
      { header: 'Reembolsado (S/)', width: 15, format: MONEY_FORMAT, align: 'right' },
      { header: 'Reembolso', width: 20 },
      { header: 'Extensión +30 (S/)', width: 16, format: MONEY_FORMAT, align: 'right' },
      { header: 'Comprobante', width: 12 },
      { header: 'Notas', width: 36 },
      { header: 'Creada el', width: 17 },
      { header: 'Cancelada el', width: 17 },
      { header: 'Motivo cancelación', width: 30 },
      { header: 'Motivo rechazo', width: 22 },
    ],
    rows.map(reservationRow),
  )

  return { workbook, localName: context.localName, count: rows.length }
}

function cajaRow(row: CajaExportRow): CellValue[] {
  return [
    row.fecha,
    limaTime(row.created_at),
    row.cliente,
    row.cancha_nombre,
    MOVEMENT_LABELS[row.tipo] ?? row.tipo,
    MEDIO_LABELS[row.medio_tipo] ?? row.medio_tipo,
    row.monto,
    row.referencia ?? '',
    row.notas ?? '',
  ]
}

export async function buildCajaWorkbook(range: OwnerDataRange) {
  const context = await getOwnerDataContext()
  if (!context) throw new Error('No tienes un local asociado para exportar.')

  const rows = await fetchCajaExport(context.localId, range)
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Grassly'
  workbook.created = new Date()

  const collected = rows.filter((row) => row.tipo !== 'reembolso').reduce((sum, row) => sum + row.monto, 0)
  const refunded = rows.filter((row) => row.tipo === 'reembolso').reduce((sum, row) => sum + Math.abs(row.monto), 0)
  const movements = rows.filter((row) => row.tipo !== 'reembolso').length

  addSummarySheet(
    workbook,
    `Caja — ${context.localName}`,
    [
      ['Local', context.localName],
      ['Generado', generatedAt()],
      ['Zona horaria', 'America/Lima'],
    ],
    [
      ['Ingresos brutos (S/)', collected, MONEY_FORMAT],
      ['Reembolsos (S/)', refunded, MONEY_FORMAT],
      ['Neto (S/)', collected - refunded, MONEY_FORMAT],
      ['Cobros', movements, '#,##0'],
    ],
  )

  const byMethod = new Map<string, { amount: number; count: number }>()
  for (const row of rows) {
    if (row.tipo === 'reembolso') continue
    const bucket = byMethod.get(row.medio_tipo) ?? { amount: 0, count: 0 }
    bucket.amount += row.monto
    bucket.count += 1
    byMethod.set(row.medio_tipo, bucket)
  }

  addTableSheet(
    workbook,
    'Por medio',
    [
      { header: 'Medio', width: 22 },
      { header: 'Monto (S/)', width: 16, format: MONEY_FORMAT, align: 'right' },
      { header: 'Cobros', width: 12, format: '#,##0', align: 'right' },
    ],
    [...byMethod.entries()]
      .map<CellValue[]>(([medio, value]) => [MEDIO_LABELS[medio] ?? medio, value.amount, value.count])
      .sort((a, b) => Number(b[1]) - Number(a[1])),
    ['Total', collected, movements],
  )

  addTableSheet(
    workbook,
    'Movimientos',
    [
      { header: 'Fecha', width: 12 },
      { header: 'Hora', width: 8, align: 'center' },
      { header: 'Cliente', width: 26 },
      { header: 'Cancha', width: 22 },
      { header: 'Tipo', width: 12 },
      { header: 'Medio', width: 18 },
      { header: 'Monto (S/)', width: 14, format: MONEY_FORMAT, align: 'right' },
      { header: 'Referencia', width: 18 },
      { header: 'Notas', width: 36 },
    ],
    rows.map(cajaRow),
  )

  return { workbook, localName: context.localName, count: rows.length }
}

export async function workbookToBuffer(workbook: ExcelJS.Workbook) {
  const data = await workbook.xlsx.writeBuffer()
  return new Uint8Array(data as ArrayBuffer)
}
