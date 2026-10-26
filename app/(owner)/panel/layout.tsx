import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { getOwnerShellContext } from '@/lib/auth/dal'
import { canOperateLocal } from '@/lib/auth/access'
import { getAdvanceAlert } from '@/features/local-settings/advance-alert'
import { AdvanceAlertGate } from '@/features/local-settings/advance-alert-gate'

export default async function OwnerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { context, activeLocal } = await getOwnerShellContext()
  const advanceAlert =
    activeLocal && canOperateLocal(activeLocal, context.subscription)
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
      {advanceAlert ? <AdvanceAlertGate alert={advanceAlert} /> : null}
      {children}
    </DashboardShell>
  )
}
