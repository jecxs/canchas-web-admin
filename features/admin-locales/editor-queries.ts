import 'server-only'

import { requireAdmin } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type {
  BenefitCatalogItem,
  LocalBenefit,
  LocalPhoto,
  LocalSettings,
  ScheduleRow,
} from '@/features/local-settings/types'
import type { CourtItem, SportOption } from '@/features/courts/types'

export type AdminLocalEditorData = {
  settings: LocalSettings
  schedules: ScheduleRow[]
  photos: LocalPhoto[]
  benefitCatalog: BenefitCatalogItem[]
  benefits: LocalBenefit[]
  // La RPC `obtener_minimo_adelanto_global` solo responde a dueños con local
  // operativo. Para el superadministrador puede ser null; la base valida el
  // mínimo real mediante el trigger `fn_validar_porcentaje_adelanto`.
  minimumAdvancePercentage: number | null
  sports: SportOption[]
  courts: CourtItem[]
}

export async function getAdminLocalEditor(localId: string): Promise<AdminLocalEditorData> {
  await requireAdmin()
  const supabase = await createClient()

  const [
    settingsResult,
    schedulesResult,
    photosResult,
    catalogResult,
    benefitsResult,
    sportsResult,
    courtsResult,
  ] = await Promise.all([
    supabase
      .from('locales')
      .select(
        'id,nombre,descripcion,ruc,telefono_contacto_principal,telefono_contacto_secundario,direccion,latitud,longitud,porcentaje_adelanto,medios_pago_adelanto,politica_reembolso,logo,publicado',
      )
      .eq('id', localId)
      .single(),
    supabase
      .from('horarios_atencion')
      .select('dia_semana,hora_apertura,hora_cierre')
      .eq('local_id', localId)
      .order('dia_semana'),
    supabase
      .from('fotos')
      .select('id,storage_path,orden,oculta')
      .eq('local_id', localId)
      .order('orden'),
    supabase
      .from('beneficios_catalogo')
      .select('id,slug,nombre,categoria,icon_key,orden')
      .eq('activo', true)
      .order('orden'),
    supabase
      .from('local_beneficios')
      .select('beneficio_catalogo_id,nombre_personalizado')
      .eq('local_id', localId)
      .order('created_at'),
    supabase.from('deportes').select('id,nombre,icono').order('nombre'),
    supabase
      .from('canchas')
      .select(
        'id,nombre,superficie,activa,cancha_deportes(deporte_id,tipo_soporte,precio_por_hora,deportes(nombre))',
      )
      .eq('local_id', localId)
      .order('created_at'),
  ])

  if (settingsResult.error || !settingsResult.data) {
    console.error('[admin-locales:editor]', {
      code: settingsResult.error?.code,
    })
    throw new Error('No se pudo cargar la edición del local.')
  }

  if (schedulesResult.error || photosResult.error || catalogResult.error || benefitsResult.error || sportsResult.error || courtsResult.error) {
    console.error('[admin-locales:editor-relations]', {
      code:
        schedulesResult.error?.code ??
        photosResult.error?.code ??
        catalogResult.error?.code ??
        benefitsResult.error?.code ??
        sportsResult.error?.code ??
        courtsResult.error?.code,
    })
  }

  return {
    settings: settingsResult.data as LocalSettings,
    schedules: (schedulesResult.data ?? []) as ScheduleRow[],
    photos: (photosResult.data ?? []) as LocalPhoto[],
    benefitCatalog: (catalogResult.data ?? []) as BenefitCatalogItem[],
    benefits: (benefitsResult.data ?? []) as LocalBenefit[],
    minimumAdvancePercentage: null,
    sports: (sportsResult.data ?? []).map((sport) => ({
      id: sport.id,
      name: sport.nombre,
      icon: sport.icono,
    })) as SportOption[],
    courts: (courtsResult.data ?? []).map((court) => ({
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
