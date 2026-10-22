import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { getCajaReport } from '@/features/caja/queries'
import { getIncomeReport } from '@/features/reportes/queries'
import {
  parseRange,
  shiftDate,
  startOfMonth,
  todayLima,
} from '@/features/reportes/date-utils'
import { getDayOfWeek, timeToMinutes } from '@/features/agenda/date-utils'
import type { ReservationChannel, ReservationStatus } from '@/features/reservations/types'
import type {
  DashboardMonthPoint,
  DashboardReservation,
  OwnerDashboardData,
} from './types'

const LIMA = 'America/Lima'
const PAGE_SIZE = 1000
const MAX_PAGES = 50
const LAST_14_DAYS = 14

const OCCUPYING_STATES = new Set<ReservationStatus>([
  'pendiente_validacion',
  'pago_en_proceso',
  'confirmada',
  'completada',
  'no_show',
])

const NON_BOOKED_STATES = new Set<ReservationStatus>([
  'cancelada_cliente',
  'cancelada_local',
  'expirada',
  'rechazada_pago',
])

type ScheduleRow = {
  dia_semana: number
  hora_apertura: string
  hora_cierre: string
}

type AgendaRow = {
  reserva_id: string
  cancha_id: string
  deporte_id: string
  inicio: string
  fin: string
  estado: ReservationStatus
  cliente_nombre: string | null
  cliente_telefono: string | null
  es_excepcion_horaria: boolean
  comprobante_url: string | null
  comprobante_subido_at: string | null
  monto_total: number
  monto_adelanto_requerido: number
  canal_origen: ReservationChannel
  notas: string | null
  monto_cobrado: number
  monto_reembolsado: number
  saldo_pendiente: number
}

type PendingReservationRow = {
  id: string
  cancha_id: string
  deporte_id: string
  estado: ReservationStatus
  canal_origen: ReservationChannel
  monto_total: number
  monto_adelanto_requerido: number
  rango: unknown
  cliente_id: string | null
  cliente_sin_cuenta_nombre: string | null
  comprobante_subido_at: string | null
}

type MonthReservationRow = {
  id: string
  cancha_id: string
  deporte_id: string
  estado: ReservationStatus
  canal_origen: ReservationChannel
  monto_total: number
  rango: unknown
  cliente_id: string | null
  cliente_sin_cuenta_telefono: string | null
  created_at: string
}

type CourtRow = {
  id: string
  nombre: string
  activa: boolean
  cancha_deportes: Array<{
    deporte_id: string
    deportes: { id: string; nombre: string } | null
  }>
}

function normalizeMoney(value: number | null | undefined) {
  return Math.max(0, Number(value) || 0)
}

function overlapHours(startIso: string, endIso: string, windowStart: number, windowEnd: number) {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
  return Math.max(0, Math.min(end, windowEnd) - Math.max(start, windowStart)) / 3_600_000
}

function hoursForDate(
  date: string,
  schedules: Map<number, { open: number; close: number }>,
  courtCount: number,
) {
  if (!courtCount) return 0
  const schedule = schedules.get(getDayOfWeek(date))
  if (!schedule) return 0
  const open = schedule.open
  const close = schedule.close <= open ? schedule.close + 24 * 60 : schedule.close
  return Math.max(0, (close - open) / 60) * courtCount
}

function hoursForRange(
  start: string,
  end: string,
  schedules: Map<number, { open: number; close: number }>,
  courtCount: number,
) {
  let total = 0
  let cursor = start
  let guard = 0
  while (cursor <= end && guard < 800) {
    total += hoursForDate(cursor, schedules, courtCount)
    cursor = shiftDate(cursor, 1)
    guard += 1
  }
  return total
}

function buildSchedules(rows: ScheduleRow[]) {
  const map = new Map<number, { open: number; close: number }>()
  for (const row of rows) {
    map.set(row.dia_semana, {
      open: timeToMinutes(row.hora_apertura),
      close: timeToMinutes(row.hora_cierre),
    })
  }
  return map
}

function formatWeekday(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA,
    weekday: 'short',
  }).format(new Date(`${date}T12:00:00-05:00`)).replace('.', '')
}

