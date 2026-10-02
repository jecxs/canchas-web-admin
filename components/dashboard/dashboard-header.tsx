'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { getDashboardBackTarget, getDashboardPageLabel } from './navigation'
import { LocalSwitcher } from './local-switcher'
import { UserMenu } from './user-menu'
import { NotificationsBell } from './notifications-bell'
import type { DashboardRole, DashboardUser } from './types'
import type { LocalSummary } from '@/lib/auth/access'
import type { OwnerNotification } from '@/features/notifications/queries'

type DashboardHeaderProps = {
  role: DashboardRole
  user: DashboardUser
  locals: LocalSummary[]
  activeLocal: LocalSummary | null
  initialNotifications: OwnerNotification[]
}

export function DashboardHeader({ role, user, locals, activeLocal, initialNotifications }: DashboardHeaderProps) {
  const pathname = usePathname()
  const homeHref = role === 'admin' ? '/admin' : '/panel'
  const pageLabel = getDashboardPageLabel(pathname, role)
  const isHome = pathname === homeHref
  const backTarget = getDashboardBackTarget(pathname, role)

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center border-b border-border/80 bg-background/95 px-3 backdrop-blur-xl md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="size-9 rounded-lg" aria-label="Alternar menú lateral" />
        <Separator orientation="vertical" className="h-5" />
        {backTarget ? (
          <Link
            href={backTarget.href}
            className="inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 shrink-0" />
            <span className="truncate">{backTarget.label}</span>
          </Link>
        ) : (
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap">
              {isHome ? (
                <BreadcrumbItem><BreadcrumbPage>Resumen</BreadcrumbPage></BreadcrumbItem>
              ) : (
                <>
                  <BreadcrumbItem className="hidden sm:inline-flex">
                    <BreadcrumbLink asChild><Link href={homeHref}>Resumen</Link></BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:list-item" />
                  <BreadcrumbItem><BreadcrumbPage className="max-w-32 truncate sm:max-w-none">{pageLabel}</BreadcrumbPage></BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        {role === 'owner' ? <LocalSwitcher locals={locals} activeLocal={activeLocal} /> : null}
        {role === 'owner' ? <NotificationsBell recipientId={user.id} initialNotifications={initialNotifications} /> : null}
        <UserMenu user={user} />
      </div>
    </header>
  )
}
