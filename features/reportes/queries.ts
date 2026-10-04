import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { Enums } from '@/types/database.types'
import {
  defaultRange,
  formatMethodLabel,
  limaDate,
  parseRange,
  previousRange,
  shiftDate,
  todayLima,
} from './date-utils'
import type {
  IncomeReport,
  ReportBreakdownItem,
  ReportDailyPoint,
  ReportKpi,
} from './types'

const INCOME_STATES: Enums<'estado_reserva'>[] = ['confirmada', 'completada']
const CANCELLED_STATES: Enums<'estado_reserva'>[] = ['cancelada_cliente', 'cancelada_local']
const REPORT_STATES: Enums<'estado_reserva'>[] = [...INCOME_STATES, ...CANCELLED_STATES]
const PAGE_SIZE = 1000
const MOVEMENT_LOOKBACK_DAYS = 180

type RawReservation = {
  id: string
  cancha_id: string
  deporte_id: string
  monto_total: number
  estado: string
  reembolso_resultado: string
  rango: unknown
}

type CobroRow = {
  movimiento_id: string
  reserva_id: string
  cancha_id: string
  deporte_id: string
  fecha: string
  monto: number
  medio: string
  tipo: string
  notas: string | null
  created_at: string
}

type CobrosReader = {
  rpc: (
    functionName: 'obtener_cobros_reporte_local',
    args: { p_local_id: string; p_desde: string; p_hasta: string },
  ) => Promise<{
    data: CobroRow[] | null
    error: { code?: string; message?: string } | null
  }>
}

type CountTotals = { income: number; count: number }

function computeKpi(value: number, previous: number, goodWhenUp: boolean): ReportKpi {
  return {
    value,
    previous,
    changePct: previous === 0 ? null : ((value - previous) / previous) * 100,
    goodWhenUp,
  }
}

function buildEmptyDaily(start: string, end: string): ReportDailyPoint[] {
  const points: ReportDailyPoint[] = []
  let cursor = start
  let guard = 0
  while (cursor <= end && guard < 800) {
    points.push({ date: cursor, income: 0, reservations: 0 })
    cursor = shiftDate(cursor, 1)
    guard += 1
  }
  return points
}

function addMovement(
  map: Map<string, CountTotals>,
  key: string,
  amount: number,
) {
  const current = map.get(key) ?? { income: 0, count: 0 }
  current.income += amount
  current.count += 1
  map.set(key, current)
}

function toBreakdown(
  map: Map<string, CountTotals>,
  names: Map<string, string>,
): ReportBreakdownItem[] {
  return [...map.entries()]
    .map(([id, value]) => ({
      id,
      label: names.get(id) ?? id,
      income: value.income,
      reservations: value.count,
    }))
    .sort((a, b) => b.income - a.income)
}

async function fetchReservations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courtIds: string[],
  startIso: string,
  endIso: string,
) {
  const rows: RawReservation[] = []
  for (let page = 0; page < 50; page += 1) {
    const { data, error } = await supabase
      .from('reservas')
      .select('id,cancha_id,deporte_id,monto_total,estado,reembolso_resultado,rango')
      .in('cancha_id', courtIds)
      .in('estado', REPORT_STATES)
      .overlaps('rango', `[${startIso},${endIso})`)
      .order('id', { ascending: true })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (error) {
      console.error('[reportes:reservations]', { code: error.code, message: error.message })
      throw new Error('No se pudieron cargar las reservas para el reporte.')
    }

    rows.push(...((data ?? []) as RawReservation[]))
    if (!data || data.length < PAGE_SIZE) break
  }
  return rows
}

