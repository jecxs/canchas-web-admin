'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HelpCircleIcon, Logout01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { signOutAction } from '@/lib/auth/actions'
import { Badge } from '@/components/ui/badge'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { dashboardNavigation, isNavigationItemActive } from './navigation'
import { getSubscriptionPresentation, localStatePresentation } from './status'
import type { DashboardRole } from './types'
import type { LocalSummary, SubscriptionSummary } from '@/lib/auth/access'

type AppSidebarProps = {
  role: DashboardRole
  activeLocal: LocalSummary | null
  subscription: SubscriptionSummary | null
}

export function AppSidebar({ role, activeLocal, subscription }: AppSidebarProps) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const localState = activeLocal ? localStatePresentation[activeLocal.estado] : null
  const subscriptionState = getSubscriptionPresentation(subscription)
  const isOperational = activeLocal
    ? ['trial', 'activo', 'en_gracia'].includes(activeLocal.estado)
    : false
  const navigation = role === 'owner' && !isOperational
    ? dashboardNavigation.owner.filter((item) => item.href === '/panel')
    : dashboardNavigation[role]
  const homeHref = role === 'admin' ? '/admin' : '/panel'
  const helpHref = role === 'admin' ? '/admin/ayuda' : '/panel/ayuda'

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-0">
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Grassly" className="h-12 rounded-xl hover:bg-sidebar-foreground/8 data-[active=true]:bg-transparent">
              <Link href={homeHref} onClick={() => setOpenMobile(false)}>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-primary">
                  <span className="size-2.5 rounded-full bg-sidebar-primary-foreground" />
                </span>
                <span className="text-lg font-extrabold tracking-tight">Grassly</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[.14em]">
            {role === 'admin' ? 'Administración' : 'Mi negocio'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isNavigationItemActive(pathname, item)}
                    tooltip={item.title}
                    className="h-10 rounded-xl px-3 font-semibold hover:bg-sidebar-foreground/8 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <Link href={item.href} onClick={() => setOpenMobile(false)}>
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === 'owner' && activeLocal ? (
          <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
            <div className="mx-1 rounded-2xl border border-sidebar-border bg-sidebar-foreground/[.055] p-3.5">
              <p className="truncate text-sm font-bold">{activeLocal.nombre}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {localState ? <Badge variant={localState.tone} className="bg-sidebar-foreground/10 text-sidebar-foreground">{localState.label}</Badge> : null}
                <Badge variant={subscriptionState.tone} className="bg-sidebar-foreground/10 text-sidebar-foreground">{subscriptionState.label}</Badge>
              </div>
            </div>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ayuda" className="h-10 rounded-xl px-3 font-semibold hover:bg-sidebar-foreground/8">
              <Link href={helpHref} onClick={() => setOpenMobile(false)}>
                <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
                <span>Ayuda</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOutAction}>
              <SidebarMenuButton type="submit" tooltip="Cerrar sesión" className="h-10 rounded-xl px-3 font-semibold text-sidebar-foreground/70 hover:bg-destructive/15 hover:text-destructive">
                <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
