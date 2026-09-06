import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { getOwnerShellContext } from '@/lib/auth/dal'

export default async function OwnerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { context, activeLocal } = await getOwnerShellContext()

  return (
    <DashboardShell
      role="owner"
      user={{
        name: context.profile.nombre_completo,
        email: context.profile.email,
        avatarUrl: context.avatarUrl,
        role: 'owner',
      }}
      locals={context.locals}
      activeLocal={activeLocal}
      subscription={context.subscription}
    >
      {children}
    </DashboardShell>
  )
}
