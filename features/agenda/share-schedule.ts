import { getLocalMinutes, localDateTimeToIso, minutesToTime, shiftAgendaDate, timeToMinutes } from './date-utils'
import type { AgendaCourt, AgendaData, AgendaOccupation } from './types'

export type ShareAvailability = 'free' | 'busy' | 'unavailable' | 'past' | 'closed'
export type ShareColumn = { key: string; label: string; day: AgendaData; courtId: string }
export type ShareSchedule = {
  mode: 'day' | 'week'
  localName: string
  courtName?: string
  columns: ShareColumn[]
  starts: number[]
  cells: ShareAvailability[][]
  capturedAt: Date
  reservationNames: (string | undefined)[][]
  reservationKeys: (string | undefined)[][]
}

const STEP = 30

function openingRange(day: AgendaData) {
  if (!day.openingTime || !day.closingTime) return null
  const start = timeToMinutes(day.openingTime)
  let end = timeToMinutes(day.closingTime)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  if (end <= start) end += 1440
  return { start, end }
}

function occupationRange(occupation: AgendaOccupation, opening: number) {
  let start = getLocalMinutes(occupation.start)
  let end = getLocalMinutes(occupation.end)
  if (start < opening) start += 1440
  if (end <= start) end += 1440
  return { start, end }
}

function slotInstant(day: AgendaData, start: number) {
  const date = start >= 1440 ? shiftAgendaDate(day.date, 1) : day.date
  return localDateTimeToIso(date, minutesToTime(start))
}

export function buildShareSchedule({
  data,
  days,
  isWeek,
  selectedCourt,
  capturedAt,
}: {
  data: AgendaData
  days: AgendaData[]
  isWeek: boolean
  selectedCourt?: AgendaCourt
  capturedAt: Date
}): ShareSchedule {
  const columns: ShareColumn[] = isWeek
    ? selectedCourt ? days.map((day) => ({ key: day.date, label: day.date, day, courtId: selectedCourt.id })) : []
    : data.courts.map((court) => ({ key: court.id, label: court.name, day: data, courtId: court.id }))
  const ranges = columns.map((column) => openingRange(column.day)).filter((range): range is { start: number; end: number } => Boolean(range))
  const first = ranges.length ? Math.floor(Math.min(...ranges.map((range) => range.start)) / STEP) * STEP : 7 * 60
  const last = ranges.length ? Math.ceil(Math.max(...ranges.map((range) => range.end)) / STEP) * STEP : 23 * 60
  const starts = Array.from({ length: Math.ceil((last - first) / STEP) }, (_, index) => first + index * STEP)
  const cells = columns.map((column) => {
    const range = openingRange(column.day)
    const occupations = column.day.occupations
      .filter((occupation) => occupation.courtId === column.courtId)
      .map((occupation) => ({ type: occupation.type, ...occupationRange(occupation, range?.start ?? first) }))
    return starts.map((start): ShareAvailability => {
      if (!range || start < range.start || start + STEP > range.end) return 'closed'
      const instant = slotInstant(column.day, start)
      if (instant && new Date(instant).getTime() <= capturedAt.getTime()) return 'past'
      const match = occupations.find((occupation) => occupation.start < start + STEP && occupation.end > start)
      if (match) return match.type === 'mantenimiento' ? 'unavailable' : 'busy'
      return 'free'
    })
  })
  const reservations = columns.map((column) => starts.map((start, row) => {
    if (cells[columns.indexOf(column)][row] !== 'busy') return undefined
    const opening = openingRange(column.day)?.start ?? first
    return column.day.occupations.find((occupation) => {
      if (occupation.courtId !== column.courtId || occupation.type !== 'reserva') return false
      const range = occupationRange(occupation, opening)
      return range.start < start + STEP && range.end > start
    })
  }))
  const reservationNames = reservations.map((column) => column.map((reservation) => reservation?.customerName?.trim().split(/\s+/)[0] || undefined))
  const reservationKeys = reservations.map((column) => column.map((reservation) => reservation ? `${reservation.reservationId ?? ''}|${reservation.start}|${reservation.end}` : undefined))
  return { mode: isWeek ? 'week' : 'day', localName: data.localName, courtName: isWeek ? selectedCourt?.name : undefined, columns, starts, cells, capturedAt, reservationNames, reservationKeys }
}

