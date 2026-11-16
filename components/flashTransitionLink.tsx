'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import gsap from 'gsap'

type FlashTransitionLinkProps = {
  href: string
  children: React.ReactNode
  className?: string
  isReverse?: boolean
  onClick?: () => void
}

export function FlashTransitionLink({ 
  href, 
  children, 
  className, 
  isReverse = false,
  onClick 
}: FlashTransitionLinkProps) {
  const router = useRouter()

  const handleTransition = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      (e.currentTarget.target && e.currentTarget.target !== '_self')
    ) return

    e.preventDefault()
    if (onClick) onClick()

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      router.push(href, { scroll: true })
      return
    }

    const overlay = document.createElement('div')
    overlay.style.position = 'fixed'
    overlay.style.inset = '0'
    overlay.style.zIndex = '99999'
    overlay.style.pointerEvents = 'all'
    overlay.style.backgroundColor = isReverse
      ? 'rgba(237, 237, 237, 0.38)'
      : 'rgba(11, 14, 12, 0.42)'
    overlay.style.backdropFilter = 'blur(0px)'
    overlay.style.willChange = 'opacity, backdrop-filter'
    overlay.style.opacity = '0'
    overlay.setAttribute('aria-hidden', 'true')
    document.body.appendChild(overlay)

    gsap.timeline()
      .to(overlay, {
        opacity: 1,
        backdropFilter: 'blur(12px)',
        duration: 0.38,
        ease: 'power2.inOut',
        onComplete: () => router.push(href, { scroll: true }),
      })
      .to(overlay, {
        opacity: 0,
        backdropFilter: 'blur(0px)',
        duration: 0.72,
        delay: 0.18,
        ease: 'power2.out',
        onComplete: () => overlay.remove(),
      })
  }

  return (
    <Link href={href} onClick={handleTransition} className={className}>
      {children}
    </Link>
  )
}
