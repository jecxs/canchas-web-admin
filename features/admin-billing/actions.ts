'use server'

import { revalidatePath } from 'next/cache'
import { isSuperAdmin } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'

export type SubscriptionPriceState = {
  success: boolean
  message?: string
}

export const initialSubscriptionPriceState: SubscriptionPriceState = { success: false }

function numberFrom(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? '').trim()
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

export async function publishSubscriptionPriceAction(
  _previous: SubscriptionPriceState,
  formData: FormData,
): Promise<SubscriptionPriceState> {
  try {
    if (!await isSuperAdmin()) {
      return { success: false, message: 'No tienes permiso para publicar precios de suscripción.' }
    }

    const base = numberFrom(formData, 'monto_base')
    const extra = numberFrom(formData, 'monto_sede_extra')
    const included = numberFrom(formData, 'sedes_incluidas')
    const graceDays = numberFrom(formData, 'dias_gracia')

    if (
      base === null || extra === null || included === null || graceDays === null ||
      base < 0 || base > 100000 || extra < 0 || extra > 100000 ||
      !Number.isInteger(included) || included < 1 || included > 1000 ||
      !Number.isInteger(graceDays) || graceDays < 0 || graceDays > 30
    ) {
      return { success: false, message: 'Revisa los importes, sedes incluidas y días de gracia.' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('billing_publicar_precio_suscripcion', {
      p_monto_base: base,
      p_monto_sede_extra: extra,
      p_sedes_incluidas: included,
      p_dias_gracia: graceDays,
    })

    if (error) {
      if (['42501', '23514', '22023'].includes(error.code)) {
        return { success: false, message: error.message }
      }
      console.error('[admin-billing:publish-price]', { code: error.code, message: error.message })
      return { success: false, message: 'No se pudo publicar la nueva versión de precio.' }
    }

    const version = data?.[0]?.version
    revalidatePath('/admin/configuracion')
    revalidatePath('/panel/suscripcion')
    return {
      success: true,
      message: version
        ? `Versión ${version} publicada. Solo se aplicará a nuevos checkouts.`
        : 'Precio publicado. Solo se aplicará a nuevos checkouts.',
    }
  } catch (error) {
    console.error('[admin-billing:publish-price] unexpected', error)
    return { success: false, message: 'No se pudo publicar la nueva versión de precio. Inténtalo nuevamente.' }
  }
}
