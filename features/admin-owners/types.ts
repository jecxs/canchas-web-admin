import type { Enums } from '@/types/database.types'

export type AdminOwnerLocalSummary = {
  id: string
  name: string
  address: string
  ruc: string | null
  logoUrl: string | null
  state: Enums<'estado_local'>
  published: boolean
  createdAt: string
  trialEndsAt: string | null
}

export type AdminOwnerListItem = {
  id: string
  name: string
  email: string | null
  phone: string | null
  dni: string | null
  avatarUrl: string | null
  createdAt: string
  locals: AdminOwnerLocalSummary[]
  localsCount: number
  publishedCount: number
  subscriptionState: Enums<'estado_suscripcion'> | null
  monthlyAmount: number | null
}

export type AdminOwnerSummary = {
  total: number
  withActiveSubscription: number
  withPublishedLocals: number
}

export type AdminOwnersData = {
  owners: AdminOwnerListItem[]
  summary: AdminOwnerSummary
}

export type AdminOwnerPayment = {
  id: string
  status: string
  amount: number
  paidAt: string
  reference: string | null
}

export type AdminOwnerSubscription = {
  id: string
  state: Enums<'estado_suscripcion'>
  amount: number
  nextChargeAt: string | null
  extraSedes: number
  payments: AdminOwnerPayment[]
}

export type AdminOwnerDetail = {
  id: string
  name: string
  email: string | null
  phone: string | null
  dni: string | null
  avatarUrl: string | null
  role: Enums<'rol_usuario'>
  createdAt: string
  updatedAt: string
  quota: number | null
  locals: AdminOwnerLocalSummary[]
  subscription: AdminOwnerSubscription | null
}
