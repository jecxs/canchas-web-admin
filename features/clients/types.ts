import type { ReservationChannel, ReservationStatus } from '@/features/reservations/types'

export type ClientsFilters = {
  courtIds: string[]
  query: string
  page: number
}

export type ClientSummary = {
  id: string
  clienteId: string | null
  name: string
  phone: string | null
  isAccount: boolean
  totalReservations: number
  confirmed: number
  completed: number
  pendingValidation: number
  noShows: number
  cancelled: number
  rejectedPayments: number
  totalAmount: number
  firstReservation: string
  lastReservation: string
  nextReservation: string | null
}

export type ClientReservation = {
  id: string
  courtId: string
  courtName: string
  sportId: string
  sportName: string | null
  start: string
  end: string
  status: ReservationStatus
  channel: ReservationChannel
  totalAmount: number
  advanceAmount: number
  isTimeException: boolean
  createdAt: string
}

export type ClientCourt = {
  id: string
  name: string
  sports: Array<{ id: string; name: string }>
}

export type ClientsData = {
  localId: string
  localName: string
  courts: ClientCourt[]
  clients: ClientSummary[]
  filters: ClientsFilters
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}
