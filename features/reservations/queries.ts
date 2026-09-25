import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { OwnerReservation, ReservationExtension, ReservationsData, ReservationsFilters } from './types'

export const RESERVATIONS_PAGE_SIZE = 25

type RawReservation = {
  id: string
  cancha_id: string
  canal_origen: OwnerReservation['channel']
  cliente_id: string | null
  cliente_sin_cuenta_nombre: string | null
  cliente_sin_cuenta_telefono: string | null
  comentario_rechazo_pago: string | null
  comprobante_subido_at: string | null
  comprobante_url: string | null
  created_at: string
  deporte_id: string
  es_excepcion_horaria: boolean
  estado: OwnerReservation['status']
  monto_adelanto_requerido: number
  monto_total: number
  motivo_cancelacion: string | null
  motivo_rechazo_pago: string | null
  notas: string | null
  rango: unknown
  rechazada_at: string | null
  reembolso_resultado: string
  cancelada_at: string | null
  updated_at: string
}

type OwnerReservationCustomer = {
  reserva_id: string
  cliente_nombre: string | null
  cliente_telefono: string | null
}

type OwnerReservationCustomerReader = {
  rpc: (functionName: string, args: { p_local_id: string; p_reserva_ids: string[] }) => Promise<{
    data: OwnerReservationCustomer[] | null
    error: { code?: string; message?: string } | null
  }>
}

function parseRange(range: unknown) {
  const values = String(range ?? '').match(/[\[\(]([^,]+),([^\]\)]+)[\]\)]/)
  return { start: values?.[1] ?? '', end: values?.[2] ?? '' }
}

function nextDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

