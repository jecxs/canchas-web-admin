'use client'

import type { FocusEvent, ReactNode } from 'react'
import { useCourtsSync } from './courts-sync'

export function CourtRotationPause({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const { setPaused } = useCourtsSync()

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false)
  }

  return (
    <div
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={handleBlur}
    >
      {children}
    </div>
  )
}
