import { cookies } from 'next/headers'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { DashboardContent } from './dashboard-content'
import { DashboardHeader } from './dashboard-header'
import type { DashboardShellProps } from './types'
import { getOwnerNotifications } from '@/features/notifications/queries'

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
  const notifications = role === 'owner' ? await getOwnerNotifications() : []

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar role={role} activeLocal={activeLocal} subscription={subscription} />
      <SidebarInset className="h-svh min-h-0 overflow-hidden bg-background md:h-[calc(100svh-1rem)] md:rounded-2xl">
        <DashboardHeader role={role} user={user} locals={locals} activeLocal={activeLocal} initialNotifications={notifications} />
        <DashboardContent>{children}</DashboardContent>
      </SidebarInset>
    </SidebarProvider>
  )
}
