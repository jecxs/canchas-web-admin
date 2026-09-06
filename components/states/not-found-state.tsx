import Link from 'next/link'
import { FileNotFoundIcon, Home01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { StatePanel } from './state-panel'

type NotFoundStateProps = {
  dashboardHref?: string
  className?: string
}

export function NotFoundState({
  dashboardHref = '/',
  className,
}: NotFoundStateProps) {
  return (
    <StatePanel
      icon={FileNotFoundIcon}
      eyebrow="404"
      title="No encontramos esta página"
      description="Es posible que el enlace haya cambiado o que el recurso ya no exista."
      className={className}
    >
      <Link href={dashboardHref} className={cn(buttonVariants({ size: 'lg' }))}>
        <HugeiconsIcon icon={Home01Icon} strokeWidth={2} className="size-4" />
        Volver al inicio
      </Link>
    </StatePanel>
  )
}
