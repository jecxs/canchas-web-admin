import 'server-only'

import { getOwnerShellContext } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { isIsoDate } from '@/features/reportes/date-utils'
import { getExceptionalEvents } from '@/features/caja/exceptional-entries'
import type { CajaExportRow, OwnerDataContext, OwnerDataRange, ReservationExportRow } from './types'

// El respaldo debe funcionar aunque el panel esté restringido. `getOwnerShellContext`
// solo exige sesión y rol de dueño; no depende del entitlement operativo.
export async function getOwnerDataContext(): Promise<OwnerDataContext | null> {
  const { activeLocal } = await getOwnerShellContext()
  if (!activeLocal) return null
  return { localId: activeLocal.id, localName: activeLocal.nombre }
}

export async function fetchReservationsExport(
  localId: string,
  range: OwnerDataRange,
): Promise<ReservationExportRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('obtener_reservas_export_dueno', {
    p_local_id: localId,
    p_desde: isIsoDate(range.from) ? range.from : undefined,
    p_hasta: isIsoDate(range.to) ? range.to : undefined,
  })

  if (error) {
    console.error('[owner-data:reservas]', { code: error.code, message: error.message })
    throw new Error('No se pudieron cargar las reservas para el respaldo.')
  }

  const rawRows = (data ?? []) as ReservationExportRow[]
  const prices = new Map<string, { precio_tarifa_base: number; descuento_especial_monto: number }>()
  const reasons = new Map<string, string>()
  for (let offset = 0; offset < rawRows.length; offset += 200) {
    const ids = rawRows.slice(offset, offset + 200).map((row) => row.reserva_id)
    const { data: priceRows, error: pricesError } = await supabase.from('reservas')
      .select('id,precio_tarifa_base,descuento_especial_monto').in('id', ids)
    if (pricesError || priceRows?.length !== ids.length) throw new Error('No se pudieron cargar los precios especiales del respaldo.')
    for (const price of priceRows) prices.set(price.id, price)
    const { data: historyRows, error: historyError } = await supabase.from('reserva_descuentos_historial')
      .select('reserva_id,motivo,created_at').in('reserva_id', ids).order('created_at', { ascending: false })
    if (historyError) throw new Error('No se pudieron cargar los motivos del respaldo.')
    for (const event of historyRows ?? []) if (!reasons.has(event.reserva_id)) reasons.set(event.reserva_id, event.motivo)
  }

  return rawRows.map((row) => ({
    ...row,
    precio_tarifa_base: Number(prices.get(row.reserva_id)?.precio_tarifa_base ?? row.monto_total) || 0,
    descuento_especial_monto: Number(prices.get(row.reserva_id)?.descuento_especial_monto ?? 0) || 0,
    descuento_especial_motivo: Number(prices.get(row.reserva_id)?.descuento_especial_monto ?? 0) > 0 ? reasons.get(row.reserva_id) ?? null : null,
    monto_total: Number(row.monto_total) || 0,
    monto_adelanto: Number(row.monto_adelanto) || 0,
    monto_cobrado: Number(row.monto_cobrado) || 0,
    monto_reembolsado: Number(row.monto_reembolsado) || 0,
    saldo_pendiente: Number(row.saldo_pendiente) || 0,
    extension_monto: Number(row.extension_monto) || 0,
  }))
}

export async function fetchCajaExport(localId: string, range: OwnerDataRange): Promise<CajaExportRow[]> {
  const supabase = await createClient()
  const start = isIsoDate(range.from) ? range.from : '2000-01-01'
  const end = isIsoDate(range.to) ? range.to : '2100-01-01'
  const { data, error } = await supabase.rpc('obtener_caja_local', {
    p_local_id: localId,
    p_desde: start,
    p_hasta: end,
  })

  if (error) {
    console.error('[owner-data:caja]', { code: error.code, message: error.message })
    throw new Error('No se pudieron cargar los movimientos de caja para el respaldo.')
  }

  const exceptional = await getExceptionalEvents(supabase, localId, start, end)
  const courtIds = [...new Set(exceptional.map((event) => event.courtId).filter((id): id is string => Boolean(id)))]
  const { data: courtRows, error: courtsError } = courtIds.length
    ? await supabase.from('canchas').select('id,nombre').in('id', courtIds)
    : { data: [], error: null }
  if (courtsError) throw new Error('No se pudieron cargar las canchas para el respaldo.')
  const courtNames = new Map((courtRows ?? []).map((court) => [court.id, court.nombre]))
  const rows = ((data ?? []) as CajaExportRow[]).map((row) => ({ ...row, monto: Number(row.monto) || 0 }))
  rows.push(...exceptional.map((event) => ({
    movimiento_id: event.id,
    reserva_id: null,
    cancha_id: event.courtId,
    cancha_nombre: event.courtId ? courtNames.get(event.courtId) ?? 'Cancha anterior' : '—',
    cliente: 'Ingreso excepcional',
    fecha: event.date,
    created_at: event.at,
    tipo: event.type,
    monto: event.amount,
    medio_tipo: event.method,
    referencia: event.activityDate ? `Juego: ${event.activityDate}` : null,
    notas: event.type === 'anulacion' ? `Anulación de: ${event.concept}. Motivo: ${event.voidReason}` : event.concept,
  })))
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
}
