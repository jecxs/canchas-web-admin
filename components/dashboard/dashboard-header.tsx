'use client'

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
import { getDashboardPageLabel } from './navigation'
import { LocalSwitcher } from './local-switcher'
import { UserMenu } from './user-menu'
import type { DashboardRole, DashboardUser } from './types'
import type { LocalSummary } from '@/lib/auth/access'

type DashboardHeaderProps = {
  role: DashboardRole
  user: DashboardUser
  locals: LocalSummary[]
  activeLocal: LocalSummary | null
}

export function DashboardHeader({ role, user, locals, activeLocal }: DashboardHeaderProps) {
  const pathname = usePathname()
  const homeHref = role === 'admin' ? '/admin' : '/panel'
  const pageLabel = getDashboardPageLabel(pathname, role)
  const isHome = pathname === homeHref

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center border-b border-border/80 bg-background/90 px-3 backdrop-blur-xl md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="size-9 rounded-lg" aria-label="Alternar menú lateral" />
        <Separator orientation="vertical" className="h-5" />
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
      </div>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        {role === 'owner' ? <LocalSwitcher locals={locals} activeLocal={activeLocal} /> : null}
        <UserMenu user={user} />
      </div>
    </header>
  )
}
