import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { isIsoDate, todayLima } from '../reportes/date-utils'
import { getMercadoPagoSettlements, summarizeMercadoPago } from './mercadopago-settlements'
import { getExceptionalEvents } from './exceptional-entries'
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

  const [{ data, error }, settlements, exceptionalEvents, { data: methods, error: methodsError }, { data: courts, error: courtsError }] = await Promise.all([
    supabase.rpc('obtener_caja_local', {
      p_local_id: local.id,
      p_desde: start,
      p_hasta: end,
    }),
    getMercadoPagoSettlements(supabase, local.id, start, end),
    getExceptionalEvents(supabase, local.id, start, end),
    supabase.from('local_medios_pago').select('id,tipo,nombre_visible').eq('local_id', local.id).eq('activo', true).order('created_at'),
    supabase.from('canchas').select('id,nombre').eq('local_id', local.id).order('nombre'),
  ])

  if (error) {
    console.error('[caja:rpc]', { code: error.code, message: error.message })
    throw new Error('No se pudieron cargar los movimientos de caja.')
  }
  if (methodsError || courtsError) throw new Error('No se pudieron cargar los datos de Caja.')

  const courtNames = new Map((courts ?? []).map((court) => [court.id, court.nombre]))
  const reservationMovements = ((data ?? []) as CajaMovement[]).map((movement) => ({
    ...movement,
    monto: Number(movement.monto) || 0,
    deducciones: settlements.get(movement.movimiento_id)?.deducciones ?? null,
    netoRecibido: settlements.get(movement.movimiento_id)?.netoRecibido ?? null,
  }))
  const exceptionalMovements: CajaMovement[] = exceptionalEvents.map((event) => ({
    movimiento_id: event.id,
    reserva_id: null,
    cancha_id: event.courtId,
    cancha_nombre: event.courtId ? courtNames.get(event.courtId) ?? 'Cancha anterior' : '—',
    cliente: 'Ingreso excepcional',
    fecha: event.date,
    created_at: event.at,
    tipo: event.type,
    monto: event.amount,
    medio_tipo: event.method as CajaMedioTipo,
    referencia: null,
    notas: event.type === 'anulacion' ? `Anulación de: ${event.concept}. Motivo: ${event.voidReason}` : event.concept,
    ingreso_excepcional_id: event.entryId,
    fecha_actividad: event.activityDate,
    anulado: event.voided,
  }))
  const movements = [...reservationMovements, ...exceptionalMovements].sort((a, b) => b.created_at.localeCompare(a.created_at))

  const byMethodMap = new Map<string, { amount: number; count: number }>()
  let collected = 0
  let mercadopago = 0
  let comprobante = 0
  let reembolsos = 0
  let anulaciones = 0
  let excepcionales = 0
  let count = 0

  for (const movement of movements) {
    if (movement.tipo === 'reembolso') {
      reembolsos += Math.abs(movement.monto)
      continue
    }
    if (movement.tipo === 'anulacion') {
      anulaciones += Math.abs(movement.monto)
      const bucket = byMethodMap.get(movement.medio_tipo) ?? { amount: 0, count: 0 }
      bucket.amount += movement.monto
      byMethodMap.set(movement.medio_tipo, bucket)
      continue
    }

    const amount = movement.monto
    if (movement.tipo === 'excepcional') excepcionales += amount
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
    reservationMovements.map((movement) => ({
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
    totals: { collected, mercadopago, comprobante, reembolsos, anulaciones, excepcionales, neto: collected - reembolsos - anulaciones, count },
    mercadoPago,
    byMethod,
    movements,
    paymentMethods: (methods ?? []).map((method) => ({ id: method.id, type: method.tipo, name: method.nombre_visible })),
    courts: (courts ?? []).map((court) => ({ id: court.id, name: court.nombre })),
  }
}
