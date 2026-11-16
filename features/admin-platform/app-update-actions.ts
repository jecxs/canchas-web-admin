'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { isSuperAdmin } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { AppUpdateActionState } from './types'

const deniedMessage = 'No tienes permiso para cambiar la política de versiones.'

export async function activateAndroidUpdateMinimumAction(
  _state: AppUpdateActionState,
  formData: FormData,
): Promise<AppUpdateActionState> {
  if (!await isSuperAdmin()) return { success: false, message: deniedMessage }
  if (formData.get('confirm') !== 'yes') {
    return { success: false, message: 'Confirma que Google Play ya muestra esta versión como disponible.' }
  }

  const versionCodeText = formData.get('version_code')
  const easBuildId = formData.get('eas_build_id')
  const versionCode = typeof versionCodeText === 'string' ? Number(versionCodeText) : NaN
  if (!Number.isSafeInteger(versionCode) || versionCode <= 0 || typeof easBuildId !== 'string' || !easBuildId) {
    return { success: false, message: 'La build confirmada no es válida. Actualiza la página y vuelve a revisarla.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('activar_version_candidata_android', {
    p_version_codigo_confirmada: versionCode,
    p_eas_build_id_confirmado: easBuildId,
  })
  if (error) {
    if (error.code === '42501') return { success: false, message: deniedMessage }
    if (error.code === '22023') {
      return { success: false, message: 'La candidata cambió o ya fue activada. Actualiza la página y confirma la build que aparece ahora.' }
    }
    console.error('[admin-platform:activate-android-minimum]', { code: error.code })
    return { success: false, message: 'No se pudo activar la versión mínima. Inténtalo nuevamente.' }
  }

  const activatedVersionCode = data?.[0]?.version_codigo_minima
  revalidatePath('/admin/configuracion')
  return {
    success: true,
    message: `Bloqueo activado. Las versiones de Android anteriores a ${activatedVersionCode} deberán actualizar desde Google Play.`,
  }
}

export async function deactivateAndroidUpdateMinimumAction(
  _state: AppUpdateActionState,
  formData: FormData,
): Promise<AppUpdateActionState> {
  if (!await isSuperAdmin()) return { success: false, message: deniedMessage }
  if (formData.get('confirm') !== 'yes') {
    return { success: false, message: 'Confirma que quieres permitir nuevamente el acceso a versiones anteriores.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('desactivar_version_minima_android')
  if (error) {
    if (error.code === '42501') return { success: false, message: deniedMessage }
    console.error('[admin-platform:deactivate-android-minimum]', { code: error.code })
    return { success: false, message: 'No se pudo desactivar el bloqueo. Inténtalo nuevamente.' }
  }

  revalidatePath('/admin/configuracion')
  return { success: true, message: 'Bloqueo desactivado. Las versiones anteriores volverán a poder abrir la app.' }
}
