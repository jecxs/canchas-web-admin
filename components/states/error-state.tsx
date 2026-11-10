'use client'

import { useEffect } from 'react'
import { Alert02Icon, RefreshIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { StatePanel } from './state-panel'

type ErrorStateProps = {
  error?: Error & { digest?: string }
  retry?: () => void
  signOut?: boolean
  title?: string
  description?: string
  className?: string
}

export function ErrorState({
  error,
  retry,
  signOut = false,
  title = 'Algo no salió como esperábamos',
  description = 'No pudimos cargar esta información. Inténtalo nuevamente en unos segundos.',
  className,
}: ErrorStateProps) {
  useEffect(() => {
    if (error) {
      console.error('[grassly-boundary]', { digest: error.digest ?? 'sin-digest' })
    }
  }, [error])

  return (
    <StatePanel
      icon={Alert02Icon}
      eyebrow="Error inesperado"
      title={title}
      description={description}
      tone="danger"
      className={className}
    >
      {retry || signOut ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {retry ? (
            <Button type="button" size="lg" onClick={retry}>
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />
              Volver a intentar
            </Button>
          ) : null}
          {signOut ? (
            <SignOutButton
              withIcon
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            />
          ) : null}
        </div>
      ) : null}
    </StatePanel>
  )
}
