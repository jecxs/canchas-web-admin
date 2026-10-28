import type { ReservationChannel, ReservationStatus } from '@/features/reservations/types'

export type DashboardReservation = {
  id: string
  courtId: string
  courtName: string
  sportName: string
  customerName: string
  start: string
  end: string
  status: ReservationStatus
  channel: ReservationChannel
  totalAmount: number
  advanceAmount: number
  paidAmount: number
  outstandingAmount: number
  proofUploadedAt: string | null
  isException: boolean
}

export type DashboardNextDay = {
  date: string
  weekday: string
  dayNumber: string
  isToday: boolean
  reservations: number
  soldHours: number
  pendingValidation: number
}

export type DashboardClient = {
  key: string
  name: string
  phone: string | null
  reservations: number
  lastReservationAt: string
  reservationId: string | null
  clientId: string | null
}

export type DashboardMonthPoint = {
  date: string
  label: string
  income: number
  outstanding: number
  movements: number
}

export type OwnerDashboardData = {
  localId: string
  localName: string
  today: string
  courts: Array<{ id: string; name: string; active: boolean }>
  todaySummary: {
    reservations: number
    remainingReservations: number
    remainingHours: number
    confirmed: number
    pendingValidation: number
    pendingPayment: number
    soldHours: number
    availableHours: number
    occupancyRate: number
    collected: number
    collectedNet: number
    collectedCount: number
    outstanding: number
    activeCourts: number
    nextReservation: DashboardReservation | null
  }
  pendingValidations: DashboardReservation[]
  pendingValidationCount: number
  todayClients: DashboardClient[]
  frequentClients: DashboardClient[]
  nextByCourt: Record<string, DashboardReservation>
  nextDays: DashboardNextDay[]
  month: {
    label: string
    collected: number
    outstanding: number
    reservations: number
    averageTicket: number
    noShowCount: number
    noShowRate: number
    recurringClients: number
    soldHours: number
    availableHours: number
    occupancyRate: number
    appReservations: number
    manualReservations: number
    daily: DashboardMonthPoint[]
  }
  unreadNotifications: number
}
