import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { Enums } from '@/types/database.types'
import { defaultRange, limaDate, parseRange, previousRange, shiftDate, todayLima } from './date-utils'
import type {
  AuditBreakdownItem,
  AuditIncident,
  AuditReport,
  AuditSeriesPoint,
  ReportKpi,
} from './types'

const PAGE_SIZE = 1000
const MAX_PAGES = 50
const CANCEL_STATES: Enums<'estado_reserva'>[] = ['cancelada_cliente', 'cancelada_local']

const REJECTION_REASON_LABELS: Record<string, string> = {
  pago_no_recibido: 'Pago no recibido',
  monto_incorrecto: 'Monto incorrecto',
  comprobante_ilegible: 'Comprobante ilegible',
  datos_no_coinciden: 'Datos no coinciden',
  otro: 'Otro',
}

const INCIDENT_COLUMNS =
  'id,cancha_id,deporte_id,cliente_id,cliente_sin_cuenta_nombre,estado,cancelada_at,motivo_cancelacion,rechazada_at,motivo_rechazo_pago,rango'

type RawIncidentRow = {
  id: string
  cancha_id: string
  deporte_id: string
  cliente_id: string | null
  cliente_sin_cuenta_nombre: string | null
  estado: string
  cancelada_at: string | null
  motivo_cancelacion: string | null
  rechazada_at: string | null
  motivo_rechazo_pago: string | null
  rango: unknown
}

type CustomerRow = { reserva_id: string; cliente_nombre: string | null }

type CustomersReader = {
  rpc: (
    functionName: 'obtener_clientes_reservas_dueno',
    args: { p_local_id: string; p_reserva_ids: string[] },
  ) => Promise<{ data: CustomerRow[] | null; error: { message?: string } | null }>
}

function computeKpi(value: number, previous: number, goodWhenUp: boolean): ReportKpi {
  return {
    value,
    previous,
    changePct: previous === 0 ? null : ((value - previous) / previous) * 100,
    goodWhenUp,
  }
}

