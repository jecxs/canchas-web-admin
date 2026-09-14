'use server'

import { revalidatePath } from 'next/cache'
import { requireOwner } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { getOwnerNotifications } from './queries'

export async function markOwnerNotificationsReadAction(notificationId?: string) {
  await requireOwner()
  const supabase = await createClient()
  const { error } = await supabase.rpc('marcar_notificaciones_leidas_dueno', {
    p_notificacion_id: notificationId,
  })
  if (error) {
    console.error('[notifications:mark-read]', { code: error.code, message: error.message })
    throw new Error('No se pudieron actualizar las notificaciones.')
  }
  revalidatePath('/panel', 'layout')
}

export async function loadOwnerNotificationsAction(before?: string) {
  return getOwnerNotifications({ limit: 20, before })
}
