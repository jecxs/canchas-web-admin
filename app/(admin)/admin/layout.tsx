import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { requireAdmin } from '@/lib/auth/dal'

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const context = await requireAdmin()

  return (
    <DashboardShell
      role="admin"
      user={{
        name: context.profile.nombre_completo,
        email: context.profile.email,
        avatarUrl: context.avatarUrl,
        role: 'admin',
      }}
    >
      {children}
    </DashboardShell>
  )
}
