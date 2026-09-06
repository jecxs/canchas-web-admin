import 'server-only'

import { requireAdmin } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { AdminApplication, AdminApplicationStatus } from './types'

const applicationStatuses = [
  'pendiente_aprobacion',
  'aprobado_pendiente_pago',
  'rechazado',
] satisfies AdminApplicationStatus[]

function mapApplication(row: {
  id: string
  dueno_id: string
  nombre: string
  direccion: string
  ruc: string | null
  estado: AdminApplicationStatus
  motivo_rechazo: string | null
  created_at: string
  fecha_aprobacion: string | null
  propietario: {
    nombre_completo: string
    email: string | null
    telefono: string | null
    dni: string | null
  }
}): AdminApplication {
  return {
    id: row.id,
    ownerId: row.dueno_id,
    name: row.nombre,
    address: row.direccion,
    ruc: row.ruc,
    status: row.estado,
    rejectionReason: row.motivo_rechazo,
    createdAt: row.created_at,
    approvedAt: row.fecha_aprobacion,
    owner: {
      name: row.propietario.nombre_completo,
      email: row.propietario.email,
      phone: row.propietario.telefono,
      dni: row.propietario.dni,
    },
  }
}

const applicationSelect = `
  id,
  dueno_id,
  nombre,
  direccion,
  ruc,
  estado,
  motivo_rechazo,
  created_at,
  fecha_aprobacion,
  propietario:perfiles!locales_dueno_id_fkey(
    nombre_completo,
    email,
    telefono,
    dni
  )
`

export async function getAdminApplications() {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('locales')
    .select(applicationSelect)
    .in('estado', applicationStatuses)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin-applications:list]', { code: error.code })
    throw new Error('No se pudieron cargar las solicitudes.')
  }

  return (data ?? []).map((row) => mapApplication(row as Parameters<typeof mapApplication>[0]))
}

export async function getAdminApplication(localId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('locales')
    .select(applicationSelect)
    .eq('id', localId)
    .in('estado', applicationStatuses)
    .maybeSingle()

  if (error) {
    console.error('[admin-applications:detail]', { code: error.code })
    throw new Error('No se pudo cargar la solicitud.')
  }

  return data
    ? mapApplication(data as Parameters<typeof mapApplication>[0])
    : null
}
