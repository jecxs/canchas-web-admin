export type ReservationStatus =
  | 'pendiente_pago'
  | 'pendiente_validacion'
  | 'rechazada_pago'
  | 'confirmada'
  | 'completada'
  | 'no_show'
  | 'cancelada_cliente'
  | 'cancelada_local'
  | 'expirada'

export type ReservationChannel = 'app' | 'whatsapp' | 'presencial'

export type ReservationsFilters = {
  status?: ReservationStatus
  courtId?: string
  channel?: ReservationChannel
  from?: string
  to?: string
  page?: number
}

export type ReservationExtension = {
  id: string
  amount: number
  chargeStatus: string
  method: string | null
  notes: string | null
  createdAt: string
}

export type OwnerReservation = {
  id: string
  courtId: string
  courtName: string
  sportName: string
  customerName: string
  customerPhone: string | null
  start: string
  end: string
  status: ReservationStatus
  channel: ReservationChannel
  totalAmount: number
  advanceAmount: number
  isTimeException: boolean
  proofPath: string | null
  proofUrl: string | null
  proofUploadedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  rejectedAt: string | null
  rejectedReason: string | null
  rejectedComment: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  refundResult: string
  extensions: ReservationExtension[]
}

export type ReservationsData = {
  localId: string
  localName: string
  courts: Array<{ id: string; name: string }>
  reservations: OwnerReservation[]
  filters: Required<Pick<ReservationsFilters, 'page'>> & Omit<ReservationsFilters, 'page'>
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}
