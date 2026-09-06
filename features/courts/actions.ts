'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { courtSchema, courtStatusSchema } from './schema'
import type { CourtActionState } from './types'

const invalid = (fieldErrors?: Record<string, string[] | undefined>): CourtActionState => ({ success: false, message: 'Revisa los campos indicados', fieldErrors })

function finish(): CourtActionState {
  revalidatePath('/panel')
  revalidatePath('/panel/canchas')
  return { success: true, message: 'Cambios guardados' }
}

export async function saveCourtAction(_state: CourtActionState, formData: FormData): Promise<CourtActionState> {
  const sports = formData.getAll('sport').map((value) => ({
    deporte_id: value,
    tipo: formData.get(`support_${value}`),
    precio: formData.get(`price_${value}`),
  }))
  const validation = courtSchema.safeParse({
    localId: formData.get('localId'),
    courtId: formData.get('courtId') ?? '',
    name: formData.get('name'),
    surface: formData.get('surface'),
    sports,
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)

  const { local } = await requireOperationalOwnerLocal()
  if (local.id !== validation.data.localId) return { success: false, message: 'No tienes permiso para realizar esta acción' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('guardar_cancha_local', {
    p_local_id: local.id,
    p_cancha_id: validation.data.courtId as string,
    p_nombre: validation.data.name,
    p_superficie: validation.data.surface,
    p_deportes: validation.data.sports,
  })
  if (error) {
    console.error('[courts:save]', { code: error.code })
    return ['22P02', '23514', 'P0001'].includes(error.code) ? invalid() : { success: false, message: 'No se pudo completar la operación' }
  }
  return finish()
}

export async function changeCourtStatusAction(_state: CourtActionState, formData: FormData): Promise<CourtActionState> {
  const validation = courtStatusSchema.safeParse({
    localId: formData.get('localId'),
    courtId: formData.get('courtId'),
    active: formData.get('active'),
  })
  if (!validation.success) return invalid(validation.error.flatten().fieldErrors)

  const { local } = await requireOperationalOwnerLocal()
  if (local.id !== validation.data.localId) return { success: false, message: 'No tienes permiso para realizar esta acción' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('cambiar_estado_cancha_local', {
    p_local_id: local.id,
    p_cancha_id: validation.data.courtId,
    p_activa: validation.data.active,
  })
  if (error) {
    console.error('[courts:status]', { code: error.code })
    return error.code === '23514'
      ? { success: false, message: 'No se puede desactivar una cancha con reservas futuras' }
      : { success: false, message: 'No se pudo completar la operación' }
  }
  return finish()
}