export async function getIncomeReport(input: {
  start?: string
  end?: string
}): Promise<IncomeReport> {
  const { local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const defaults = defaultRange()
  let start = input.start ?? defaults.start
  let end = input.end ?? defaults.end
  if (start > end) [start, end] = [end, start]
  const previous = previousRange(start, end)
  const today = todayLima()

  const base: IncomeReport = {
    localId: local.id,
    localName: local.nombre,
    start,
    end,
    today,
    totals: { income: 0, outstanding: 0, reservations: 0, averageTicket: 0 },
    kpis: {
      income: computeKpi(0, 0, true),
      outstanding: computeKpi(0, 0, false),
      reservations: computeKpi(0, 0, true),
      averageTicket: computeKpi(0, 0, true),
    },
    daily: buildEmptyDaily(start, end),
    bySport: [],
    byCourt: [],
    byMethod: [],
  }

  const { data: courtRows, error: courtsError } = await supabase
    .from('canchas')
    .select('id,nombre')
    .eq('local_id', local.id)
    .order('nombre')

  if (courtsError) {
    console.error('[reportes:courts]', { code: courtsError.code })
    throw new Error('No se pudieron cargar las canchas del local.')
  }

  const courts = courtRows ?? []
  if (!courts.length) return base

  const courtIds = courts.map((court) => court.id)
  const startIso = `${previous.start}T00:00:00-05:00`
  const endIso = `${shiftDate(end, 1)}T00:00:00-05:00`
  const movementStart = shiftDate(start, -MOVEMENT_LOOKBACK_DAYS)

  const reader = supabase as unknown as CobrosReader
  const [{ data: movementRows, error: movementsError }, rows] = await Promise.all([
    reader.rpc('obtener_cobros_reporte_local', {
      p_local_id: local.id,
      p_desde: movementStart,
      p_hasta: end,
    }),
    fetchReservations(supabase, courtIds, startIso, endIso),
  ])

  if (movementsError) {
    console.error('[reportes:movements]', { code: movementsError.code, message: movementsError.message })
    throw new Error('No se pudieron cargar los cobros para el reporte.')
  }

  const movements = (movementRows ?? []).map((row) => ({
    ...row,
    amount: Number(row.monto) || 0,
    method: (row.medio ?? '').trim().toLowerCase() || 'otro',
  }))

  const sportIds = new Set<string>()
  for (const row of rows) sportIds.add(row.deporte_id)
  for (const movement of movements) {
    if (movement.deporte_id) sportIds.add(movement.deporte_id)
  }
  const sportNames = new Map<string, string>()
  if (sportIds.size) {
    const { data: sportRows, error: sportsError } = await supabase
      .from('deportes')
      .select('id,nombre')
      .in('id', [...sportIds])
    if (sportsError) {
      console.error('[reportes:sports]', { code: sportsError.code })
      throw new Error('No se pudieron cargar los deportes del reporte.')
    }
    for (const sport of sportRows ?? []) sportNames.set(sport.id, sport.nombre)
  }

  const courtNames = new Map(courts.map((court) => [court.id, court.nombre]))
  const methodNames = new Map<string, string>()

  const paidTotal = new Map<string, number>()
  const paidAsOfPrev = new Map<string, number>()
  const periodTotals = new Map<string, { id: string; total: number; date: string }>()
  const prevTotals = new Map<string, { id: string; total: number; date: string }>()
  // Reservas canceladas con devolución aprobada: su dinero ya no es ingreso.
  const refundedIds = new Set<string>()

  for (const row of rows) {
    if (row.reembolso_resultado === 'aprobado') refundedIds.add(row.id)
    if (!(INCOME_STATES as string[]).includes(row.estado)) continue
    const { start: rawStart } = parseRange(row.rango)
    if (!rawStart) continue
    const date = limaDate(rawStart)
    const total = Number(row.monto_total) || 0
    const info = { id: row.id, total, date }
    if (date >= start && date <= end) periodTotals.set(row.id, info)
    else if (date >= previous.start && date <= previous.end) prevTotals.set(row.id, info)
  }

  for (const movement of movements) {
    if (refundedIds.has(movement.reserva_id)) continue
    paidTotal.set(movement.reserva_id, (paidTotal.get(movement.reserva_id) ?? 0) + movement.amount)
    if (movement.fecha <= previous.end) {
      paidAsOfPrev.set(movement.reserva_id, (paidAsOfPrev.get(movement.reserva_id) ?? 0) + movement.amount)
    }
    if (!methodNames.has(movement.method)) {
      methodNames.set(movement.method, formatMethodLabel(movement.method))
    }
  }

  const dailyMap = new Map<string, CountTotals>()
  const sportCash = new Map<string, { income: number; reservations: Set<string> }>()
  const courtCash = new Map<string, { income: number; reservations: Set<string> }>()
  const methodCash = new Map<string, CountTotals>()
  let collected = 0
  let collectedPrev = 0

  for (const movement of movements) {
    if (refundedIds.has(movement.reserva_id)) continue
    if (movement.fecha >= start && movement.fecha <= end) {
      collected += movement.amount
      addMovement(dailyMap, movement.fecha, movement.amount)
      addMovement(methodCash, movement.method, movement.amount)

      const sport = sportCash.get(movement.deporte_id) ?? { income: 0, reservations: new Set<string>() }
      sport.income += movement.amount
      sport.reservations.add(movement.reserva_id)
      sportCash.set(movement.deporte_id, sport)

      const court = courtCash.get(movement.cancha_id) ?? { income: 0, reservations: new Set<string>() }
      court.income += movement.amount
      court.reservations.add(movement.reserva_id)
      courtCash.set(movement.cancha_id, court)
    } else if (movement.fecha >= previous.start && movement.fecha <= previous.end) {
      collectedPrev += movement.amount
    }
  }

  let outstanding = 0
  for (const reservation of periodTotals.values()) {
    outstanding += Math.max(0, reservation.total - (paidTotal.get(reservation.id) ?? 0))
  }
  let outstandingPrev = 0
  for (const reservation of prevTotals.values()) {
    outstandingPrev += Math.max(0, reservation.total - (paidAsOfPrev.get(reservation.id) ?? 0))
  }

  const reservations = periodTotals.size
  const reservationsPrev = prevTotals.size
  const averageTicket = reservations ? collected / reservations : 0
  const averageTicketPrev = reservationsPrev ? collectedPrev / reservationsPrev : 0

  const daily = buildEmptyDaily(start, end).map((point) => {
    const bucket = dailyMap.get(point.date)
    return bucket
      ? { ...point, income: bucket.income, reservations: bucket.count }
      : point
  })

  const bySport: ReportBreakdownItem[] = [...sportCash.entries()]
    .map(([id, value]) => ({
      id,
      label: sportNames.get(id) ?? 'Sin nombre',
      income: value.income,
      reservations: value.reservations.size,
    }))
    .sort((a, b) => b.income - a.income)

  const byCourt: ReportBreakdownItem[] = [...courtCash.entries()]
    .map(([id, value]) => ({
      id,
      label: courtNames.get(id) ?? 'Sin nombre',
      income: value.income,
      reservations: value.reservations.size,
    }))
    .sort((a, b) => b.income - a.income)

  return {
    ...base,
    totals: {
      income: collected,
      outstanding,
      reservations,
      averageTicket,
    },
    kpis: {
      income: computeKpi(collected, collectedPrev, true),
      outstanding: computeKpi(outstanding, outstandingPrev, false),
      reservations: computeKpi(reservations, reservationsPrev, true),
      averageTicket: computeKpi(averageTicket, averageTicketPrev, true),
    },
    daily,
    bySport,
    byCourt,
    byMethod: toBreakdown(methodCash, methodNames),
  }
}
