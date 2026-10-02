import type { Enums } from '@/types/database.types'
import type { PublicationChecklist } from '@/features/local-publication/types'
import type { PaymentMethod } from '@/features/local-settings/types'
import type { SportOption } from '@/features/courts/types'

export type AdminLocalState = Enums<'estado_local'>

export const ADMIN_LOCAL_STATES = [
  'pendiente_aprobacion',
  'aprobado_pendiente_pago',
  'trial',
  'activo',
  'en_gracia',
  'suspendido',
  'rechazado',
] as const satisfies readonly AdminLocalState[]

export function isAdminLocalState(value: string | undefined): value is AdminLocalState {
  return Boolean(value && (ADMIN_LOCAL_STATES as readonly string[]).includes(value))
}

export type AdminLocalFilters = {
  state?: AdminLocalState
  published?: boolean
  search?: string
}

export type AdminLocalListItem = {
  id: string
  name: string
  address: string
  ruc: string | null
  logoUrl: string | null
  state: AdminLocalState
  published: boolean
  publishedAt: string | null
  createdAt: string
  trialEndsAt: string | null
  ownerId: string
  ownerName: string
  ownerEmail: string | null
  ownerAvatarUrl: string | null
  courtsCount: number
  subscriptionState: Enums<'estado_suscripcion'> | null
}

export type AdminLocalSummary = {
  total: number
  published: number
  byState: Record<AdminLocalState, number>
}

export type AdminLocalesData = {
  locals: AdminLocalListItem[]
  summary: AdminLocalSummary
  filters: AdminLocalFilters
}

export type AdminLocalCourt = {
  id: string
  name: string
  surface: string | null
  active: boolean
  description: string | null
  sports: Array<{
    sportId: string
    name: string
    support: Enums<'tipo_soporte_deporte'>
    hourlyPrice: number | null
  }>
}

export type AdminLocalSchedule = {
  day: number
  open: string
  close: string
}

export type AdminLocalPhoto = {
  id: string
  url: string
  order: number
  hidden: boolean
}

export type AdminLocalBenefit = {
  id: string
  name: string
  category: string | null
  custom: boolean
}

export type AdminLocalPayment = {
  id: string
  status: string
  amount: number
  paidAt: string
  reference: string | null
}

export type AdminLocalSubscription = {
  id: string
  state: Enums<'estado_suscripcion'>
  amount: number
  nextChargeAt: string | null
  extraSedes: number
  payments: AdminLocalPayment[]
}

export type AdminLocalDetail = {
  id: string
  name: string
  description: string | null
  ruc: string | null
  primaryPhone: string
  secondaryPhone: string | null
  address: string
  latitude: number | null
  longitude: number | null
  state: AdminLocalState
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  approvedAt: string | null
  trialEndsAt: string | null
  rejectionReason: string | null
  advancePercentage: number | null
  refundPolicy: string
  logoUrl: string | null
  paymentMethods: PaymentMethod[]
  owner: {
    id: string
    name: string
    email: string | null
    phone: string | null
    dni: string | null
    avatarUrl: string | null
  }
  courts: AdminLocalCourt[]
  sports: SportOption[]
  schedules: AdminLocalSchedule[]
  photos: AdminLocalPhoto[]
  benefits: AdminLocalBenefit[]
  subscription: AdminLocalSubscription | null
  checklist: PublicationChecklist | null
  reviews: AdminLocalReview[]
}

export type AdminLocalActionState = {
  success: boolean
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export type AdminLocalReview = {
  id: string
  rating: number
  comment: string | null
  ownerReply: string | null
  createdAt: string
  clientName: string
  state: Enums<'estado_resena'>
}

export type AdminLocalAuditEntry = {
  id: string
  action: string
  actorRole: string | null
  actorName: string | null
  createdAt: string
}

export const initialAdminLocalActionState: AdminLocalActionState = { success: false }
