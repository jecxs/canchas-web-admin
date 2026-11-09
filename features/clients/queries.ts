import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { ClientSummary, ClientsData, ClientsFilters } from './types'
import { daysUntilBirthday, limaToday } from './birthdays'

export const CLIENTS_PAGE_SIZE = 25

export async function getClientsData(filters: ClientsFilters): Promise<ClientsData> {
  const { local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()

  const { data: courtRows, error: courtsError } = await supabase
    .from('canchas')
    .select('id,nombre,cancha_deportes(deporte_id,deportes(id,nombre))')
    .eq('local_id', local.id)
    .order('nombre')

  if (courtsError) {
    console.error('[clients:courts]', { code: courtsError.code, message: courtsError.message })
    throw new Error('No se pudieron cargar las canchas del local.')
  }

  const { data: preferences, error: preferencesError } = await supabase.from('locales')
    .select('avisos_cumpleanos_activos').eq('id', local.id).single()
  if (preferencesError) throw new Error('No se pudo cargar la preferencia de cumpleaños del local.')
  const birthdayAlertsEnabled = preferences.avisos_cumpleanos_activos
  const { data: birthdays, error: birthdayError } = birthdayAlertsEnabled
    ? await supabase.rpc('obtener_cumpleanos_clientes_local_dueno', { p_local_id: local.id })
    : { data: [], error: null }
  if (birthdayError) throw new Error('No se pudieron cargar los cumpleaños del local.')
  const today = limaToday()
  const birthdayByClient = new Map((birthdays ?? []).map((item) => [item.cliente_id, item]))
  const upcomingBirthdays = (birthdays ?? []).map((item) => ({
    clientId: item.cliente_id,
    name: item.nombre,
    month: item.cumpleanos_mes,
    day: item.cumpleanos_dia,
    inDays: daysUntilBirthday(item.cumpleanos_mes, item.cumpleanos_dia, today),
  })).filter((item) => item.inDays <= 7).sort((a, b) => a.inDays - b.inDays || a.name.localeCompare(b.name))

  const courts = courtRows ?? []
  const courtIds = filters.courtIds.filter((id) => courts.some((court) => court.id === id))
  const page = Math.max(1, filters.page)
  const query = filters.query.trim()

  const { data, error } = await supabase.rpc('obtener_clientes_local_dueno', {
    p_local_id: local.id,
    p_cancha_ids: courtIds.length ? courtIds : undefined,
    p_busqueda: query || undefined,
    p_limite: CLIENTS_PAGE_SIZE,
    p_offset: (page - 1) * CLIENTS_PAGE_SIZE,
  })

  if (error) {
    console.error('[clients:read]', { code: error.code, message: error.message })
    throw new Error('No se pudieron cargar los clientes.')
  }

  const clients: ClientSummary[] = (data ?? []).map((client) => {
    const birthday = birthdayByClient.get(client.cliente_id ?? '')
    return {
      id: client.cliente_id ?? `ext:${client.telefono ?? 'sin-telefono'}`,
      clienteId: client.cliente_id,
      name: client.nombre,
      phone: client.telefono,
      avatarUrl: client.avatar_url ?? null,
      isAccount: client.es_cuenta,
      birthdayMonth: birthday?.cumpleanos_mes ?? null,
      birthdayDay: birthday?.cumpleanos_dia ?? null,
      birthdayInDays: birthday ? daysUntilBirthday(birthday.cumpleanos_mes, birthday.cumpleanos_dia, today) : null,
      totalReservations: Number(client.total_reservas),
      confirmed: Number(client.confirmadas),
      completed: Number(client.completadas),
      pendingValidation: Number(client.por_validar),
      noShows: Number(client.inasistencias),
      cancelled: Number(client.canceladas),
      rejectedPayments: Number(client.rechazadas_pago),
      totalAmount: Number(client.monto_total),
      firstReservation: client.primera_reserva,
      lastReservation: client.ultima_reserva,
      nextReservation: client.proxima_reserva,
    }
  })

  const totalCount = data?.length ? Number(data[0].total_count) : 0

  return {
    localId: local.id,
    localName: local.nombre,
    courts: courts.map((court) => ({ id: court.id, name: court.nombre, sports: court.cancha_deportes.map((relation) => ({ id: relation.deporte_id, name: relation.deportes.nombre })) })),
    clients,
    birthdayAlertsEnabled,
    upcomingBirthdays,
    filters: { courtIds, query, page },
    pagination: {
      page,
      pageSize: CLIENTS_PAGE_SIZE,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / CLIENTS_PAGE_SIZE)),
    },
  }
}
