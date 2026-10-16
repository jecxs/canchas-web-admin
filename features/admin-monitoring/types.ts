import type { Json } from '@/types/database.types'

export type AuditActorRole = 'cliente' | 'dueno' | 'super_admin'

export type MonitoringChange = {
  field: string
  before: unknown
  after: unknown
}

export type MonitoringEvent = {
  id: string
  createdAt: string
  action: string
  actionLabel: string
  entityType: string
  entityLabel: string
  entityId: string | null
  actorName: string
  actorRole: AuditActorRole | null
  actorRoleLabel: string
  localName: string | null
  changes: MonitoringChange[]
  metadata: Json
}

export type MonitoringBreakdownItem = {
  value: string
  label: string
  count: number
}

export type MonitoringSummary = {
  total: number
  byAction: MonitoringBreakdownItem[]
  byEntity: MonitoringBreakdownItem[]
}

export type MonitoringFilters = {
  desde?: string
  hasta?: string
  local?: string
  rol?: AuditActorRole
  accion?: string
  entidad?: string
}

export type MonitoringOption = { value: string; label: string }

export type MonitoringData = {
  items: MonitoringEvent[]
  summary: MonitoringSummary
  filters: MonitoringFilters
  people: Record<string, string>
  options: {
    locales: MonitoringOption[]
    actions: MonitoringOption[]
    entities: MonitoringOption[]
    roles: MonitoringOption[]
  }
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number }
}
