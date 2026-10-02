import 'server-only'

import { requireAdmin } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import {
  ADMIN_LOCAL_STATES,
  isAdminLocalState,
  type AdminLocalState,
} from '@/features/admin-locales/types'

export type AdminOverview = {
  locales: {
    total: number
    published: number
    byState: Record<AdminLocalState, number>
  }
  owners: number
  pendingApplications: number
  activeSubscriptions: number
  totalSubscriptions: number
}

export async function getAdminOverview(): Promise<AdminOverview> {
  await requireAdmin()
  const supabase = await createClient()

  const [localesResult, ownersResult, subscriptionsResult] = await Promise.all([
    supabase.from('locales').select('estado,publicado'),
    supabase.from('perfiles').select('id', { count: 'exact', head: true }).eq('rol', 'dueno'),
    supabase.from('suscripciones').select('estado'),
  ])

  if (localesResult.error || ownersResult.error || subscriptionsResult.error) {
    console.error('[admin-overview]', {
      code:
        localesResult.error?.code ??
        ownersResult.error?.code ??
        subscriptionsResult.error?.code,
    })
    throw new Error('No se pudo cargar el resumen administrativo.')
  }

  const byState = {} as Record<AdminLocalState, number>
  for (const state of ADMIN_LOCAL_STATES) byState[state] = 0

  let published = 0
  for (const row of localesResult.data ?? []) {
    if (isAdminLocalState(row.estado)) byState[row.estado] += 1
    if (row.publicado) published += 1
  }

  const subscriptions = subscriptionsResult.data ?? []

  return {
    locales: {
      total: localesResult.data?.length ?? 0,
      published,
      byState,
    },
    owners: ownersResult.count ?? 0,
    pendingApplications: byState.pendiente_aprobacion,
    activeSubscriptions: subscriptions.filter((subscription) => subscription.estado === 'activa').length,
    totalSubscriptions: subscriptions.length,
  }
}
