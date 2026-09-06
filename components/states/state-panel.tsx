import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

type StateTone = 'neutral' | 'info' | 'warning' | 'danger'

const toneStyles: Record<StateTone, string> = {
  neutral: 'bg-accent text-accent-foreground',
  info: 'bg-info/12 text-info',
  warning: 'bg-warning/16 text-warning-foreground',
  danger: 'bg-danger/12 text-danger',
}

type StatePanelProps = {
  icon: IconSvgElement
  eyebrow?: string
  title: string
  description: string
  tone?: StateTone
  children?: ReactNode
  className?: string
  compact?: boolean
}

export function StatePanel({
  icon,
  eyebrow,
  title,
  description,
  tone = 'neutral',
  children,
  className,
  compact = false,
}: StatePanelProps) {
  return (
    <Empty
      className={cn(
        'relative isolate overflow-hidden border-solid bg-card text-left shadow-card',
        'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-primary',
        compact ? 'gap-4 p-6 md:p-8' : 'min-h-96 gap-6 p-8 md:p-12',
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 -z-10 size-52 rounded-full border border-primary/15" />
      <EmptyHeader className="max-w-xl">
        <EmptyMedia
          variant="icon"
          className={cn('size-14 rounded-2xl', toneStyles[tone])}
        >
          <HugeiconsIcon icon={icon} strokeWidth={1.9} className="size-7" />
        </EmptyMedia>
        {eyebrow ? <p className="eyebrow mt-1">{eyebrow}</p> : null}
        <EmptyTitle className="text-2xl font-black tracking-[-.04em] md:text-3xl">
          {title}
        </EmptyTitle>
        <EmptyDescription className="max-w-lg text-sm leading-6 md:text-base">
          {description}
        </EmptyDescription>
      </EmptyHeader>
      {children ? <EmptyContent className="max-w-lg">{children}</EmptyContent> : null}
    </Empty>
  )
}
