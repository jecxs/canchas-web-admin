type DatabaseError = {
  code?: string
  message?: string
}

const FUTURE_RESERVATIONS_MESSAGE = 'No se puede desactivar porque la cancha tiene reservas futuras vigentes.'

export function getCourtStatusErrorMessage(error: DatabaseError) {
  const message = error.message?.toLowerCase() ?? ''
  const isFutureReservationError =
    error.code === '23514' ||
    (error.code === 'P0001' &&
      (message.includes('reserva') || message.includes('desactivar')))

  if (isFutureReservationError) return FUTURE_RESERVATIONS_MESSAGE

  if (error.code === '42P01') {
    return 'La configuración de canchas necesita actualizarse. Inténtalo nuevamente en unos minutos.'
  }

  return 'No se pudo completar la operación'
}

