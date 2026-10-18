'use server'

import { revalidatePath } from 'next/cache'
import { isSuperAdmin } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'

export type GraceState = { success: boolean; message: string }
export const initialGraceState: GraceState = { success: false, message: '' }

export async function setOwnerGraceAction(_previous: GraceState, formData: FormData): Promise<GraceState> {
  if (!await isSuperAdmin()) return { success: false, message: 'No tienes permiso.' }
  const ownerId = String(formData.get('owner_id') ?? '')
  const raw = String(formData.get('days') ?? '').trim()
  const days = raw === '' ? undefined : Number(raw)
  if (!/^[0-9a-f-]{36}$/i.test(ownerId) || (days !== undefined && (!Number.isInteger(days) || days < 0 || days > 30))) {
    return { success: false, message: 'Ingresa entre 0 y 30 días, o deja vacío para usar el plan.' }
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc('billing_establecer_gracia_propietario', {
    p_dueno_id: ownerId, p_dias_gracia: days,
  })
  if (error) return { success: false, message: error.code === '42501' ? 'No tienes permiso.' : 'No se pudo guardar la excepción.' }
  revalidatePath(`/admin/propietarios/${ownerId}`)
  return { success: true, message: 'Excepción de gracia actualizada.' }
}
