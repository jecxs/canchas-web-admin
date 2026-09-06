export const adminApplicationMessages = {
  sessionExpired: 'Tu sesión expiró',
  permissionDenied: 'No tienes permiso para realizar esta acción',
  invalidFields: 'Revisa los campos indicados',
  operationFailed: 'No se pudo completar la operación',
} as const

export function translateAdminDecisionError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return adminApplicationMessages.operationFailed
  }

  const candidate = error as { code?: unknown; status?: unknown }
  const code = typeof candidate.code === 'string' ? candidate.code : ''
  const status = typeof candidate.status === 'number' ? candidate.status : null

  if (status === 401 || code === 'PGRST301' || code === 'refresh_token_not_found') {
    return adminApplicationMessages.sessionExpired
  }

  if (status === 403 || code === '42501') {
    return adminApplicationMessages.permissionDenied
  }

  if (['22P02', '23502', '23514'].includes(code)) {
    return adminApplicationMessages.invalidFields
  }

  return adminApplicationMessages.operationFailed
}
