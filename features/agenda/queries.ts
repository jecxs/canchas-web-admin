import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { getDayOfWeek, formatAgendaDate, shiftAgendaDate } from './date-utils'
import type { AgendaData } from './types'
import type { LocalPaymentMethod, PaymentMethodType } from '@/features/payments/types'

export async function getAgendaData(date: string): Promise<AgendaData> {
  const { local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const dayOfWeek = getDayOfWeek(date)

  const [{ data: courts, error: courtsError }, { data: schedule, error: scheduleError }, { data: paymentMethods, error: paymentMethodsError }] = await Promise.all([
    supabase
      .from('canchas')
      .select('id,nombre,activa,superficie,descripcion,largo_metros,ancho_metros,cancha_deportes(deporte_id,tipo_soporte,deportes(id,nombre))')
      .eq('local_id', local.id)
      .eq('activa', true)
      .order('created_at'),
    supabase
      .from('horarios_atencion')
      .select('hora_apertura,hora_cierre')
      .eq('local_id', local.id)
      .eq('dia_semana', dayOfWeek)
      .maybeSingle(),
    supabase
      .from('local_medios_pago')
      .select('id,tipo,nombre_visible,titular,telefono,banco,numero_cuenta,cci,activo')
      .eq('local_id', local.id)
      .eq('activo', true)
      .order('created_at'),
  ])

  const error = courtsError ?? scheduleError ?? paymentMethodsError
  if (error) {
    console.error('[agenda:read]', { code: error.code, message: error.message })
    throw new Error('No se pudo cargar la agenda.')
  }

  const agendaCourts = (courts ?? []).map((court) => ({
    id: court.id,
    name: court.nombre,
    surface: court.superficie,
    description: court.descripcion,
    lengthMeters: court.largo_metros,
    widthMeters: court.ancho_metros,
    sports: court.cancha_deportes.map((relation) => ({
      id: relation.deporte_id,
      name: relation.deportes.nombre,
      support: relation.tipo_soporte,
    })),
  }))

  const [{ data: occupations, error: occupationsError }, { data: reservationRows, error: reservationsError }] = await Promise.all([
    supabase.rpc('fn_ocupacion_tablero_local', {
      p_local_id: local.id,
      p_fecha: date,
    }),
    supabase.rpc('obtener_reservas_agenda_dueno', {
      p_local_id: local.id,
      p_fecha: date,
    }),
  ])

  if (occupationsError) {
    console.error('[agenda:read]', { code: occupationsError.code, message: occupationsError.message })
    throw new Error('No se pudo cargar la agenda.')
  }

  // The visual board RPC deliberately omits customer and reservation ids.
  // This owner-only RPC supplies the private details needed by operational
  // actions such as extending a confirmed reservation.
  if (reservationsError) {
    // Never fall back to the anonymous visual occupation for reservations.
    // Doing so leaves the cell occupied but without its business state,
    // customer, sport or id, which used to render as a misleading generic
    // "Reserva". The owner-only contract is the source of truth for a
    // reservation in this operational board.
    console.error('[agenda:reservations]', JSON.stringify({ code: reservationsError.code, message: reservationsError.message }))
    throw new Error('No se pudieron cargar los detalles de las reservas.')
  }

  const sportNames = new Map(agendaCourts.flatMap((court) => court.sports.map((sport) => [sport.id, sport.name] as const)))
  const missingSportIds = [...new Set((reservationRows ?? []).map((reservation) => reservation.deporte_id))]
    .filter((sportId) => !sportNames.has(sportId))
  if (missingSportIds.length) {
    const { data: historicalSports, error: sportsError } = await supabase
      .from('deportes')
      .select('id,nombre')
      .in('id', missingSportIds)
    if (sportsError) {
      console.warn('[agenda:sport-names]', { code: sportsError.code })
    } else {
      for (const sport of historicalSports ?? []) sportNames.set(sport.id, sport.nombre)
    }
  }
  const reservations = await Promise.all((reservationRows ?? []).map(async (reservation) => {
    if (!reservation.comprobante_url) return { ...reservation, proofUrl: null }
    const { data: signedProof, error: proofError } = await supabase.storage
      .from('comprobantes-pago')
      .createSignedUrl(reservation.comprobante_url, 10 * 60)
    if (proofError) {
      console.warn('[agenda:proof]', JSON.stringify({ code: proofError.name, message: proofError.message }))
    }
    return { ...reservation, proofUrl: signedProof?.signedUrl ?? null }
  }))

  const visibleCourtIds = new Set(agendaCourts.map((court) => court.id))
  const courtNames = new Map(agendaCourts.map((court) => [court.id, court.name]))

  // Reservations and maintenance have different privacy contracts. The
  // visual RPC is retained only for maintenance; reservation cells come from
  // obtener_reservas_agenda_dueno so each occupied cell always carries its
  // authoritative state and operational detail.
  const maintenanceOccupations = (occupations ?? [])
    .filter((occupation) => occupation.tipo === 'mantenimiento')
    .map((occupation) => ({
      courtId: occupation.cancha_id,
      courtName: occupation.cancha_nombre,
      start: occupation.inicio,
      end: occupation.fin,
      type: 'mantenimiento' as const,
      isException: false,
    }))
  const reservationOccupations = reservations
    .filter((reservation) => visibleCourtIds.has(reservation.cancha_id) && intersectsAgendaDate(reservation.inicio, reservation.fin, date))
    .map((reservation) => ({
      courtId: reservation.cancha_id,
      courtName: courtNames.get(reservation.cancha_id) ?? 'Cancha',
      start: reservation.inicio,
      end: reservation.fin,
      type: 'reserva' as const,
      isException: reservation.es_excepcion_horaria,
      reservationId: reservation.reserva_id,
      sportId: reservation.deporte_id,
      sportName: sportNames.get(reservation.deporte_id),
      customerName: reservation.cliente_nombre ?? undefined,
      customerPhone: reservation.cliente_telefono ?? undefined,
      reservationStatus: reservation.estado,
      reservationChannel: reservation.canal_origen,
      reservationNotes: reservation.notas,
      proofPath: reservation.comprobante_url,
      proofUrl: reservation.proofUrl,
      proofUploadedAt: reservation.comprobante_subido_at,
      totalAmount: reservation.monto_total,
      advanceAmount: reservation.monto_adelanto_requerido,
      paidAmount: reservation.monto_cobrado,
      refundedAmount: reservation.monto_reembolsado,
      outstandingAmount: reservation.saldo_pendiente,
    }))

  return {
    localId: local.id,
    localName: local.nombre,
    date,
    dayLabel: formatAgendaDate(date),
    openingTime: schedule?.hora_apertura ?? null,
    closingTime: schedule?.hora_cierre ?? null,
    courts: agendaCourts,
    occupations: [...maintenanceOccupations, ...reservationOccupations],
    paymentMethods: (paymentMethods ?? []).map((method): LocalPaymentMethod => ({
      id: method.id,
      type: method.tipo as PaymentMethodType,
      name: method.nombre_visible,
      holder: method.titular,
      phone: method.telefono,
      bank: method.banco,
      accountNumber: method.numero_cuenta,
      cci: method.cci,
      active: method.activo,
    })),
  }
}

export async function getAgendaWeekData(dates: string[]) {
  return Promise.all(dates.map((date) => getAgendaData(date)))
}

// Defense in depth for the UI: a reservation must overlap the selected
// calendar date in Lima. The database enforces the same window; this prevents
// a broken or stale RPC contract from ever drawing Sunday-night activity on
// Monday's board again.
function intersectsAgendaDate(start: string, end: string, date: string) {
  const dayStart = new Date(`${date}T00:00:00-05:00`)
  const dayEnd = new Date(`${shiftAgendaDate(date, 1)}T00:00:00-05:00`)
  return new Date(end) > dayStart && new Date(start) < dayEnd
}
