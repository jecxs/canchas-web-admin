import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { isIsoDate, todayLima } from '../reportes/date-utils'
import { getMercadoPagoSettlements, summarizeMercadoPago } from './mercadopago-settlements'
import type { CajaMedioTipo, CajaMovement, CajaReport } from './types'

const MEDIO_LABELS: Record<CajaMedioTipo, string> = {
  mercadopago: 'Mercado Pago',
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  comprobante: 'Comprobante',
  manual: 'Registro manual',
  otro: 'Otro',
  reembolso: 'Reembolso',
}

export async function getCajaReport(input: {
  start?: string
  end?: string
}): Promise<CajaReport> {
  const { local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const today = todayLima()
  let start = isIsoDate(input.start) ? input.start : today
  let end = isIsoDate(input.end) ? input.end : today
  if (start > end) [start, end] = [end, start]

  const [{ data, error }, settlements] = await Promise.all([
    supabase.rpc('obtener_caja_local', {
      p_local_id: local.id,
      p_desde: start,
      p_hasta: end,
    }),
    getMercadoPagoSettlements(supabase, local.id, start, end),
  ])

  if (error) {
    console.error('[caja:rpc]', { code: error.code, message: error.message })
    throw new Error('No se pudieron cargar los movimientos de caja.')
  }

  const movements = ((data ?? []) as CajaMovement[]).map((movement) => ({
    ...movement,
    monto: Number(movement.monto) || 0,
    deducciones: settlements.get(movement.movimiento_id)?.deducciones ?? null,
    netoRecibido: settlements.get(movement.movimiento_id)?.netoRecibido ?? null,
  }))

  const byMethodMap = new Map<string, { amount: number; count: number }>()
  let collected = 0
  let mercadopago = 0
  let comprobante = 0
  let reembolsos = 0
  let count = 0

  for (const movement of movements) {
    if (movement.tipo === 'reembolso') {
      reembolsos += Math.abs(movement.monto)
      continue
    }

    const amount = movement.monto
    collected += amount
    count += 1

    if (movement.medio_tipo === 'mercadopago') {
      mercadopago += amount
    } else {
      comprobante += amount
    }

    const bucket = byMethodMap.get(movement.medio_tipo) ?? { amount: 0, count: 0 }
    bucket.amount += amount
    bucket.count += 1
    byMethodMap.set(movement.medio_tipo, bucket)
  }

  const byMethod = [...byMethodMap.entries()]
    .map(([id, value]) => ({
      id,
      label: MEDIO_LABELS[id as CajaMedioTipo] ?? id,
      amount: value.amount,
      count: value.count,
    }))
    .sort((a, b) => b.amount - a.amount)

  const mercadoPago = summarizeMercadoPago(
    movements.map((movement) => ({
      movimiento_id: movement.movimiento_id,
      monto: movement.monto,
      medio: movement.medio_tipo,
      tipo: movement.tipo,
    })),
    settlements,
  )

  return {
    localId: local.id,
    localName: local.nombre,
    start,
    end,
    today,
    totals: { collected, mercadopago, comprobante, reembolsos, neto: collected - reembolsos, count },
    mercadoPago,
    byMethod,
    movements,
  }
}
