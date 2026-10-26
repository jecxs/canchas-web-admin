import 'server-only'

import { createClient } from '@/utils/supabase/server'

type SettlementRow = {
  movimiento_id: string
  deducciones: number | null
  neto_recibido: number | null
}

type SettlementReader = {
  rpc: (
    name: 'obtener_liquidaciones_mercadopago_local',
    args: { p_local_id: string; p_desde: string; p_hasta: string },
  ) => {
    range: (from: number, to: number) => Promise<{
      data: SettlementRow[] | null
      error: { code?: string; message?: string } | null
    }>
  }
}

export type MercadoPagoSettlement = {
  deducciones: number | null
  netoRecibido: number | null
}

export type MercadoPagoTotals = {
  bruto: number
  deducciones: number | null
  netoRecibido: number | null
  pendientes: number
}

const PAGE_SIZE = 1000
const MAX_PAGES = 50

function amount(value: number | null): number | null {
  if (value === null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export async function getMercadoPagoSettlements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  localId: string,
  start: string,
  end: string,
): Promise<Map<string, MercadoPagoSettlement>> {
  const reader = supabase as unknown as SettlementReader
  const settlements = new Map<string, MercadoPagoSettlement>()

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data, error } = await reader.rpc('obtener_liquidaciones_mercadopago_local', {
      p_local_id: localId,
      p_desde: start,
      p_hasta: end,
    }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    // Permite publicar el panel antes de aplicar la migración; los importes quedan pendientes.
    if (error?.code === 'PGRST202' || error?.code === '42883') return new Map()
    if (error) {
      console.error('[mercadopago:settlements]', { code: error.code, message: error.message })
      throw new Error('No se pudieron cargar los importes de Mercado Pago.')
    }

    for (const row of data ?? []) {
      settlements.set(row.movimiento_id, {
        deducciones: amount(row.deducciones),
        netoRecibido: amount(row.neto_recibido),
      })
    }
    if (!data || data.length < PAGE_SIZE) return settlements
  }

  throw new Error('El periodo contiene demasiados cobros para mostrar los importes de Mercado Pago.')
}

export function summarizeMercadoPago(
  movements: Array<{ movimiento_id: string; monto: number; medio: string; tipo: string }>,
  settlements: Map<string, MercadoPagoSettlement>,
): MercadoPagoTotals {
  let bruto = 0
  let deducciones = 0
  let netoRecibido = 0
  let pendientes = 0

  for (const movement of movements) {
    if (movement.tipo !== 'adelanto' || movement.medio.replaceAll(' ', '') !== 'mercadopago') continue
    bruto += movement.monto
    const settlement = settlements.get(movement.movimiento_id)
    if (settlement?.deducciones === null || settlement?.netoRecibido === null || !settlement) {
      pendientes += 1
      continue
    }
    deducciones += settlement.deducciones
    netoRecibido += settlement.netoRecibido
  }

  return {
    bruto,
    deducciones: pendientes ? null : deducciones,
    netoRecibido: pendientes ? null : netoRecibido,
    pendientes,
  }
}
