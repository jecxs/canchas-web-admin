export const ownerApplicationMessages = {
  invalidFields: 'Revisa los campos indicados',
  sessionExpired: 'Tu sesión expiró',
  permissionDenied: 'No tienes permiso para realizar esta acción',
  activeApplication: 'Ya tienes una solicitud activa en proceso de revisión',
  operationFailed: 'No se pudo completar la operación',
  submitted: 'Solicitud enviada',
} as const

export function translateOwnerApplicationError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return ownerApplicationMessages.operationFailed
  }

  const candidate = error as { code?: unknown; status?: unknown }
  const code = typeof candidate.code === 'string' ? candidate.code : ''
  const status = typeof candidate.status === 'number' ? candidate.status : null

  if (status === 401 || code === 'PGRST301' || code === 'refresh_token_not_found') {
    return ownerApplicationMessages.sessionExpired
  }

  if (status === 403 || code === '42501') {
    return ownerApplicationMessages.permissionDenied
  }

  if (['22P02', '23502', '23503', '23505', '23514'].includes(code)) {
    return ownerApplicationMessages.invalidFields
  }

  return ownerApplicationMessages.operationFailed
}
