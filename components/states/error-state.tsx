'use client'

import { useEffect } from 'react'
import { Alert02Icon, RefreshIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { StatePanel } from './state-panel'

type ErrorStateProps = {
  error?: Error & { digest?: string }
  retry?: () => void
  title?: string
  description?: string
  className?: string
}

export function ErrorState({
  error,
  retry,
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
      {retry ? (
        <Button type="button" size="lg" onClick={retry}>
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />
          Volver a intentar
        </Button>
      ) : null}
    </StatePanel>
  )
}
