import type { Enums, Tables } from '@/types/database.types'

export type ProfileSummary = Pick<
  Tables<'perfiles'>,
  'id' | 'nombre_completo' | 'email' | 'telefono' | 'dni' | 'rol'
>

export type SubscriptionSummary = Pick<
  Tables<'suscripciones'>,
  | 'id'
  | 'estado'
  | 'fecha_proximo_cobro'
  | 'monto'
  | 'sedes_extra_contratadas'
>

export type LocalSummary = Pick<
  Tables<'locales'>,
  | 'id'
  | 'nombre'
  | 'direccion'
  | 'ruc'
  | 'estado'
  | 'fecha_fin_trial'
  | 'motivo_rechazo'
  | 'publicado'
  | 'publicado_at'
  | 'created_at'
>

export type LocalState = Enums<'estado_local'>

export type AccessContext = {
  userId: string
  avatarUrl: string | null
  profile: ProfileSummary
  locals: LocalSummary[]
  subscription: SubscriptionSummary | null
}

export type AppDestination =
  | '/admin'
  | '/panel'
  | '/panel/suscripcion'
  | '/panel/suspendido'
  | '/panel/sin-local'
  | '/estado-solicitud'
  | '/completar-registro'

export const OPERATIONAL_LOCAL_STATES = [
  'trial',
  'activo',
  'en_gracia',
] as const satisfies readonly LocalState[]

export function isOperationalLocalState(state: LocalState) {
  return (OPERATIONAL_LOCAL_STATES as readonly LocalState[]).includes(state)
}

export function findLocalWithState(
  context: AccessContext,
  states: readonly LocalState[],
) {
  return context.locals.find((local) => states.includes(local.estado)) ?? null
}

export function resolveActiveLocal(
  locals: readonly LocalSummary[],
  requestedLocalId?: string,
) {
  const requestedLocal = requestedLocalId
    ? locals.find((local) => local.id === requestedLocalId)
    : null

  if (requestedLocal) {
    return requestedLocal
  }

  return (
    locals.find((local) => isOperationalLocalState(local.estado)) ??
    locals[0] ??
    null
  )
}

export function resolveLocalDestination(state: LocalState): AppDestination {
  if (isOperationalLocalState(state)) {
    return '/panel'
  }

  if (state === 'aprobado_pendiente_pago') {
    return '/panel/suscripcion'
  }

  if (state === 'suspendido') {
    return '/panel/suspendido'
  }

  return '/estado-solicitud'
}

export function resolvePostLoginDestination(
  context: AccessContext,
): AppDestination {
  if (context.profile.rol === 'super_admin') {
    return '/admin'
  }

  if (context.profile.rol === 'dueno') {
    if (findLocalWithState(context, OPERATIONAL_LOCAL_STATES)) {
      return '/panel'
    }

    if (findLocalWithState(context, ['aprobado_pendiente_pago'])) {
      return '/panel/suscripcion'
    }

    if (findLocalWithState(context, ['suspendido'])) {
      return '/panel/suspendido'
    }

    if (context.locals.length > 0) {
      return '/estado-solicitud'
    }

    return '/panel/sin-local'
  }

  if (context.locals.length > 0) {
    return '/estado-solicitud'
  }

  return '/completar-registro'
}
