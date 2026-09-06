'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAccessContext } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import { ownerApplicationMessages, translateOwnerApplicationError } from './messages'
import { ownerApplicationSchema } from './schema'
import type { OwnerApplicationActionState, OwnerApplicationFields } from './types'

function readTextField(formData: FormData, name: keyof OwnerApplicationFields) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export async function submitOwnerApplication(
  _previousState: OwnerApplicationActionState,
  formData: FormData,
): Promise<OwnerApplicationActionState> {
  const context = await getAccessContext()

  if (!context) {
    return { success: false, message: ownerApplicationMessages.sessionExpired }
  }

  const hasActiveApplication = context.locals.some(
    (local) => local.estado !== 'rechazado',
  )

  if (context.profile.rol !== 'cliente') {
    return { success: false, message: ownerApplicationMessages.permissionDenied }
  }

  if (hasActiveApplication) {
    return { success: false, message: ownerApplicationMessages.activeApplication }
  }

  const submittedFields: OwnerApplicationFields = {
    nombreLocal: readTextField(formData, 'nombreLocal'),
    telefono: readTextField(formData, 'telefono'),
    dni: readTextField(formData, 'dni'),
    direccion: readTextField(formData, 'direccion'),
    ruc: readTextField(formData, 'ruc'),
  }

  const validation = ownerApplicationSchema.safeParse(submittedFields)

  if (!validation.success) {
    return {
      success: false,
      message: ownerApplicationMessages.invalidFields,
      fieldErrors: validation.error.flatten().fieldErrors,
      values: submittedFields,
    }
  }

  const fields = validation.data
  const supabase = await createClient()
  const { error } = await supabase.rpc('registrar_solicitud_propietario', {
    p_telefono: fields.telefono,
    p_dni: fields.dni,
    p_nombre_local: fields.nombreLocal,
    p_ruc: fields.ruc,
    p_direccion: fields.direccion,
  })

  if (error) {
    console.error('[owner-onboarding:submit]', { code: error.code })
    return {
      success: false,
      message: translateOwnerApplicationError(error),
      values: fields,
    }
  }

  revalidatePath('/estado-solicitud')
  revalidatePath('/completar-registro')
  redirect('/estado-solicitud?enviada=1')
}
