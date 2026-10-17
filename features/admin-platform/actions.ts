'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { isSuperAdmin } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { PLATFORM_PARAMETER_KEYS } from './types'
import type { PlatformParameterKey, PlatformParameterState } from './types'

const messages = {
  saved: 'Parámetro actualizado',
  denied: 'No tienes permiso para modificar los parámetros de la plataforma',
  invalid: 'Revisa el valor indicado',
  failed: 'No se pudo actualizar el parámetro',
} as const

function parseValue(key: PlatformParameterKey, raw: string): number | string[] | null {
  if (key === 'palabras_prohibidas') {
    return raw
      .split(/[\n,]/)
      .map((word) => word.trim())
      .filter(Boolean)
      .slice(0, 500)
  }

  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

export async function updatePlatformParameterAction(
  _state: PlatformParameterState,
  formData: FormData,
): Promise<PlatformParameterState> {
  const key = String(formData.get('clave') ?? '') as PlatformParameterKey
  if (!PLATFORM_PARAMETER_KEYS.includes(key)) {
    return { success: false, message: messages.invalid }
  }

  if (!await isSuperAdmin()) {
    return { success: false, message: messages.denied }
  }

  const rawValue = String(formData.get('valor') ?? '')
  const value = parseValue(key, rawValue)

  if (value === null || (Array.isArray(value) && value.length === 0)) {
    return { success: false, message: messages.invalid }
  }

  const force = formData.get('force') === '1'
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('actualizar_parametro_plataforma', {
    p_clave: key,
    p_valor: value,
    p_forzar: force,
  })

  if (error) {
    // P0001: el nuevo mínimo dejaría locales por debajo del piso global. El
    // panel ya calcula ese impacto antes de enviar, así que llegar aquí suele
    // significar que otro local cambió mientras tanto.
    if (error.code === 'P0001') {
      const affected = Number(error.message.match(/Hay \((\d+)\)/)?.[1] ?? 0)
      const total = Number.isFinite(affected) ? affected : 0
      return {
        success: false,
        requiresForce: true,
        affectedLocals: total,
        message: `${total} ${total === 1 ? 'local tiene' : 'locales tienen'} un adelanto menor al nuevo mínimo. Márcalo como confirmado y vuelve a guardar.`,
      }
    }
    if (error.code === '42501') return { success: false, message: messages.denied }
    if (['23514', '22023', 'PGRST202'].includes(error.code)) {
      return { success: false, message: error.message || messages.invalid }
    }
    console.error('[admin-platform:update]', { code: error.code, message: error.message })
    return {
      success: false,
      message: error.message ? `${messages.failed}: ${error.message}` : messages.failed,
    }
  }

  const affected = data?.[0]?.locales_por_debajo ?? 0

  revalidatePath('/admin/configuracion')
  revalidatePath('/admin/locales')

  return {
    success: true,
    affectedLocals: affected,
    message:
      affected > 0
        ? `${messages.saved}. ${affected} ${affected === 1 ? 'local quedó' : 'locales quedaron'} por debajo del nuevo mínimo y no podrán guardar cambios hasta corregir su adelanto.`
        : messages.saved,
  }
}