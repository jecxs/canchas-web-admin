import type { Enums } from '@/types/database.types'
import type { SettingsActionState } from '@/features/local-settings/types'

export type SportOption = { id: string; name: string; icon: string | null }
export type CourtSport = {
  sportId: string
  name: string
  support: Enums<'tipo_soporte_deporte'>
  hourlyPrice: number | null
}
export type CourtItem = {
  id: string
  name: string
  surface: string | null
  active: boolean
  sports: CourtSport[]
}

export type CourtActionState = SettingsActionState
export const initialCourtActionState: CourtActionState = { success: false }
