import type {
  ReportDailyPoint,
  ReportGranularity,
  ReportSeriesPoint,
} from './types'

export const LIMA = 'America/Lima'

export function limaDate(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function todayLima() {
  return limaDate(new Date())
}

export function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function startOfWeek(value: string) {
  const date = new Date(`${value}T12:00:00Z`)
  const offset = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - offset)
  return date.toISOString().slice(0, 10)
}

export function startOfMonth(value: string) {
  return `${value.slice(0, 7)}-01`
}

export function isIsoDate(value: string | undefined | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
}

function daysInclusive(start: string, end: string) {
  const diff = Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)
  return Math.round(diff / 86_400_000) + 1
}

export function previousRange(start: string, end: string) {
  const length = daysInclusive(start, end)
  const previousEnd = shiftDate(start, -1)
  const previousStart = shiftDate(previousEnd, -(length - 1))
  return { start: previousStart, end: previousEnd }
}

export function defaultRange() {
  const end = todayLima()
  return { start: shiftDate(end, -29), end }
}

export function parseRange(range: unknown) {
  const values = String(range ?? '').match(/[\[\(]([^,]+),([^\]\)]+)[\]\)]/)
  return { start: values?.[1] ?? '', end: values?.[2] ?? '' }
}

// Extrae el límite inferior de un `tstzrange` ("[inicio, fin)") como Date.
export function parseRangeStart(range: unknown): Date | null {
  const { start } = parseRange(range)
  if (!start) return null
  const date = new Date(start)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatRangeLabel(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return `${formatter.format(new Date(`${start}T12:00:00-05:00`))} — ${formatter.format(new Date(`${end}T12:00:00-05:00`))}`
}

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA,
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${date}T12:00:00-05:00`))
}

function formatBucketLabel(key: string, granularity: ReportGranularity) {
  if (granularity === 'mes') {
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: LIMA,
      month: 'short',
      year: '2-digit',
    }).format(new Date(`${key}-01T12:00:00-05:00`))
  }
  const label = formatDayLabel(key)
  return granularity === 'semana' ? `Sem ${label}` : label
}

export function formatMethodLabel(raw: string | null | undefined) {
  const value = (raw ?? '').trim().toLowerCase()
  switch (value) {
    case 'yape':
      return 'Yape'
    case 'plin':
      return 'Plin'
    case 'transferencia':
      return 'Transferencia'
    case 'efectivo':
      return 'Efectivo'
    case 'comprobante':
      return 'Comprobante'
    case 'otro':
      return 'Otro'
    case '':
      return 'Otro'
    default:
      return value.charAt(0).toUpperCase() + value.slice(1)
  }
}

export function groupDaily(
  points: ReportDailyPoint[],
  granularity: ReportGranularity,
): ReportSeriesPoint[] {
  if (granularity === 'dia') {
    return points.map((point) => ({
      key: point.date,
      label: formatDayLabel(point.date),
      income: point.income,
      reservations: point.reservations,
    }))
  }

  const map = new Map<string, { income: number; reservations: number }>()
  for (const point of points) {
    const key = granularity === 'semana' ? startOfWeek(point.date) : point.date.slice(0, 7)
    const current = map.get(key) ?? { income: 0, reservations: 0 }
    current.income += point.income
    current.reservations += point.reservations
    map.set(key, current)
  }

  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => ({
      key,
      label: formatBucketLabel(key, granularity),
      income: value.income,
      reservations: value.reservations,
    }))
}
