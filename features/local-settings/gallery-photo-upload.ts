import { createClient } from '@/utils/supabase/client'
import { registerGalleryPath } from './media-actions'

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function uploadGalleryPhoto(localId: string, file: File, courtId?: string | null) {
  const extension = extensions[file.type]
  if (!extension || file.size === 0 || file.size > 5 * 1024 * 1024) {
    return { success: false, message: 'Usa JPG, PNG o WebP de máximo 5 MB.' }
  }

  const path = `${localId}/gallery-${crypto.randomUUID()}.${extension}`
  const supabase = createClient()
  try {
    const { error } = await supabase.storage.from('fotos-locales').upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
    if (error) {
      console.error('[local-media:upload]', { status: error.status })
      return { success: false, message: 'No se pudo subir la foto.' }
    }
    const result = await registerGalleryPath({ localId, path, courtId: courtId ?? null })
    if (!result.success) {
      const { error: cleanupError } = await supabase.storage.from('fotos-locales').remove([path])
      if (cleanupError) console.error('[local-media:upload-cleanup]', { status: cleanupError.status })
    }
    return result
  } catch (error) {
    console.error('[local-media:upload-failed]', error)
    return { success: false, message: 'No se pudo subir la foto.' }
  }
}