export async function getReservationsData(filters: ReservationsFilters = {}): Promise<ReservationsData> {
  const { local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()

  const { data: courtRows, error: courtsError } = await supabase
    .from('canchas')
    .select('id,nombre')
    .eq('local_id', local.id)
    .order('nombre')

  if (courtsError) throw new Error('No se pudieron cargar las canchas del local.')
  const courts = courtRows ?? []
  const page = Math.max(1, filters.page ?? 1)
  const normalizedFilters = { ...filters, page }
  if (!courts.length) return { localId: local.id, localName: local.nombre, courts: [], reservations: [], filters: normalizedFilters, pagination: { page, pageSize: RESERVATIONS_PAGE_SIZE, totalCount: 0, totalPages: 1 } }

  const courtIds = courts.map((court) => court.id)
  let reservationsQuery = supabase
    .from('reservas')
    .select('id,cancha_id,canal_origen,cliente_id,cliente_sin_cuenta_nombre,cliente_sin_cuenta_telefono,comentario_rechazo_pago,comprobante_subido_at,comprobante_url,created_at,deporte_id,es_excepcion_horaria,estado,monto_adelanto_requerido,monto_total,motivo_cancelacion,motivo_rechazo_pago,notas,rango,rechazada_at,reembolso_resultado,cancelada_at,updated_at', { count: 'exact' })
    .in('cancha_id', courtIds)

  if (filters.courtId && courtIds.includes(filters.courtId)) reservationsQuery = reservationsQuery.eq('cancha_id', filters.courtId)
  if (filters.status) reservationsQuery = reservationsQuery.eq('estado', filters.status)
  if (filters.channel) reservationsQuery = reservationsQuery.eq('canal_origen', filters.channel)
  if (filters.from || filters.to) {
    const start = `${filters.from ?? '2000-01-01'}T00:00:00-05:00`
    const end = `${nextDate(filters.to ?? '2100-01-01')}T00:00:00-05:00`
    reservationsQuery = reservationsQuery.overlaps('rango', `[${start},${end})`)
  }

  const { data: reservationRows, count, error: reservationsError } = await reservationsQuery
    .order('created_at', { ascending: false })
    .range((page - 1) * RESERVATIONS_PAGE_SIZE, page * RESERVATIONS_PAGE_SIZE - 1)

  if (reservationsError) {
    console.error('[reservations:read]', { code: reservationsError.code, message: reservationsError.message })
    throw new Error('No se pudieron cargar las reservas.')
  }

  const rawReservations = (reservationRows ?? []) as RawReservation[]
  const reservationIds = rawReservations.map((reservation) => reservation.id)
  const sportIds = [...new Set(rawReservations.map((reservation) => reservation.deporte_id))]
  const customerReader = supabase as unknown as OwnerReservationCustomerReader
  const [sportsResult, customersResult, extensionsResult] = await Promise.all([
    sportIds.length ? supabase.from('deportes').select('id,nombre').in('id', sportIds) : Promise.resolve({ data: [], error: null }),
    reservationIds.length ? customerReader.rpc('obtener_clientes_reservas_dueno', { p_local_id: local.id, p_reserva_ids: reservationIds }) : Promise.resolve({ data: [], error: null }),
    reservationIds.length ? supabase.from('reserva_extensiones').select('id,reserva_id,monto_adicional,estado_cobro,medio_cobro,notas,created_at').in('reserva_id', reservationIds).order('created_at') : Promise.resolve({ data: [], error: null }),
  ])

  const secondaryError = sportsResult.error ?? customersResult.error ?? extensionsResult.error
  if (secondaryError) {
    console.error('[reservations:details]', { code: secondaryError.code, message: secondaryError.message })
    throw new Error('No se pudieron cargar los detalles de las reservas.')
  }

  const courtNames = new Map(courts.map((court) => [court.id, court.nombre]))
  const sportNames = new Map((sportsResult.data ?? []).map((sport) => [sport.id, sport.nombre]))
  const customers = new Map((customersResult.data ?? []).map((customer) => [customer.reserva_id, customer]))
  const extensionsByReservation = new Map<string, ReservationExtension[]>()
  for (const extension of extensionsResult.data ?? []) {
    const list = extensionsByReservation.get(extension.reserva_id) ?? []
    list.push({ id: extension.id, amount: Number(extension.monto_adicional), chargeStatus: extension.estado_cobro, method: extension.medio_cobro, notes: extension.notas, createdAt: extension.created_at })
    extensionsByReservation.set(extension.reserva_id, list)
  }

  const reservations = rawReservations.map((reservation): OwnerReservation => {
    const customer = customers.get(reservation.id)
    const extensions = extensionsByReservation.get(reservation.id) ?? []
    const { start, end } = parseRange(reservation.rango)
    return {
      id: reservation.id,
      courtId: reservation.cancha_id,
      courtName: courtNames.get(reservation.cancha_id) ?? 'Cancha',
      sportName: sportNames.get(reservation.deporte_id) ?? 'Deporte',
      customerName: customer?.cliente_nombre || 'Cliente sin nombre',
      customerPhone: customer?.cliente_telefono ?? null,
      start,
      end,
      status: reservation.estado,
      channel: reservation.canal_origen as OwnerReservation['channel'],
      totalAmount: Number(reservation.monto_total),
      advanceAmount: Number(reservation.monto_adelanto_requerido),
      isTimeException: reservation.es_excepcion_horaria,
      proofPath: reservation.comprobante_url,
      proofUrl: null,
      proofUploadedAt: reservation.comprobante_subido_at,
      notes: reservation.notas,
      createdAt: reservation.created_at,
      updatedAt: reservation.updated_at,
      rejectedAt: reservation.rechazada_at,
      rejectedReason: reservation.motivo_rechazo_pago,
      rejectedComment: reservation.comentario_rechazo_pago,
      cancelledAt: reservation.cancelada_at,
      cancellationReason: reservation.motivo_cancelacion,
      refundResult: reservation.reembolso_resultado,
      extensions,
    }
  })

  // Un comprobante solo es relevante para revisar una reserva en validación o
  // entender un rechazo. Firmamos únicamente esos archivos privados.
  const proofReservations = reservations.filter((reservation) => reservation.proofPath && ['pendiente_validacion', 'rechazada_pago'].includes(reservation.status))
  const proofUrls = await Promise.all(proofReservations.map(async (reservation) => {
    const { data } = await supabase.storage.from('comprobantes-pago').createSignedUrl(reservation.proofPath!, 10 * 60)
    return [reservation.id, data?.signedUrl ?? null] as const
  }))
  const proofUrlByReservation = new Map(proofUrls)
  reservations.forEach((reservation) => { reservation.proofUrl = proofUrlByReservation.get(reservation.id) ?? null })

  const totalCount = count ?? 0
  return {
    localId: local.id,
    localName: local.nombre,
    courts: courts.map((court) => ({ id: court.id, name: court.nombre })),
    reservations,
    filters: normalizedFilters,
    pagination: { page, pageSize: RESERVATIONS_PAGE_SIZE, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / RESERVATIONS_PAGE_SIZE)) },
  }
}
