import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { Enums } from '@/types/database.types'
import { defaultRange, limaDate, shiftDate, todayLima } from './date-utils'
import type {
  ChannelOriginItem,
  OperativeCourtSportRow,
  OperativeHeatmap,
  OperativeHourPoint,
  OperativeReport,
  OperativeSportItem,
  OperativeSportSeries,
  OperativeWeekdayPoint,
} from './types'

const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const OCCUPIED_STATES: Enums<'estado_reserva'>[] = ['confirmada', 'completada']
const CHANNEL_FILLS = { app: 'var(--chart-1)', manual: 'var(--chart-2)' }

type ScheduleRow = {
  dia_semana: number
  hora_apertura: string
  hora_cierre: string
}

function hourOf(value: string): number | null {
  const hour = Number.parseInt(String(value ?? '').split(':')[0] ?? '', 10)
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null
  return hour
}

function isoWeekday(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay()
  return ((day + 6) % 7) + 1
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

function limaHourOfIso(iso: string): number | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const hour = Number.parseInt(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(date),
    10,
  )
  return Number.isFinite(hour) ? hour : null
}

function durationHours(start: string, end: string) {
  const from = new Date(start).getTime()
  const to = new Date(end).getTime()
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0
  return (to - from) / 3_600_000
}

function buildOpenHours(rows: ScheduleRow[]) {
  const open = new Set<number>()
  for (const row of rows) {
    const from = hourOf(row.hora_apertura)
    let to = hourOf(row.hora_cierre)
    if (from === null || to === null) continue
    if (to <= from) to += 24
    for (let hour = from; hour < to; hour += 1) open.add(((hour % 24) + 24) % 24)
  }
  return open
}

// Reduce del canal de origen: agrupa 'app'/'web' como automático y el resto
// ('whatsapp', 'presencial') como manual (recepción).
function groupByChannel(rows: { canal_origen: string | null }[]): ChannelOriginItem[] {
  const counts = rows.reduce(
    (acc, row) => {
      const channel = (row.canal_origen ?? '').trim().toLowerCase()
      if (channel === 'app' || channel === 'web') acc.app += 1
      else acc.manual += 1
      return acc
    },
    { app: 0, manual: 0 },
  )

  const result: ChannelOriginItem[] = []
  if (counts.app > 0) {
    result.push({ name: 'App Grassly', value: counts.app, fill: CHANNEL_FILLS.app })
  }
  if (counts.manual > 0) {
    result.push({ name: 'Manual (Recepción)', value: counts.manual, fill: CHANNEL_FILLS.manual })
  }
  return result
}

// Matriz día × hora: values[dia][hora] = cantidad de reservas que iniciaron ahí.
// El índice de día es 0=Lunes … 6=Domingo; la columna se deriva de la hora.
function procesarHeatmap(
  reservations: { inicio: string }[],
  horaApertura: number,
  horaCierre: number,
): number[][] {
  const width = horaCierre - horaApertura + 1
  const matrix = Array.from({ length: 7 }, () => new Array<number>(width).fill(0))
  for (const reservation of reservations) {
    const weekday = isoWeekday(limaDate(reservation.inicio)) - 1
    const hour = limaHourOfIso(reservation.inicio)
    if (hour === null) continue
    const column = hour - horaApertura
    if (column < 0 || column >= width) continue
    matrix[weekday][column] += 1
  }
  return matrix
}

