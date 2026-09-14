const LIMA_TIME_ZONE = 'America/Lima'

export function getTodayInLima() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function isValidAgendaDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function getDayOfWeek(value: string) {
  return new Date(`${value}T12:00:00Z`).getUTCDay()
}

export function shiftAgendaDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function getWeekStart(value: string) {
  const date = new Date(`${value}T12:00:00Z`)
  const day = date.getUTCDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  date.setUTCDate(date.getUTCDate() - daysFromMonday)
  return date.toISOString().slice(0, 10)
}

export function getWeekDates(value: string) {
  const start = getWeekStart(value)
  return Array.from({ length: 7 }, (_, index) => shiftAgendaDate(start, index))
}

export function formatAgendaDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${value}T12:00:00Z`))
}

export function formatTime(value: string) {
  return value.slice(0, 5)
}

export function getLocalMinutes(value: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LIMA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}

export function timeToMinutes(value: string) {
  const [hour = '0', minute = '0'] = value.split(':')
  return Number(hour) * 60 + Number(minute)
}

/** Converts a Lima-local date and time into an ISO instant for Supabase. */
export function localDateTimeToIso(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null
  const parsed = new Date(`${date}T${time}:00-05:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export function makeTstzRange(startIso: string, endIso: string) {
  return `[${startIso},${endIso})`
}

export function isoToLocalTime(value: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: LIMA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00'
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00'
  return `${hour}:${minute}`
}

export function minutesToTime(value: number) {
  const normalized = ((value % (24 * 60)) + 24 * 60) % (24 * 60)
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}