function formatDayNumber(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA,
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00-05:00`))
}

function formatMonthLabel(date: string) {
  const label = new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA,
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00-05:00`))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function mapAgendaReservation(
  row: AgendaRow,
  courtNames: Map<string, string>,
  sportNames: Map<string, string>,
): DashboardReservation {
  return {
    id: row.reserva_id,
    courtId: row.cancha_id,
    courtName: courtNames.get(row.cancha_id) ?? 'Cancha',
    sportName: sportNames.get(row.deporte_id) ?? 'Deporte',
    customerName: row.cliente_nombre?.trim() || 'Cliente',
    start: row.inicio,
    end: row.fin,
    status: row.estado,
    channel: row.canal_origen,
    totalAmount: Number(row.monto_total) || 0,
    advanceAmount: Number(row.monto_adelanto_requerido) || 0,
    paidAmount: Number(row.monto_cobrado) || 0,
    outstandingAmount: normalizeMoney(row.saldo_pendiente),
    proofUploadedAt: row.comprobante_subido_at,
    isException: row.es_excepcion_horaria,
  }
}

async function fetchPendingValidations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courtIds: string[],
): Promise<{ rows: PendingReservationRow[]; count: number }> {
  if (!courtIds.length) return { rows: [], count: 0 }

  const { data, count, error } = await supabase
    .from('reservas')
    .select(
      'id,cancha_id,deporte_id,estado,canal_origen,monto_total,monto_adelanto_requerido,rango,cliente_id,cliente_sin_cuenta_nombre,comprobante_subido_at',
      { count: 'exact' },
    )
    .in('cancha_id', courtIds)
    .eq('estado', 'pendiente_validacion')
    .order('comprobante_subido_at', { ascending: true })
    .limit(5)

  if (error) {
    console.error('[owner-dashboard:pending]', { code: error.code, message: error.message })
    throw new Error('No se pudieron cargar los comprobantes pendientes.')
  }

  return { rows: (data ?? []) as PendingReservationRow[], count: count ?? 0 }
}

async function fetchMonthReservations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courtIds: string[],
  startIso: string,
  endIso: string,
): Promise<MonthReservationRow[]> {
  if (!courtIds.length) return []

  const rows: MonthReservationRow[] = []
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('reservas')
      .select(
        'id,cancha_id,deporte_id,estado,canal_origen,monto_total,rango,cliente_id,cliente_sin_cuenta_telefono,created_at',
      )
      .in('cancha_id', courtIds)
      .overlaps('rango', `[${startIso},${endIso})`)
      .order('created_at', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('[owner-dashboard:month]', { code: error.code, message: error.message })
      throw new Error('No se pudieron cargar las reservas del mes.')
    }

    rows.push(...((data ?? []) as MonthReservationRow[]))
    if (!data || data.length < PAGE_SIZE) break
  }

  return rows
}