export async function getOperativeReport(input: {
  start?: string
  end?: string
}): Promise<OperativeReport> {
  const { local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const defaults = defaultRange()
  let start = input.start ?? defaults.start
  let end = input.end ?? defaults.end
  if (start > end) [start, end] = [end, start]
  const today = todayLima()

  const base: OperativeReport = {
    localId: local.id,
    localName: local.nombre,
    start,
    end,
    today,
    totals: { reservations: 0, hours: 0 },
    insights: { busiestDay: null, quietestDay: null, peakHour: null, deadHour: null },
    byWeekday: [],
    hourly: [],
    heatmap: { weekdays: WEEKDAY_LABELS, hours: [], values: [] },
    bySport: [],
    sports: [],
    byCourtSport: [],
    byChannel: [],
  }

  const [{ data: rows, error }, { data: scheduleRows }, { data: courtIdRows }] = await Promise.all([
    supabase.rpc('obtener_reservas_local', {
      p_local_id: local.id,
      p_desde: start,
      p_hasta: end,
    }),
    supabase
      .from('horarios_atencion')
      .select('dia_semana,hora_apertura,hora_cierre')
      .eq('local_id', local.id),
    supabase.from('canchas').select('id').eq('local_id', local.id),
  ])

  if (error) {
    console.error('[reportes-operativo:rows]', error)
    throw new Error(error.message ?? 'No se pudieron cargar las reservas para el reporte operativo.')
  }

  // La RPC incluye bloqueos de mantenimiento; solo contamos reservas.
  const reservations = (rows ?? []).filter((row) => row.tipo === 'reserva')
  if (!reservations.length) return base

  // El canal de origen no lo devuelve la RPC, así que se lee aparte de reservas.
  const courtIds = (courtIdRows ?? []).map((court) => court.id)
  const startIso = `${start}T00:00:00-05:00`
  const endIso = `${shiftDate(end, 1)}T00:00:00-05:00`
  const { data: channelRows } = courtIds.length
    ? await supabase
        .from('reservas')
        .select('canal_origen')
        .in('cancha_id', courtIds)
        .in('estado', OCCUPIED_STATES)
        .overlaps('rango', `[${startIso},${endIso})`)
    : { data: [] as { canal_origen: string | null }[] }
  const byChannel = groupByChannel(channelRows ?? [])

  const weekdayCount = new Map<number, number>()
  const hourCount = new Map<number, number>()
  const sportMap = new Map<string, { hours: number; reservations: number; label: string }>()
  const courtSportHours = new Map<string, { label: string; sports: Map<string, number> }>()
  let hours = 0

  for (const row of reservations) {
    const duration = durationHours(row.inicio, row.fin)
    hours += duration

    const weekday = isoWeekday(limaDate(row.inicio))
    weekdayCount.set(weekday, (weekdayCount.get(weekday) ?? 0) + 1)

    const hour = limaHourOfIso(row.inicio)
    if (hour !== null) hourCount.set(hour, (hourCount.get(hour) ?? 0) + 1)

    const sport = sportMap.get(row.deporte_id) ?? {
      hours: 0,
      reservations: 0,
      label: row.deporte_nombre || 'Sin nombre',
    }
    sport.hours += duration
    sport.reservations += 1
    sportMap.set(row.deporte_id, sport)

    const court = courtSportHours.get(row.cancha_id) ?? {
      label: row.cancha_nombre || 'Sin nombre',
      sports: new Map<string, number>(),
    }
    // Se suman HORAS (duración) por deporte dentro de cada cancha, no el conteo.
    court.sports.set(row.deporte_id, (court.sports.get(row.deporte_id) ?? 0) + duration)
    courtSportHours.set(row.cancha_id, court)
  }

  const occurringWeekdays = new Set<number>()
  let cursor = start
  let guard = 0
  while (cursor <= end && guard < 800) {
    occurringWeekdays.add(isoWeekday(cursor))
    cursor = shiftDate(cursor, 1)
    guard += 1
  }

  const byWeekday: OperativeWeekdayPoint[] = [...occurringWeekdays]
    .sort((a, b) => a - b)
    .map((weekday) => ({
      weekday,
      label: WEEKDAY_LABELS[weekday - 1],
      reservations: weekdayCount.get(weekday) ?? 0,
    }))

  // Horas consecutivas: unimos la ventana de apertura del local con las horas
  // que tuvieron reservas para que los valles (horas muertas) sean visibles.
  const openHours = buildOpenHours((scheduleRows ?? []) as ScheduleRow[])
  const hourCandidates = new Set<number>([...openHours, ...hourCount.keys()])
  const hourly: OperativeHourPoint[] = []
  let heatmap: OperativeHeatmap = { weekdays: WEEKDAY_LABELS, hours: [], values: [] }
  if (hourCandidates.size) {
    const min = Math.min(...hourCandidates)
    const max = Math.max(...hourCandidates)
    for (let hour = min; hour <= max; hour += 1) {
      hourly.push({ hour: hourLabel(hour), label: hourLabel(hour), reservations: hourCount.get(hour) ?? 0 })
    }
    heatmap = {
      weekdays: WEEKDAY_LABELS,
      hours: hourly.map((point) => point.hour),
      values: procesarHeatmap(reservations, min, max),
    }
  }

  const busiest = byWeekday.reduce<OperativeWeekdayPoint | null>(
    (best, point) => (!best || point.reservations > best.reservations ? point : best),
    null,
  )
  const quietest = byWeekday.reduce<OperativeWeekdayPoint | null>(
    (worst, point) => (!worst || point.reservations < worst.reservations ? point : worst),
    null,
  )
  const peak = hourly.reduce<OperativeHourPoint | null>(
    (best, point) => (!best || point.reservations > best.reservations ? point : best),
    null,
  )

  const deadCandidates = openHours.size ? [...openHours] : hourly.map((point) => Number(point.hour.slice(0, 2)))
  let deadHour: OperativeHourPoint | null = null
  for (const hour of deadCandidates) {
    const count = hourCount.get(hour) ?? 0
    if (
      !deadHour ||
      count < deadHour.reservations ||
      (count === deadHour.reservations && hourLabel(hour) < deadHour.hour)
    ) {
      deadHour = { hour: hourLabel(hour), label: hourLabel(hour), reservations: count }
    }
  }

  const bySport: OperativeSportItem[] = [...sportMap.entries()]
    .map(([id, value]) => ({
      id,
      label: value.label,
      reservations: value.reservations,
      hours: value.hours,
    }))
    .sort((a, b) => b.reservations - a.reservations)

  const sports: OperativeSportSeries[] = [...sportMap.entries()]
    .sort(([, a], [, b]) => b.hours - a.hours)
    .map(([id, value]) => ({ id, label: value.label }))

  const byCourtSport: OperativeCourtSportRow[] = [...courtSportHours.entries()]
    .map(([courtId, court]) => {
      const values: Record<string, number> = {}
      let total = 0
      for (const [sportId, sportHours] of court.sports) {
        values[sportId] = sportHours
        total += sportHours
      }
      return { id: courtId, label: court.label, values, total }
    })
    .sort((a, b) => b.total - a.total)
    .map(({ id, label, values }) => ({ id, label, values }))

  return {
    ...base,
    totals: { reservations: reservations.length, hours },
    insights: {
      busiestDay: busiest ? { label: busiest.label, detail: `${busiest.reservations} reservas` } : null,
      quietestDay: quietest ? { label: quietest.label, detail: `${quietest.reservations} reservas` } : null,
      peakHour: peak ? { label: peak.label, detail: `${peak.reservations} reservas` } : null,
      deadHour: deadHour ? { label: deadHour.hour, detail: `${deadHour.reservations} reservas` } : null,
    },
    byWeekday,
    hourly,
    heatmap,
    bySport,
    sports,
    byCourtSport,
    byChannel,
  }
}
