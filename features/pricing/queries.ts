import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { Json } from '@/types/database.types'
import type { PricingRule, PricingRuleTarget, PricingSchedule, PricingTarget } from './types'

function parseRuleTargets(value: Json, targetsByKey: Map<string, PricingTarget>): PricingRuleTarget[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const courtId = typeof item.cancha_id === 'string' ? item.cancha_id : ''
    const sportId = typeof item.deporte_id === 'string' ? item.deporte_id : ''
    if (!courtId || !sportId) return []
    const known = targetsByKey.get(`${courtId}:${sportId}`)
    if (known) return [known]
    const basePrice = typeof item.tarifa_base_por_hora === 'number' ? item.tarifa_base_por_hora : 0
    return [{
      courtId,
      sportId,
      courtName: typeof item.cancha_nombre === 'string' ? item.cancha_nombre : 'Cancha',
      sportName: typeof item.deporte_nombre === 'string' ? item.deporte_nombre : 'Deporte',
      basePrice,
      courtActive: false,
    }]
  })
}

export async function getPricingConfiguration() {
  const { local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const [rulesResult, courtsResult, schedulesResult] = await Promise.all([
    supabase.rpc('obtener_reglas_tarifarias_dueno', { p_local_id: local.id }),
    supabase
      .from('canchas')
      .select('id,nombre,activa,cancha_deportes(deporte_id,precio_por_hora,deportes(nombre))')
      .eq('local_id', local.id)
      .order('created_at'),
    supabase
      .from('horarios_atencion')
      .select('dia_semana,hora_apertura,hora_cierre')
      .eq('local_id', local.id)
      .order('dia_semana'),
  ])

  if (rulesResult.error || courtsResult.error || schedulesResult.error) {
    console.error('[pricing:read]', {
      code: rulesResult.error?.code ?? courtsResult.error?.code ?? schedulesResult.error?.code,
    })
    throw new Error('No se pudo cargar la configuración de tarifas.')
  }

  const targets = (courtsResult.data ?? []).flatMap((court) => court.cancha_deportes.flatMap((relation) => {
    if (relation.precio_por_hora == null || relation.precio_por_hora <= 0) return []
    return [{
      courtId: court.id,
      courtName: court.nombre,
      courtActive: court.activa,
      sportId: relation.deporte_id,
      sportName: relation.deportes.nombre,
      basePrice: relation.precio_por_hora,
    }]
  })) satisfies PricingTarget[]

  const targetsByKey = new Map(targets.map((target) => [`${target.courtId}:${target.sportId}`, target]))
  const rules = (rulesResult.data ?? []).map((rule) => ({
    id: rule.id,
    name: rule.nombre,
    type: rule.tipo,
    days: rule.dias_semana,
    startTime: rule.hora_inicio.slice(0, 5),
    endTime: rule.hora_fin.slice(0, 5),
    startDate: rule.fecha_inicio,
    endDate: rule.fecha_fin,
    adjustmentType: rule.tipo_ajuste,
    hourlyPrice: rule.precio_por_hora,
    discountPercentage: rule.descuento_porcentaje,
    active: rule.activo,
    targets: parseRuleTargets(rule.objetivos, targetsByKey),
    createdAt: rule.created_at,
    updatedAt: rule.updated_at,
  })) satisfies PricingRule[]

  const schedules = (schedulesResult.data ?? []).map((schedule) => ({
    day: schedule.dia_semana,
    openingTime: schedule.hora_apertura.slice(0, 5),
    closingTime: schedule.hora_cierre.slice(0, 5),
  })) satisfies PricingSchedule[]

  return { local, targets, rules, schedules }
}
