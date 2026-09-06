import 'server-only'

import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { LocalPhoto, LocalSettings, ScheduleRow } from './types'

export async function getLocalSettings() {
  const { context, local } = await requireOperationalOwnerLocal()
  const supabase = await createClient()
  const [{ data: settings, error: settingsError }, { data: schedules, error: schedulesError }, { data: photos, error: photosError }] = await Promise.all([
    supabase
      .from('locales')
      .select('id,nombre,descripcion,ruc,telefono_contacto_principal,telefono_contacto_secundario,direccion,latitud,longitud,porcentaje_adelanto,medios_pago_adelanto,politica_reembolso,logo,publicado')
      .eq('id', local.id)
      .single(),
    supabase
      .from('horarios_atencion')
      .select('dia_semana,hora_apertura,hora_cierre')
      .eq('local_id', local.id)
      .order('dia_semana'),
    supabase
      .from('fotos')
      .select('id,storage_path,orden')
      .eq('local_id', local.id)
      .order('orden'),
  ])

  if (settingsError || schedulesError || photosError || !settings) {
    console.error('[local-settings:read]', { code: settingsError?.code ?? schedulesError?.code ?? photosError?.code })
    throw new Error('No se pudo cargar la configuración del local.')
  }

  return {
    context,
    local,
    settings: settings as LocalSettings,
    schedules: (schedules ?? []) as ScheduleRow[],
    photos: (photos ?? []) as LocalPhoto[],
  }
}
