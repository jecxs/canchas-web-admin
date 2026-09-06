import { cookies } from 'next/headers'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { DashboardContent } from './dashboard-content'
import { DashboardHeader } from './dashboard-header'
import type { DashboardShellProps } from './types'

export async function DashboardShell({
  children,
  role,
  user,
  locals = [],
  activeLocal = null,
  subscription = null,
}: DashboardShellProps) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false'

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar role={role} activeLocal={activeLocal} subscription={subscription} />
      <SidebarInset className="min-h-svh overflow-hidden bg-background md:rounded-2xl">
        <DashboardHeader role={role} user={user} locals={locals} activeLocal={activeLocal} />
        <DashboardContent>{children}</DashboardContent>
      </SidebarInset>
    </SidebarProvider>
  )
}
