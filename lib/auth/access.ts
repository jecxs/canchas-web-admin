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
  | 'estado_facturacion'
  | 'gracia_hasta'
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
  | 'porcentaje_adelanto'
  | 'created_at'
  | 'suspendido_por_facturacion'
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
  | '/panel/configuracion'
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

// Un local aprobado que puede contratar Billing. Incluye estados heredados
// (trial/activo/en_gracia) que quedaron sin suscripción tras activar el cobro.
export const SUBSCRIBABLE_LOCAL_STATES = [
  'aprobado_pendiente_pago',
  'trial',
  'activo',
  'en_gracia',
] as const satisfies readonly LocalState[]

export function isSubscribableLocalState(state: LocalState) {
  return (SUBSCRIBABLE_LOCAL_STATES as readonly LocalState[]).includes(state)
}

export function hasActiveSubscription(
  subscription: SubscriptionSummary | null | undefined,
) {
  return subscription?.estado_facturacion === 'activa'
}

export function canOperateLocal(
  local: LocalSummary,
  subscription: SubscriptionSummary | null,
) {
  if (local.estado === 'trial') {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date())
    const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
    const today = `${part('year')}-${part('month')}-${part('day')}`
    return Boolean(local.fecha_fin_trial && local.fecha_fin_trial >= today)
  }
  if (local.estado !== 'activo' && local.estado !== 'en_gracia') return false
  if (subscription?.estado_facturacion === 'activa') return true
  return subscription?.estado_facturacion === 'en_gracia'
    && Boolean(subscription.gracia_hasta && Date.parse(subscription.gracia_hasta) > Date.now())
}

export function canConfigurePaidPendingLocal(
  context: AccessContext,
  local: LocalSummary | null | undefined,
) {
  return (
    local?.estado === 'aprobado_pendiente_pago' &&
    hasActiveSubscription(context.subscription)
  )
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
    if (context.locals.some((local) => canOperateLocal(local, context.subscription))) {
      return '/panel'
    }

    if (findLocalWithState(context, OPERATIONAL_LOCAL_STATES)) {
      return '/panel/suscripcion'
    }

    if (
      hasActiveSubscription(context.subscription) &&
      findLocalWithState(context, ['aprobado_pendiente_pago'])
    ) {
      return '/panel/configuracion'
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
