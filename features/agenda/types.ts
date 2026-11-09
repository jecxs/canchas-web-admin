import type { LocalPaymentMethod } from '@/features/payments/types'

export type AgendaOccupation = {
  courtId: string
  courtName: string
  start: string
  end: string
  type: 'reserva' | 'mantenimiento'
  isException: boolean
  reservationId?: string
  sportId?: string
  sportName?: string
  customerName?: string
  publicName?: string | null
  publicNameBlocked?: boolean
  customerPhone?: string
  reservationStatus?: string
  reservationChannel?: string
  reservationNotes?: string | null
  proofPath?: string | null
  proofUrl?: string | null
  proofUploadedAt?: string | null
  totalAmount?: number
  tariffAmount?: number
  specialDiscountAmount?: number
  advanceAmount?: number
  paidAmount?: number
  refundedAmount?: number
  outstandingAmount?: number
  hourExtensionId?: string | null
  hourExtensionAmount?: number | null
  hourExtensionOldEnd?: string | null
  hourExtensionNewEnd?: string | null
}

export type AgendaSport = {
  id: string
  name: string
  support: 'dedicada' | 'adaptada'
}

export type AgendaCourt = {
  id: string
  name: string
  surface?: string | null
  description?: string | null
  lengthMeters?: number | null
  widthMeters?: number | null
  sports: AgendaSport[]
}

export type AgendaData = {
  localId: string
  localName: string
  date: string
  dayLabel: string
  openingTime: string | null
  closingTime: string | null
  courts: AgendaCourt[]
  occupations: AgendaOccupation[]
  paymentMethods: LocalPaymentMethod[]
}

export type AgendaActionState = {
  success: boolean
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export const initialAgendaActionState: AgendaActionState = { success: false }
