'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { SettingsActionState } from './types'

const pathSchema = z.object({ localId: z.uuid(), path: z.string().min(40).max(300) })
const photoSchema = z.object({ localId: z.uuid(), photoId: z.uuid() })
const orderSchema = z.object({ localId: z.uuid(), photoIds: z.array(z.uuid()).max(12) })

async function ownLocal(localId: string) {
  const { local } = await requireOperationalOwnerLocal()
  return local.id === localId ? local : null
}

function done(): SettingsActionState {
  revalidatePath('/panel')
  revalidatePath('/panel/configuracion')
  return { success: true, message: 'Cambios guardados' }
}

export async function registerLogoPath(input: unknown): Promise<SettingsActionState> {
  const validation = pathSchema.safeParse(input)
  if (!validation.success || !await ownLocal(validation.data.localId)) return { success: false, message: 'No tienes permiso para realizar esta acción' }
  const supabase = await createClient()
  const { data: previousPath, error } = await supabase.rpc('actualizar_logo_local', {
    p_local_id: validation.data.localId,
    p_storage_path: validation.data.path,
  })
  if (error) {
    console.error('[local-media:logo]', { code: error.code })
    return { success: false, message: 'No se pudo completar la operación' }
  }
  if (previousPath && previousPath !== validation.data.path) {
    const { error: removeError } = await supabase.storage.from('logos-locales').remove([previousPath])
    if (removeError) console.error('[local-media:old-logo-cleanup]', { status: removeError.status })
  }
  return done()
}

export async function registerGalleryPath(input: unknown): Promise<SettingsActionState> {
  const validation = pathSchema.safeParse(input)
  if (!validation.success || !await ownLocal(validation.data.localId)) return { success: false, message: 'No tienes permiso para realizar esta acción' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('registrar_foto_local', {
    p_local_id: validation.data.localId,
    p_storage_path: validation.data.path,
  })
  if (error) {
    console.error('[local-media:gallery]', { code: error.code })
    return { success: false, message: error.code === '23514' ? 'Revisa los campos indicados' : 'No se pudo completar la operación' }
  }
  return done()
}

export async function deleteGalleryPhoto(input: unknown): Promise<SettingsActionState> {
  const validation = photoSchema.safeParse(input)
  if (!validation.success || !await ownLocal(validation.data.localId)) return { success: false, message: 'No tienes permiso para realizar esta acción' }
  const supabase = await createClient()
  const { data: path, error } = await supabase.rpc('eliminar_foto_local', {
    p_local_id: validation.data.localId,
    p_foto_id: validation.data.photoId,
  })
  if (error) {
    console.error('[local-media:delete]', { code: error.code })
    return { success: false, message: 'No se pudo completar la operación' }
  }
  if (path) {
    const { error: removeError } = await supabase.storage.from('fotos-locales').remove([path])
    if (removeError) console.error('[local-media:file-cleanup]', { status: removeError.status })
  }
  return done()
}

export async function reorderGalleryPhotos(input: unknown): Promise<SettingsActionState> {
  const validation = orderSchema.safeParse(input)
  if (!validation.success || !await ownLocal(validation.data.localId)) return { success: false, message: 'No tienes permiso para realizar esta acción' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('reordenar_fotos_local', {
    p_local_id: validation.data.localId,
    p_foto_ids: validation.data.photoIds,
  })
  if (error) {
    console.error('[local-media:reorder]', { code: error.code })
    return { success: false, message: 'No se pudo completar la operación' }
  }
  return done()
}
