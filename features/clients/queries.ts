import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { ClientSummary, ClientsData, ClientsFilters } from './types'

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

  const clients: ClientSummary[] = (data ?? []).map((client) => ({
    id: client.cliente_id ?? `ext:${client.telefono ?? 'sin-telefono'}`,
    clienteId: client.cliente_id,
    name: client.nombre,
    phone: client.telefono,
    isAccount: client.es_cuenta,
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
  }))

  const totalCount = data?.length ? Number(data[0].total_count) : 0

  return {
    localId: local.id,
    localName: local.nombre,
    courts: courts.map((court) => ({ id: court.id, name: court.nombre, sports: court.cancha_deportes.map((relation) => ({ id: relation.deporte_id, name: relation.deportes.nombre })) })),
    clients,
    filters: { courtIds, query, page },
    pagination: {
      page,
      pageSize: CLIENTS_PAGE_SIZE,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / CLIENTS_PAGE_SIZE)),
    },
  }
}
