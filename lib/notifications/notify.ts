'use client'

import { sileo, type SileoOptions } from 'sileo'

export const notificationMessages = {
  changesSaved: 'Cambios guardados',
  reservationUpdated: 'Reserva actualizada',
  operationFailed: 'No se pudo completar la operación',
  sessionExpired: 'Tu sesión expiró',
  permissionDenied: 'No tienes permiso para realizar esta acción',
  scheduleChanged: 'El horario acaba de cambiar',
  checkFields: 'Revisa los campos indicados',
} as const

export type NotificationMessage =
  (typeof notificationMessages)[keyof typeof notificationMessages]

type NotifyOptions = Omit<SileoOptions, 'title' | 'type'> & {
  title?: NotificationMessage
}

type PromiseOptions = {
  loading?: NotificationMessage
  success?: NotificationMessage
  error?: NotificationMessage
}

export const notify = {
  success(options: NotifyOptions = {}) {
    return sileo.success({
      ...options,
      title: options.title ?? notificationMessages.changesSaved,
    })
  },
  error(options: NotifyOptions = {}) {
    return sileo.error({
      ...options,
      title: options.title ?? notificationMessages.operationFailed,
    })
  },
  warning(options: NotifyOptions = {}) {
    return sileo.warning({
      ...options,
      title: options.title ?? notificationMessages.checkFields,
    })
  },
  info(options: NotifyOptions = {}) {
    return sileo.info({
      ...options,
      title: options.title ?? notificationMessages.scheduleChanged,
    })
  },
  promise<T>(promise: Promise<T> | (() => Promise<T>), options: PromiseOptions = {}) {
    return sileo.promise(promise, {
      loading: { title: options.loading ?? 'Procesando…' },
      success: { title: options.success ?? notificationMessages.changesSaved },
      error: { title: options.error ?? notificationMessages.operationFailed },
    })
  },
}

export function getSafeErrorMessage(
  error: unknown,
  fallback: NotificationMessage = notificationMessages.operationFailed,
): NotificationMessage {
  if (!error || typeof error !== 'object') return fallback

  const candidate = error as { code?: unknown; status?: unknown }
  const code = typeof candidate.code === 'string' ? candidate.code : ''
  const status = typeof candidate.status === 'number' ? candidate.status : null

  if (status === 401 || code === 'PGRST301' || code === 'refresh_token_not_found') {
    return notificationMessages.sessionExpired
  }

  if (status === 403 || code === '42501') {
    return notificationMessages.permissionDenied
  }

  if (['22P02', '23502', '23503', '23505', '23514'].includes(code)) {
    return notificationMessages.checkFields
  }

  if (['23P01', 'GRASSLY_SLOT_CHANGED', 'GRASSLY_RESERVATION_CONFLICT'].includes(code)) {
    return notificationMessages.scheduleChanged
  }

  return fallback
}