const COLORS: Record<ShareAvailability, { fill: string; text: string; label: string }> = {
  free: { fill: '#f5faf3', text: '#315c3d', label: 'Libre' },
  busy: { fill: '#7048c4', text: '#ffffff', label: 'Ocupado' },
  unavailable: { fill: '#dfe5df', text: '#46564b', label: 'No disponible' },
  past: { fill: '#edf0ec', text: '#7a897d', label: 'Ya pasó' },
  closed: { fill: '#e9ede8', text: '#748278', label: 'Cerrado' },
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
  ctx.fill()
}

function fitText(ctx: CanvasRenderingContext2D, value: string, maxWidth: number) {
  if (ctx.measureText(value).width <= maxWidth) return value
  let text = value
  while (text.length > 1 && ctx.measureText(`${text}…`).width > maxWidth) text = text.slice(0, -1)
  return `${text}…`
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', weekday: 'short', day: '2-digit', month: 'short' })
    .format(new Date(`${date}T12:00:00Z`))
    .replaceAll('.', '')
}

function updatedLabel(date: Date) {
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(date)
    .replaceAll('.', '')
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar un recurso de marca'))
    image.src = src
  })
}

export async function renderShareSchedulePng(schedule: ShareSchedule): Promise<Blob> {
  await document.fonts.ready
  const [logo, playLogo] = await Promise.all([loadImage('/logo.png'), loadImage('/google-play-logo-nuevo.png')])
  const canvas = document.createElement('canvas')
  const width = schedule.mode === 'week' ? 1680 : Math.max(1180, 260 + schedule.columns.length * 330)
  const margin = 44
  const axisWidth = 112
  const headerHeight = 245
  const tableHeaderHeight = 72
  const rowHeight = 39
  const boardHeight = schedule.starts.length * rowHeight
  const footerTop = headerHeight + tableHeaderHeight + boardHeight + 26
  const height = footerTop + 164
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear la imagen')
  const boardX = margin + axisWidth
  const boardWidth = width - margin * 2 - axisWidth
  const columnWidth = boardWidth / Math.max(schedule.columns.length, 1)
  const boardY = headerHeight + tableHeaderHeight
  ctx.fillStyle = '#f1f4ef'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, headerHeight)
  ctx.drawImage(logo, 55, 98, 180, 180, margin, 20, 70, 70)
  ctx.fillStyle = '#203629'
  ctx.font = '800 31px Manrope, Arial, sans-serif'
  ctx.fillText('Grassly', margin + 82, 69)
  ctx.textAlign = 'right'
  ctx.font = '600 18px Manrope, Arial, sans-serif'
  ctx.fillStyle = '#596b5d'
  ctx.fillText(`Actualizado ${updatedLabel(schedule.capturedAt)}`, width - margin, 65)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#172c20'
  ctx.font = '800 49px Manrope, Arial, sans-serif'
  ctx.fillText('Horarios disponibles', margin, 140)
  roundedRect(ctx, width - margin - 166, 109, 166, 44, 22, '#c9f33d')
  ctx.fillStyle = '#203629'
  ctx.textAlign = 'center'
  ctx.font = '800 16px Manrope, Arial, sans-serif'
  ctx.fillText(schedule.mode === 'week' ? '7 DÍAS' : 'VISTA DIARIA', width - margin - 83, 137)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#506355'
  ctx.font = '600 23px Manrope, Arial, sans-serif'
  const firstDate = schedule.columns[0]?.day.date ?? ''
  const lastDate = schedule.columns.at(-1)?.day.date ?? firstDate
  const period = schedule.mode === 'week' ? `${dateLabel(firstDate)} – ${dateLabel(lastDate)}` : dateLabel(firstDate)
  ctx.fillText(fitText(ctx, [schedule.localName, schedule.courtName, period].filter(Boolean).join('  ·  '), width - margin * 2), margin, 179)
  const legend: ShareAvailability[] = ['free', 'busy', 'unavailable', 'past']
  let legendX = margin
  for (const item of legend) {
    roundedRect(ctx, legendX, 201, 14, 14, 7, item === 'free' ? '#438b4e' : COLORS[item].fill)
    ctx.fillStyle = '#405448'
    ctx.font = '600 17px Manrope, Arial, sans-serif'
    ctx.fillText(COLORS[item].label, legendX + 22, 214)
    legendX += ctx.measureText(COLORS[item].label).width + 54
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(margin, headerHeight, width - margin * 2, tableHeaderHeight)
  ctx.fillStyle = '#566c55'
  ctx.font = '800 16px Manrope, Arial, sans-serif'
  ctx.fillText('HORA', margin + 18, headerHeight + 44)
  schedule.columns.forEach((column, index) => {
    const center = boardX + index * columnWidth + columnWidth / 2
    ctx.textAlign = 'center'
    ctx.fillStyle = '#142416'
    ctx.font = '800 21px Manrope, Arial, sans-serif'
    ctx.fillText(fitText(ctx, schedule.mode === 'week' ? dateLabel(column.day.date).toUpperCase() : column.label, columnWidth - 22), center, headerHeight + 43)
  })
  ctx.textAlign = 'left'
  schedule.starts.forEach((start, row) => {
    const y = boardY + row * rowHeight
    ctx.fillStyle = '#f1f4ef'
    ctx.fillRect(margin, y, width - margin * 2, rowHeight)
    if (start % 60 === 0) {
      ctx.strokeStyle = '#e1e8df'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(width - margin, y); ctx.stroke()
    }
    ctx.fillStyle = start % 60 === 0 ? '#344b37' : '#788b79'
    ctx.font = `${start % 60 === 0 ? 800 : 600} 16px Manrope, Arial, sans-serif`
    ctx.fillText(`${minutesToTime(start)}${start >= 1440 ? ' +1' : ''}`, margin + 15, y + 25)
  })
  schedule.columns.forEach((column, index) => {
    const x = boardX + index * columnWidth
    const values = schedule.cells[index] ?? []
    for (let row = 0; row < values.length;) {
      const state = values[row]
      if (state === 'free') {
        const y = boardY + row * rowHeight
        roundedRect(ctx, x + 2, y + 1, columnWidth - 4, rowHeight - 2, 5, COLORS.free.fill)
        row++
        continue
      }
      let next = row + 1
      while (next < values.length && values[next] === state && (state !== 'busy' || schedule.reservationKeys[index][next] === schedule.reservationKeys[index][row])) next++
      const blockY = boardY + row * rowHeight + 3
      const blockHeight = (next - row) * rowHeight - 6
      const tone = COLORS[state]
      roundedRect(ctx, x + 4, blockY, columnWidth - 8, blockHeight, 12, tone.fill)
      ctx.textAlign = 'center'
      ctx.fillStyle = tone.text
      ctx.font = '800 17px Manrope, Arial, sans-serif'
      const label = state === 'busy' && schedule.reservationNames[index][row] ? schedule.reservationNames[index][row]! : tone.label
      const centerX = x + columnWidth / 2
      const centerY = blockY + blockHeight / 2
      if (blockHeight >= 74) {
        ctx.fillText(fitText(ctx, label, columnWidth - 20), centerX, centerY - 5)
        ctx.font = '600 14px Manrope, Arial, sans-serif'
        ctx.fillText(`${minutesToTime(schedule.starts[row])} – ${minutesToTime(schedule.starts[next - 1] + STEP)}`, centerX, centerY + 20)
      } else {
        ctx.fillText(fitText(ctx, label, columnWidth - 20), centerX, centerY + 6)
      }
      row = next
    }
    ctx.strokeStyle = '#e5ebe3'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, headerHeight); ctx.lineTo(x, boardY + boardHeight); ctx.stroke()
  })
  ctx.textAlign = 'left'
  ctx.strokeStyle = '#e5ebe3'
  ctx.beginPath(); ctx.moveTo(width - margin, headerHeight); ctx.lineTo(width - margin, boardY + boardHeight); ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, footerTop, width, height - footerTop)
  ctx.fillStyle = '#203629'
  ctx.font = '800 25px Manrope, Arial, sans-serif'
  ctx.fillText('Encuentra tu próxima cancha en Grassly', margin, footerTop + 58)
  ctx.fillStyle = '#526959'
  ctx.font = '600 18px Manrope, Arial, sans-serif'
  ctx.fillText('Disponibilidad al momento de esta captura. Confirma con el local antes de reservar.', margin, footerTop + 91)
  roundedRect(ctx, width - margin - 350, footerTop + 28, 350, 102, 18, '#f0ecf9')
  ctx.drawImage(playLogo, width - margin - 325, footerTop + 55, 48, 48)
  ctx.fillStyle = '#526553'
  ctx.font = '800 15px Manrope, Arial, sans-serif'
  ctx.fillText('DISPONIBLE EN', width - margin - 263, footerTop + 71)
  ctx.fillStyle = '#172b1a'
  ctx.font = '800 27px Manrope, Arial, sans-serif'
  ctx.fillText('Google Play', width - margin - 263, footerTop + 105)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo exportar la imagen')), 'image/png')
  })
}
