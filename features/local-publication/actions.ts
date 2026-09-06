'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireOperationalOwnerLocal } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { PublicationActionState } from './types'

const messages = {
  changesSaved: 'Cambios guardados',
  operationFailed: 'No se pudo completar la operación',
  permissionDenied: 'No tienes permiso para realizar esta acción',
  checkFields: 'Revisa los campos indicados',
} as const

const publicationSchema = z.object({
  localId: z.uuid(),
  published: z.enum(['true', 'false']).transform((value) => value === 'true'),
})

export async function changePublicationAction(
  _state: PublicationActionState,
  formData: FormData,
): Promise<PublicationActionState> {
  const { local } = await requireOperationalOwnerLocal()
  const validation = publicationSchema.safeParse({
    localId: formData.get('localId'),
    published: formData.get('published'),
  })

  if (!validation.success || validation.data.localId !== local.id) {
    return { success: false, message: messages.permissionDenied }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('cambiar_publicacion_local', {
    p_local_id: local.id,
    p_publicado: validation.data.published,
  })

  if (error) {
    console.error('[local-publication:change]', { code: error.code })
    return {
      success: false,
      message: ['23514', 'P0001'].includes(error.code)
        ? messages.checkFields
        : messages.operationFailed,
    }
  }

  revalidatePath('/panel')
  return { success: true, message: messages.changesSaved }
}
