'use server'

import 'server-only'
import { revalidatePath } from 'next/cache'
import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'

export async function setBirthdayAlertsAction(enabled: boolean): Promise<{ success: boolean; message?: string }> {
  if (typeof enabled !== 'boolean') return { success: false, message: 'Preferencia inválida.' }
  const { local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('actualizar_avisos_cumpleanos_local_dueno', {
    p_local_id: local.id,
    p_activos: enabled,
  })
  if (error || data !== enabled) {
    console.error('[clients:birthday-preference]', { code: error?.code, message: error?.message })
    return { success: false, message: 'No se pudo guardar la preferencia.' }
  }
  revalidatePath('/panel/clientes')
  return { success: true }
}
