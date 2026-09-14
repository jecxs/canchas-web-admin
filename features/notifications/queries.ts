import 'server-only'

import { requireOwner } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'

export type OwnerNotification = {
  id: string
  recipientId: string
  title: string
  message: string
  href: string | null
  readAt: string | null
  createdAt: string
  type: string
  reservationId: string | null
}

export async function getOwnerNotifications({ limit = 20, before }: { limit?: number; before?: string } = {}): Promise<OwnerNotification[]> {
  const context = await requireOwner()
  const supabase = await createClient()
  let query = supabase
    .from('notificaciones')
    .select('id,destinatario_id,reserva_id,titulo,mensaje,href,leida_at,created_at,tipo')
    .eq('destinatario_id', context.userId)
    .order('created_at', { ascending: false })

  if (before) query = query.lt('created_at', before)
  const { data, error } = await query.limit(limit)

  if (error) {
    console.error('[notifications:read]', { code: error.code, message: error.message })
    return []
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    recipientId: item.destinatario_id,
    title: item.titulo,
    message: item.mensaje,
    href: item.href,
    readAt: item.leida_at,
    createdAt: item.created_at,
    type: item.tipo,
    reservationId: item.reserva_id,
  }))
}
