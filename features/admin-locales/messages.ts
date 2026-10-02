export const adminLocalMessages = {
  sessionExpired: 'Tu sesión expiró',
  permissionDenied: 'No tienes permiso para realizar esta acción',
  invalidFields: 'Revisa los campos indicados',
  operationFailed: 'No se pudo completar la operación',
  publicationUpdated: 'Publicación actualizada',
  approvedForPayment: 'Local aprobado para pago',
  trialGranted: 'Periodo de prueba activado',
  rejected: 'Observación enviada al propietario',
} as const

export function translateAdminLocalError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return adminLocalMessages.operationFailed
  }

  const candidate = error as { code?: unknown; status?: unknown }
  const code = typeof candidate.code === 'string' ? candidate.code : ''
  const status = typeof candidate.status === 'number' ? candidate.status : null

  if (status === 401 || code === 'PGRST301' || code === 'refresh_token_not_found') {
    return adminLocalMessages.sessionExpired
  }

  if (status === 403 || code === '42501') {
    return adminLocalMessages.permissionDenied
  }

  if (['22P02', '23502', '23514'].includes(code)) {
    return adminLocalMessages.invalidFields
  }

  return adminLocalMessages.operationFailed
}
