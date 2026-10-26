'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ACTIVE_LOCAL_COOKIE, ACTIVE_LOCAL_COOKIE_OPTIONS, requireOwner } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { createSedeSchema } from './schema'
import type { SettingsActionState } from '@/features/local-settings/types'

export async function createSedeAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const validation = createSedeSchema.safeParse({
    name: formData.get('name'),
    ruc: formData.get('ruc'),
    description: formData.get('description'),
    primaryPhone: formData.get('primaryPhone'),
    secondaryPhone: formData.get('secondaryPhone'),
    address: formData.get('address'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
  })

  if (!validation.success) {
    return {
      success: false,
      message: 'Revisa los campos indicados',
      fieldErrors: validation.error.flatten().fieldErrors,
    }
  }

  await requireOwner()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('crear_sede_adicional', {
    p_nombre: validation.data.name,
    p_direccion: validation.data.address,
    p_telefono_principal: validation.data.primaryPhone,
    p_telefono_secundario: validation.data.secondaryPhone,
    p_ruc: validation.data.ruc,
    p_descripcion: validation.data.description,
    p_latitud: validation.data.latitude,
    p_longitud: validation.data.longitude,
  })

  if (error) {
    console.error('[sedes:create]', { code: error.code })
    if (error.code === '42501') {
      return {
        success: false,
        message: 'No tienes permisos o tu suscripción no está activa para crear otra sede.',
      }
    }
    if (['22023', '23514', 'P0001'].includes(error.code ?? '')) {
      return { success: false, message: error.message }
    }
    return { success: false, message: 'No se pudo crear la sede. Inténtalo de nuevo.' }
  }

  const created = data?.[0]
  if (!created) {
    return { success: false, message: 'No recibimos la confirmación de la sede creada.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_LOCAL_COOKIE, created.local_id, ACTIVE_LOCAL_COOKIE_OPTIONS)

  revalidatePath('/panel')
  revalidatePath('/panel/sedes')
  revalidatePath('/panel/configuracion')
  revalidatePath('/panel', 'layout')
  redirect('/panel/sedes?creada=1')
}
