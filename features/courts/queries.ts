import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { CourtItem, SportOption } from './types'

export async function getCourtsConfiguration() {
  const { local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const [{ data: sports, error: sportsError }, { data: courts, error: courtsError }] = await Promise.all([
    supabase.from('deportes').select('id,nombre,icono').order('nombre'),
    supabase
      .from('canchas')
      .select('id,nombre,superficie,activa,cancha_deportes(deporte_id,tipo_soporte,precio_por_hora,deportes(nombre))')
      .eq('local_id', local.id)
      .order('created_at'),
  ])

  if (sportsError || courtsError) {
    console.error('[courts:read]', { code: sportsError?.code ?? courtsError?.code })
    throw new Error('No se pudieron cargar las canchas.')
  }

  return {
    local,
    sports: (sports ?? []).map((sport) => ({ id: sport.id, name: sport.nombre, icon: sport.icono })) as SportOption[],
    courts: (courts ?? []).map((court) => ({
      id: court.id,
      name: court.nombre,
      surface: court.superficie,
      active: court.activa,
      sports: court.cancha_deportes.map((relation) => ({
        sportId: relation.deporte_id,
        name: relation.deportes.nombre,
        support: relation.tipo_soporte,
        hourlyPrice: relation.precio_por_hora,
      })),
    })) as CourtItem[],
  }
}