function shortDateLabel(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${date}T12:00:00-05:00`))
}

async function fetchByEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courtIds: string[],
  kind: 'cancelacion' | 'rechazo',
  startIso: string,
  endIso: string,
) {
  const rows: RawIncidentRow[] = []
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error } =
      kind === 'cancelacion'
        ? await supabase
            .from('reservas')
            .select(INCIDENT_COLUMNS)
            .in('cancha_id', courtIds)
            .in('estado', CANCEL_STATES)
            .gte('cancelada_at', startIso)
            .lte('cancelada_at', endIso)
            .order('cancelada_at', { ascending: false })
            .range(from, to)
        : await supabase
            .from('reservas')
            .select(INCIDENT_COLUMNS)
            .in('cancha_id', courtIds)
            .eq('estado', 'rechazada_pago')
            .gte('rechazada_at', startIso)
            .lte('rechazada_at', endIso)
            .order('rechazada_at', { ascending: false })
            .range(from, to)

    if (error) {
      console.error('[reportes-auditoria:rows]', error)
      throw new Error(error.message ?? 'No se pudieron cargar las incidencias.')
    }
    rows.push(...((data ?? []) as RawIncidentRow[]))
    if (!data || data.length < PAGE_SIZE) break
  }
  return rows
}

async function countByEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courtIds: string[],
  kind: 'cancelacion' | 'rechazo',
  startIso: string,
  endIso: string,
) {
  const { count, error } =
    kind === 'cancelacion'
      ? await supabase
          .from('reservas')
          .select('id', { count: 'exact', head: true })
          .in('cancha_id', courtIds)
          .in('estado', CANCEL_STATES)
          .gte('cancelada_at', startIso)
          .lte('cancelada_at', endIso)
      : await supabase
          .from('reservas')
          .select('id', { count: 'exact', head: true })
          .in('cancha_id', courtIds)
          .eq('estado', 'rechazada_pago')
          .gte('rechazada_at', startIso)
          .lte('rechazada_at', endIso)

  if (error) {
    console.error('[reportes-auditoria:count]', error)
    throw new Error(error.message ?? 'No se pudieron contar las incidencias.')
  }
  return count ?? 0
}

export async function getAuditReport(input: {
  start?: string
  end?: string
}): Promise<AuditReport> {
  const { local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const defaults = defaultRange()
  let start = input.start ?? defaults.start
  let end = input.end ?? defaults.end
  if (start > end) [start, end] = [end, start]
  const previous = previousRange(start, end)
  const today = todayLima()

  const base: AuditReport = {
    localId: local.id,
    localName: local.nombre,
    start,
    end,
    today,
    totals: { cancelaciones: 0, rechazos: 0 },
    kpis: {
      cancelaciones: computeKpi(0, 0, false),
      rechazos: computeKpi(0, 0, false),
    },
    series: [],
    cancellationsByType: [],
    rejectionsByReason: [],
    incidents: [],
  }

  const { data: courtRows, error: courtsError } = await supabase
    .from('canchas')
    .select('id,nombre')
    .eq('local_id', local.id)

  if (courtsError) {
    console.error('[reportes-auditoria:courts]', courtsError)
    throw new Error(courtsError.message ?? 'No se pudieron cargar las canchas del local.')
  }

  const courts = courtRows ?? []
  if (!courts.length) return base
  const courtIds = courts.map((court) => court.id)

  const startIso = `${start}T00:00:00-05:00`
  const endIso = `${shiftDate(end, 1)}T00:00:00-05:00`
  const prevStartIso = `${previous.start}T00:00:00-05:00`
  const prevEndIso = `${shiftDate(previous.end, 1)}T00:00:00-05:00`

  const [cancellations, rejections, prevCancellations, prevRejections] = await Promise.all([
    fetchByEvent(supabase, courtIds, 'cancelacion', startIso, endIso),
    fetchByEvent(supabase, courtIds, 'rechazo', startIso, endIso),
    countByEvent(supabase, courtIds, 'cancelacion', prevStartIso, prevEndIso),
    countByEvent(supabase, courtIds, 'rechazo', prevStartIso, prevEndIso),
  ])

  const courtNames = new Map(courts.map((court) => [court.id, court.nombre]))
  const sportIds = [...new Set([...cancellations, ...rejections].map((row) => row.deporte_id))]
  const sportNames = new Map<string, string>()
  if (sportIds.length) {
    const { data: sportRows, error: sportsError } = await supabase
      .from('deportes')
      .select('id,nombre')
      .in('id', sportIds)
    if (sportsError) {
      console.error('[reportes-auditoria:sports]', sportsError)
      throw new Error(sportsError.message ?? 'No se pudieron cargar los deportes.')
    }
    for (const sport of sportRows ?? []) sportNames.set(sport.id, sport.nombre)
  }

  const reservationIds = [...cancellations, ...rejections].map((row) => row.id)
  const customerNames = new Map<string, string>()
  if (reservationIds.length) {
    const reader = supabase as unknown as CustomersReader
    const { data: customers } = await reader.rpc('obtener_clientes_reservas_dueno', {
      p_local_id: local.id,
      p_reserva_ids: reservationIds,
    })
    for (const customer of customers ?? []) {
      if (customer.cliente_nombre) customerNames.set(customer.reserva_id, customer.cliente_nombre)
    }
  }

  const incidents: AuditIncident[] = []

  for (const row of cancellations) {
    if (!row.cancelada_at) continue
    const { start: rawStart } = parseRange(row.rango)
    incidents.push({
      id: `c-${row.id}`,
      type: 'cancelacion',
      reservationId: row.id,
      courtName: courtNames.get(row.cancha_id) ?? 'Sin nombre',
      sportName: sportNames.get(row.deporte_id) ?? 'Sin nombre',
      customerName: customerNames.get(row.id) ?? row.cliente_sin_cuenta_nombre ?? 'Cliente',
      eventAt: row.cancelada_at,
      eventDate: limaDate(row.cancelada_at),
      gameDate: rawStart ? limaDate(rawStart) : '',
      actor: row.estado === 'cancelada_cliente' ? 'cliente' : 'dueno',
      reason: row.motivo_cancelacion || null,
    })
  }

  for (const row of rejections) {
    if (!row.rechazada_at) continue
    const { start: rawStart } = parseRange(row.rango)
    incidents.push({
      id: `r-${row.id}`,
      type: 'rechazo',
      reservationId: row.id,
      courtName: courtNames.get(row.cancha_id) ?? 'Sin nombre',
      sportName: sportNames.get(row.deporte_id) ?? 'Sin nombre',
      customerName: customerNames.get(row.id) ?? row.cliente_sin_cuenta_nombre ?? 'Cliente',
      eventAt: row.rechazada_at,
      eventDate: limaDate(row.rechazada_at),
      gameDate: rawStart ? limaDate(rawStart) : '',
      actor: 'dueno',
      reason: row.motivo_rechazo_pago
        ? REJECTION_REASON_LABELS[row.motivo_rechazo_pago] ?? row.motivo_rechazo_pago
        : null,
    })
  }

  incidents.sort((a, b) => (a.eventAt < b.eventAt ? 1 : a.eventAt > b.eventAt ? -1 : 0))

  const seriesMap = new Map<string, { cancelaciones: number; rechazos: number }>()
  let cursor = start
  let guard = 0
  while (cursor <= end && guard < 800) {
    seriesMap.set(cursor, { cancelaciones: 0, rechazos: 0 })
    cursor = shiftDate(cursor, 1)
    guard += 1
  }
  for (const incident of incidents) {
    const bucket = seriesMap.get(incident.eventDate)
    if (!bucket) continue
    if (incident.type === 'cancelacion') bucket.cancelaciones += 1
    else bucket.rechazos += 1
  }
  const series: AuditSeriesPoint[] = [...seriesMap.entries()].map(([date, value]) => ({
    date,
    label: shortDateLabel(date),
    cancelaciones: value.cancelaciones,
    rechazos: value.rechazos,
  }))

  const cancellationsByType: AuditBreakdownItem[] = [
    { id: 'cliente', label: 'Cliente', count: cancellations.filter((row) => row.estado === 'cancelada_cliente').length },
    { id: 'dueno', label: 'Dueño', count: cancellations.filter((row) => row.estado === 'cancelada_local').length },
  ].filter((item) => item.count > 0)

  const reasonCounts = new Map<string, number>()
  for (const row of rejections) {
    const key = row.motivo_rechazo_pago ?? 'otro'
    reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1)
  }
  const rejectionsByReason: AuditBreakdownItem[] = [...reasonCounts.entries()]
    .map(([id, count]) => ({ id, label: REJECTION_REASON_LABELS[id] ?? id, count }))
    .sort((a, b) => b.count - a.count)

  const cancelaciones = cancellations.length
  const rechazos = rejections.length

  return {
    ...base,
    totals: { cancelaciones, rechazos },
    kpis: {
      cancelaciones: computeKpi(cancelaciones, prevCancellations, false),
      rechazos: computeKpi(rechazos, prevRejections, false),
    },
    series,
    cancellationsByType,
    rejectionsByReason,
    incidents,
  }
}
