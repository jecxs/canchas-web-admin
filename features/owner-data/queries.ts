import 'server-only'

import { getOwnerShellContext } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { isIsoDate } from '@/features/reportes/date-utils'
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

  return ((data ?? []) as ReservationExportRow[]).map((row) => ({
    ...row,
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
  const { data, error } = await supabase.rpc('obtener_caja_local', {
    p_local_id: localId,
    p_desde: isIsoDate(range.from) ? range.from : '2000-01-01',
    p_hasta: isIsoDate(range.to) ? range.to : '2100-01-01',
  })

  if (error) {
    console.error('[owner-data:caja]', { code: error.code, message: error.message })
    throw new Error('No se pudieron cargar los movimientos de caja para el respaldo.')
  }

  return ((data ?? []) as CajaExportRow[]).map((row) => ({ ...row, monto: Number(row.monto) || 0 }))
}
