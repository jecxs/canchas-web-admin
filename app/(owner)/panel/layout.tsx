import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { getOwnerShellContext } from '@/lib/auth/dal'
import { isOperationalLocalState } from '@/lib/auth/access'
import { getAdvanceAlert } from '@/features/local-settings/advance-alert'
import { AdvanceAlertBanner } from '@/features/local-settings/advance-alert-banner'

export default async function OwnerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { context, activeLocal } = await getOwnerShellContext()
  const advanceAlert =
    activeLocal && isOperationalLocalState(activeLocal.estado)
      ? await getAdvanceAlert(activeLocal)
      : null

  return (
    <DashboardShell
      role="owner"
      user={{
        id: context.userId,
        name: context.profile.nombre_completo,
        email: context.profile.email,
        avatarUrl: context.avatarUrl,
        role: 'owner',
      }}
      locals={context.locals}
      activeLocal={activeLocal}
      subscription={context.subscription}
    >
      {advanceAlert ? <AdvanceAlertBanner alert={advanceAlert} /> : null}
      {children}
    </DashboardShell>
  )
}
