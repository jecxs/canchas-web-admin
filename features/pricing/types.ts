import type { Enums } from '@/types/database.types'

export type PricingRuleType = Enums<'tipo_regla_tarifa'>
export type PricingAdjustmentType = Enums<'tipo_ajuste_tarifa'>

export type PricingTarget = {
  courtId: string
  courtName: string
  courtActive: boolean
  sportId: string
  sportName: string
  basePrice: number
}

export type PricingRuleTarget = PricingTarget

export type PricingRule = {
  id: string
  name: string
  type: PricingRuleType
  days: number[]
  startTime: string
  endTime: string
  startDate: string | null
  endDate: string | null
  adjustmentType: PricingAdjustmentType
  hourlyPrice: number | null
  discountPercentage: number | null
  active: boolean
  targets: PricingRuleTarget[]
  createdAt: string
  updatedAt: string
}

export type PricingSchedule = {
  day: number
  openingTime: string
  closingTime: string
}

export type PricingActionState = {
  success: boolean
  message?: string
  ruleId?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export const initialPricingActionState: PricingActionState = { success: false }
