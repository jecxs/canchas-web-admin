import 'server-only'

import { createClient } from '@/utils/supabase/server'

export type AdvanceAlert = {
  current: number
  minimum: number
}

/**
 * Aviso para el dueño cuando su porcentaje de adelanto quedó por debajo del
 * mínimo global vigente.
 *
 * Es importante porque el trigger `fn_validar_porcentaje_adelanto` corre en
 * cada UPDATE de `locales`: mientras el porcentaje guardado sea menor al
 * mínimo, la base rechaza cualquier edición del local, no solo la del
 * porcentaje.
 *
 * Devuelve null cuando no hay nada que avisar: sin porcentaje configurado (el
 * trigger lo omite), cuando ya cumple el mínimo, o cuando la RPC no responde
 * porque el dueño no tiene un local operativo.
 */
export async function getAdvanceAlert(local: {
  porcentaje_adelanto: number | null
}): Promise<AdvanceAlert | null> {
  if (local.porcentaje_adelanto === null) return null

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('obtener_minimo_adelanto_global')

  if (error) {
    // 42501: el dueño no tiene un local operativo, así que no hay política que mostrar.
    if (error.code !== '42501') {
      console.error('[local-settings:advance-alert]', { code: error.code })
    }
    return null
  }

  const minimum = Number(data)
  if (!Number.isFinite(minimum) || minimum < 1 || minimum > 100) return null
  if (local.porcentaje_adelanto >= minimum) return null

  return { current: local.porcentaje_adelanto, minimum }
}