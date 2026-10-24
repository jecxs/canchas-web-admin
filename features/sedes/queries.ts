import 'server-only'

import { requireOwner } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'

export type SedesSummary = {
  sedesIncluidas: number
  sedesExtraContratadas: number
  maxSedes: number
  sedesUsadas: number
  asientosDisponibles: number
  puedeCrearSede: boolean
}

export type SedeCreationDefaults = {
  ruc: string
  phone: string
  latitude: number | null
  longitude: number | null
}

function toLocalPhone(value: string | null | undefined) {
  const digits = (value ?? '').replace(/\D/g, '')
  if (digits.startsWith('51') && digits.length > 9) return digits.slice(-9)
  return digits.length === 9 ? digits : ''
}

export async function getSedesSummary(): Promise<SedesSummary | null> {
  await requireOwner()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('billing_obtener_resumen_sedes')

  if (error) {
    console.error('[sedes:summary]', { code: error.code })
    throw new Error('No se pudo cargar el cupo de sedes.')
  }

  const row = data?.[0]
  if (!row) return null

  return {
    sedesIncluidas: row.sedes_incluidas,
    sedesExtraContratadas: row.sedes_extra_contratadas,
    maxSedes: row.max_sedes,
    sedesUsadas: row.sedes_usadas,
    asientosDisponibles: row.asientos_disponibles,
    puedeCrearSede: row.puede_crear_sede,
  }
}

export async function getSedeCreationDefaults(): Promise<SedeCreationDefaults> {
  const context = await requireOwner()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('locales')
    .select('ruc,telefono_contacto_principal,latitud,longitud')
    .eq('dueno_id', context.userId)
    .neq('estado', 'rechazado')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[sedes:creation-defaults]', { code: error.code })
  }

  return {
    ruc: data?.ruc ?? '',
    phone: toLocalPhone(data?.telefono_contacto_principal) || toLocalPhone(context.profile.telefono),
    latitude: data?.latitud ?? null,
    longitude: data?.longitud ?? null,
  }
}
