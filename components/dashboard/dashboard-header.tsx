'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
import { getDashboardBreadcrumbs } from './navigation'
import { useEntityBreadcrumb } from './breadcrumb-store'
import { LocalSwitcher } from './local-switcher'
import { LocalModerationIndicator } from './local-moderation-indicator'
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
  const entityLabel = useEntityBreadcrumb()
  const breadcrumbs = getDashboardBreadcrumbs(pathname, role, entityLabel)

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center border-b border-border/80 bg-background/95 px-3 backdrop-blur-xl md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="size-9 rounded-lg" aria-label="Alternar menú lateral" />
        <Separator orientation="vertical" className="h-5" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1
              const isHome = index === 0
              return (
                <Fragment key={`${crumb.href ?? crumb.label}-${index}`}>
                  {index > 0 ? (
                    <BreadcrumbSeparator className={index === 1 ? 'hidden sm:list-item' : undefined} />
                  ) : null}
                  <BreadcrumbItem className={isHome ? 'hidden sm:inline-flex' : undefined}>
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage className="max-w-40 truncate sm:max-w-none">{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        {role === 'owner' ? <LocalSwitcher locals={locals} activeLocal={activeLocal} /> : null}
        {role === 'owner' ? <LocalModerationIndicator moderation={activeLocal?.moderation} /> : null}
        {role === 'owner' ? (
          <NotificationsBell
            recipientId={user.id}
            locals={locals}
            activeLocalId={activeLocal?.id ?? null}
            activeLocalName={activeLocal?.nombre ?? null}
            initialNotifications={initialNotifications}
          />
        ) : null}
        <UserMenu user={user} />
      </div>
    </header>
  )
}