export async function getOwnerDashboardData(): Promise<OwnerDashboardData> {
  const { context, local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const today = todayLima()
  const monthStart = startOfMonth(today)
  const last14Start = shiftDate(today, -(LAST_14_DAYS - 1))
  const queryStart = monthStart < last14Start ? monthStart : last14Start
  const tomorrow = shiftDate(today, 1)
  const nextDates = Array.from({ length: 7 }, (_, index) => shiftDate(today, index))

  const [courtsResult, scheduleResult, caja, income] = await Promise.all([
    supabase
      .from('canchas')
      .select('id,nombre,activa,cancha_deportes(deporte_id,deportes(id,nombre))')
      .eq('local_id', local.id)
      .order('created_at'),
    supabase
      .from('horarios_atencion')
      .select('dia_semana,hora_apertura,hora_cierre')
      .eq('local_id', local.id),
    getCajaReport({ start: today, end: today }),
    getIncomeReport({ start: monthStart, end: today }),
  ])

  if (courtsResult.error) {
    console.error('[owner-dashboard:courts]', {
      code: courtsResult.error.code,
      message: courtsResult.error.message,
    })
    throw new Error('No se pudieron cargar las canchas del local.')
  }

  if (scheduleResult.error) {
    console.error('[owner-dashboard:schedules]', {
      code: scheduleResult.error.code,
      message: scheduleResult.error.message,
    })
    throw new Error('No se pudieron cargar los horarios del local.')
  }

  const courts = (courtsResult.data ?? []) as unknown as CourtRow[]
  const schedules = buildSchedules((scheduleResult.data ?? []) as ScheduleRow[])
  const activeCourts = courts.filter((court) => court.activa).length
  const courtIds = courts.map((court) => court.id)
  const courtNames = new Map(courts.map((court) => [court.id, court.nombre]))
  const sportNames = new Map<string, string>()
  for (const court of courts) {
    for (const relation of court.cancha_deportes ?? []) {
      if (relation.deportes) sportNames.set(relation.deporte_id, relation.deportes.nombre)
    }
  }

  const [pendingResult, monthRows, notificationsResult, ...agendaResults] = await Promise.all([
    fetchPendingValidations(supabase, courtIds),
    fetchMonthReservations(
      supabase,
      courtIds,
      `${queryStart}T00:00:00-05:00`,
      `${tomorrow}T00:00:00-05:00`,
    ),
    supabase
      .from('notificaciones')
      .select('id', { count: 'exact', head: true })
      .eq('destinatario_id', context.userId)
      .is('leida_at', null)
      .in('tipo', ['reserva_pendiente_validacion', 'moderacion_local']),
    ...nextDates.map((date) =>
      supabase.rpc('obtener_reservas_agenda_dueno', {
        p_local_id: local.id,
        p_fecha: date,
      }),
    ),
  ])

  const agendaError = agendaResults.find((result) => result.error)?.error
  if (agendaError) {
    console.error('[owner-dashboard:agenda]', {
      code: agendaError.code,
      message: agendaError.message,
    })
    throw new Error('No se pudo cargar la agenda de los próximos días.')
  }

  if (notificationsResult.error) {
    console.warn('[owner-dashboard:notifications]', {
      code: notificationsResult.error.code,
    })
  }

  const agendaByDate = new Map<string, AgendaRow[]>()
  nextDates.forEach((date, index) => {
    agendaByDate.set(date, ((agendaResults[index]?.data ?? []) as AgendaRow[]))
  })

  const todayRows = agendaByDate.get(today) ?? []
  const allAgendaRows = nextDates.flatMap((date) => agendaByDate.get(date) ?? [])
  const now = Date.now()
  const nextRpcReservation = [...allAgendaRows]
    .filter((row) => new Date(row.fin).getTime() > now)
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())[0]

  const todayWindowStart = new Date(`${today}T00:00:00-05:00`).getTime()
  const tomorrowWindowStart = new Date(`${tomorrow}T00:00:00-05:00`).getTime()
  const todayAvailableHours = hoursForDate(today, schedules, activeCourts)
  const todaySoldHours = todayRows.reduce(
    (total, row) => total + overlapHours(row.inicio, row.fin, todayWindowStart, tomorrowWindowStart),
    0,
  )

  const pendingRows = pendingResult.rows
  const pendingCustomerNames = new Map<string, string>()
  if (pendingRows.length) {
    const { data: customers, error } = await supabase.rpc('obtener_clientes_reservas_dueno', {
      p_local_id: local.id,
      p_reserva_ids: pendingRows.map((row) => row.id),
    })
    if (error) {
      console.warn('[owner-dashboard:pending-customers]', { code: error.code })
    }
    for (const customer of customers ?? []) {
      if (customer.cliente_nombre) pendingCustomerNames.set(customer.reserva_id, customer.cliente_nombre)
    }
  }

  const pendingValidations = pendingRows.map((row): DashboardReservation => {
    const { start, end } = parseRange(row.rango)
    return {
      id: row.id,
      courtId: row.cancha_id,
      courtName: courtNames.get(row.cancha_id) ?? 'Cancha',
      sportName: sportNames.get(row.deporte_id) ?? 'Deporte',
      customerName:
        pendingCustomerNames.get(row.id)?.trim() ||
        row.cliente_sin_cuenta_nombre?.trim() ||
        'Cliente',
      start,
      end,
      status: row.estado,
      channel: row.canal_origen,
      totalAmount: Number(row.monto_total) || 0,
      advanceAmount: Number(row.monto_adelanto_requerido) || 0,
      paidAmount: 0,
      outstandingAmount: Number(row.monto_total) || 0,
      proofUploadedAt: row.comprobante_subido_at,
      isException: false,
    }
  })

  const nextDays = nextDates.map((date) => {
    const rows = agendaByDate.get(date) ?? []
    const dayStart = new Date(`${date}T00:00:00-05:00`).getTime()
    const dayEnd = new Date(`${shiftDate(date, 1)}T00:00:00-05:00`).getTime()
    return {
      date,
      weekday: formatWeekday(date),
      dayNumber: formatDayNumber(date),
      isToday: date === today,
      reservations: rows.length,
      soldHours: rows.reduce(
        (total, row) => total + overlapHours(row.inicio, row.fin, dayStart, dayEnd),
        0,
      ),
      pendingValidation: rows.filter((row) => row.estado === 'pendiente_validacion').length,
    }
  })

  const monthWindowStart = new Date(`${monthStart}T00:00:00-05:00`).getTime()
  const last14WindowStart = new Date(`${last14Start}T00:00:00-05:00`).getTime()
  const monthRowsWithDates = monthRows.map((row) => {
    const { start, end } = parseRange(row.rango)
    return { row, startMs: new Date(start).getTime(), startIso: start, endIso: end }
  })

  const monthOccupyingRows = monthRowsWithDates.filter(
    ({ row, startMs }) =>
      startMs >= monthWindowStart &&
      startMs < tomorrowWindowStart &&
      OCCUPYING_STATES.has(row.estado),
  )
  const monthSoldHours = monthOccupyingRows.reduce(
    (total, row) => total + overlapHours(row.startIso, row.endIso, monthWindowStart, tomorrowWindowStart),
    0,
  )
  const monthAvailableHours = hoursForRange(monthStart, today, schedules, activeCourts)

  const monthBookedRows = monthRowsWithDates.filter(
    ({ row, startMs }) =>
      startMs >= monthWindowStart &&
      startMs < tomorrowWindowStart &&
      !NON_BOOKED_STATES.has(row.estado),
  )
  const completedRows = monthBookedRows.filter(({ row }) => row.estado === 'completada')
  const noShowRows = monthBookedRows.filter(({ row }) => row.estado === 'no_show')
  const noShowBase = completedRows.length + noShowRows.length
  const appReservations = monthBookedRows.filter(({ row }) => row.canal_origen === 'app').length
  const manualReservations = monthBookedRows.length - appReservations

  const clientReservationCount = new Map<string, number>()
  for (const { row, startMs } of monthRowsWithDates) {
    if (startMs < last14WindowStart || startMs >= tomorrowWindowStart) continue
    if (NON_BOOKED_STATES.has(row.estado)) continue
    const key = row.cliente_id ?? row.cliente_sin_cuenta_telefono?.trim()
    if (!key) continue
    clientReservationCount.set(key, (clientReservationCount.get(key) ?? 0) + 1)
  }
  const recurringClients = [...clientReservationCount.values()].filter((count) => count >= 2).length

  const daily: DashboardMonthPoint[] = income.daily.map((point) => ({
    date: point.date,
    label: new Intl.DateTimeFormat('es-PE', {
      timeZone: LIMA,
      day: 'numeric',
    }).format(new Date(`${point.date}T12:00:00-05:00`)),
    income: point.income,
    movements: point.movements,
  }))

  const todayOutstanding = todayRows.reduce(
    (total, row) => total + normalizeMoney(row.saldo_pendiente),
    0,
  )

  const occupancyRate = (sold: number, available: number) =>
    available > 0 ? Math.min(100, (sold / available) * 100) : 0

  return {
    localId: local.id,
    localName: local.nombre,
    today,
    todaySummary: {
      reservations: todayRows.length,
      confirmed: todayRows.filter((row) => row.estado === 'confirmada').length,
      pendingValidation: todayRows.filter((row) => row.estado === 'pendiente_validacion').length,
      pendingPayment: todayRows.filter((row) =>
        ['pendiente_pago', 'checkout_online', 'pago_en_proceso'].includes(row.estado),
      ).length,
      soldHours: todaySoldHours,
      availableHours: todayAvailableHours,
      occupancyRate: occupancyRate(todaySoldHours, todayAvailableHours),
      collected: caja.totals.collected,
      collectedNet: caja.totals.neto,
      collectedCount: caja.totals.count,
      outstanding: todayOutstanding,
      activeCourts,
      nextReservation: nextRpcReservation
        ? mapAgendaReservation(nextRpcReservation, courtNames, sportNames)
        : null,
    },
    pendingValidations,
    pendingValidationCount: pendingResult.count,
    nextDays,
    month: {
      label: formatMonthLabel(today),
      collected: income.totals.income,
      outstanding: income.totals.outstanding,
      reservations: income.totals.reservations,
      averageTicket: income.totals.averageTicket,
      noShowCount: noShowRows.length,
      noShowRate: noShowBase > 0 ? (noShowRows.length / noShowBase) * 100 : 0,
      recurringClients,
      soldHours: monthSoldHours,
      availableHours: monthAvailableHours,
      occupancyRate: occupancyRate(monthSoldHours, monthAvailableHours),
      appReservations,
      manualReservations,
      daily,
    },
    unreadNotifications: notificationsResult.count ?? 0,
  }
}
