import type { LocalSummary, SubscriptionSummary } from '@/lib/auth/access'

export type DashboardRole = 'owner' | 'admin'

export type DashboardUser = {
  name: string
  email: string | null
  avatarUrl: string | null
  role: DashboardRole
}

export type DashboardShellProps = {
  children: React.ReactNode
  role: DashboardRole
  user: DashboardUser
  locals?: LocalSummary[]
  activeLocal?: LocalSummary | null
  subscription?: SubscriptionSummary | null
}
