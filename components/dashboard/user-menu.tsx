'use client'

import Link from 'next/link'
import { Logout01Icon, Settings02Icon, UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { signOutAction } from '@/lib/auth/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DashboardUser } from './types'

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function UserMenu({ user }: { user: DashboardUser }) {
  const profileHref = user.role === 'admin' ? '/admin/perfil' : '/panel/perfil'
  const roleLabel = user.role === 'admin' ? 'Superadministrador' : 'Propietario'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-11 gap-2 px-1.5 sm:px-2" aria-label="Abrir menú de usuario">
          <Avatar size="lg" className="ring-2 ring-border">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" referrerPolicy="no-referrer" /> : null}
            <AvatarFallback className="bg-secondary font-bold text-secondary-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-36 text-left lg:block">
            <span className="block truncate text-sm font-bold">{user.name}</span>
            <span className="block truncate text-[11px] font-medium text-muted-foreground">{roleLabel}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl p-2">
        <DropdownMenuLabel className="p-2">
          <span className="block truncate text-sm font-bold">{user.name}</span>
          <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          <Badge variant={user.role === 'admin' ? 'default' : 'neutral'} className="mt-2">{roleLabel}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-lg">
          <Link href={profileHref}>
            <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
            Mi perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-lg" disabled>
          <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
          Preferencias
          <span className="ml-auto text-[10px] font-bold uppercase text-muted-foreground">Pronto</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild variant="destructive" className="rounded-lg">
            <button type="submit" className="w-full">
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
              Cerrar sesión
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
