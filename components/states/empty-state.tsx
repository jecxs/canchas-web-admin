import type { ReactNode } from 'react'
import { InboxIcon } from '@hugeicons/core-free-icons'
import { StatePanel } from './state-panel'

type EmptyStateProps = {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title = 'Todavía no hay información',
  description = 'Cuando agregues contenido, aparecerá organizado en este espacio.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <StatePanel
      icon={InboxIcon}
      eyebrow="Sin resultados"
      title={title}
      description={description}
      className={className}
      compact
    >
      {action}
    </StatePanel>
  )
}
