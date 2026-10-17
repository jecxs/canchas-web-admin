import 'server-only'

import { requireAdmin } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { PLATFORM_PARAMETER_KEYS } from './types'
import type { PlatformParameterKey, PlatformParameterRow } from './types'

function readValue(raw: unknown): number | string[] | null {
  if (typeof raw === 'number') return raw
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === 'string')
  if (typeof raw === 'string' && raw.trim()) {
    const asNumber = Number(raw)
    return Number.isFinite(asNumber) ? asNumber : null
  }
  return null
}

export async function getPlatformParameters(): Promise<PlatformParameterRow[]> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('obtener_parametros_plataforma')

  if (error) {
    console.error('[admin-platform:parameters]', { code: error.code })
    throw new Error('No se pudieron cargar los parámetros de la plataforma.')
  }

  const rows = new Map<string, PlatformParameterRow>()

  for (const key of PLATFORM_PARAMETER_KEYS) {
    rows.set(key, { key, value: null, description: null })
  }

  for (const entry of data ?? []) {
    if (!PLATFORM_PARAMETER_KEYS.includes(entry.clave as PlatformParameterKey)) continue
    rows.set(entry.clave, {
      key: entry.clave as PlatformParameterKey,
      value: readValue(entry.valor),
      description: entry.descripcion,
    })
  }

  return PLATFORM_PARAMETER_KEYS.map((key) => rows.get(key)!).filter(Boolean)
}

// Porcentajes de adelanto ya configurados por los locales. Permite calcular en
// vivo cuántos quedarían inválidos antes de subir el mínimo global, sin
// depender de un viaje al servidor que rechace el guardado.
export async function getAdvancePercentageValues(): Promise<number[]> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('locales')
    .select('porcentaje_adelanto')
    .not('porcentaje_adelanto', 'is', null)

  if (error) {
    console.error('[admin-platform:advance-values]', { code: error.code })
    return []
  }

  return (data ?? [])
    .map((local) => Number(local.porcentaje_adelanto))
    .filter((value) => Number.isFinite(value))
}