'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AutoMarquee({
  children,
  className,
  gapClassName = 'pr-16',
  gapPx = 64,
  centerWhenFits = false,
}: {
  children: ReactNode
  className?: string
  gapClassName?: string
  gapPx?: number
  centerWhenFits?: boolean
}) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const contentRef = useRef<HTMLSpanElement>(null)
  const [overflowing, setOverflowing] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [duration, setDuration] = useState(12)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(query.matches)
    updateMotion()
    query.addEventListener('change', updateMotion)
    return () => query.removeEventListener('change', updateMotion)
  }, [])

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current
      const content = contentRef.current
      if (!container || !content) return
      const contentWidth = content.scrollWidth
      const containerWidth = container.clientWidth
      const hasOverflow = contentWidth > containerWidth + 1
      setOverflowing(hasOverflow)
      setDuration(Math.max(10, (contentWidth + gapPx) / 45))
    }

    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    if (contentRef.current) observer.observe(contentRef.current)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [children, gapPx])

  const animate = overflowing && !reducedMotion

  return (
    <span
      ref={containerRef}
      className={cn(
        'relative block overflow-hidden',
        overflowing && reducedMotion && 'overflow-x-auto [scrollbar-width:none]',
        className,
      )}
    >
      <span
        className={cn(
          'flex w-max',
          !overflowing && centerWhenFits && 'mx-auto',
          animate && 'owner-marquee',
        )}
        style={animate ? { animationDuration: `${duration}s` } : undefined}
      >
        <span ref={contentRef} className={cn('whitespace-nowrap', gapClassName)}>
          {children}
        </span>
        {animate ? (
          <span aria-hidden="true" className={cn('whitespace-nowrap', gapClassName)}>
            {children}
          </span>
        ) : null}
      </span>
    </span>
  )
}
