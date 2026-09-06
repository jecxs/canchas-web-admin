'use client'

import { ArrowDown01Icon, Building03Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { selectActiveLocalAction } from '@/lib/auth/actions'
import type { LocalSummary } from '@/lib/auth/access'
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
import { localStatePresentation } from './status'

type LocalSwitcherProps = {
  locals: LocalSummary[]
  activeLocal: LocalSummary | null
}

function CurrentLocal({ local }: { local: LocalSummary }) {
  return (
    <>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
        <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-4" />
      </span>
      <span className="hidden min-w-0 text-left sm:block">
        <span className="block truncate text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
          Local activo
        </span>
        <span className="block max-w-40 truncate text-sm font-bold">{local.nombre}</span>
      </span>
    </>
  )
}

export function LocalSwitcher({ locals, activeLocal }: LocalSwitcherProps) {
  if (!activeLocal) return null

  if (locals.length === 1) {
    return (
      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5" aria-label={`Local actual: ${activeLocal.nombre}`}>
        <CurrentLocal local={activeLocal} />
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-11 min-w-0 justify-start gap-2 px-2.5 sm:min-w-52" aria-label={`Cambiar local. Actual: ${activeLocal.nombre}`}>
          <CurrentLocal local={activeLocal} />
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="ml-auto size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-xl p-2">
        <DropdownMenuLabel className="px-2 pb-2 text-xs text-muted-foreground">
          Cambiar de local
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locals.map((local) => {
          const state = localStatePresentation[local.estado]
          const action = selectActiveLocalAction.bind(null, local.id)

          return (
            <form action={action} key={local.id}>
              <DropdownMenuItem asChild className="rounded-lg p-0">
                <button type="submit" className="flex w-full items-center gap-3 px-2 py-2.5 text-left">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
                    <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{local.nombre}</span>
                    <Badge variant={state.tone} className="mt-1">{state.label}</Badge>
                  </span>
                  {local.id === activeLocal.id ? (
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.2} className="size-4 text-success-foreground" />
                  ) : null}
                </button>
              </DropdownMenuItem>
            </form>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
