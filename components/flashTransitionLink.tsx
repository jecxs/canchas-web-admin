'use client'

import { useRouter } from 'next/navigation'
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
    e.preventDefault()
    if (onClick) onClick()

    const overlay = document.createElement('div')
    overlay.style.position = 'fixed'
    overlay.style.inset = '0'
    overlay.style.zIndex = '99999'
    overlay.style.pointerEvents = 'all'
    overlay.style.backgroundColor = isReverse ? '#151c16' : '#ffffff'
    overlay.style.opacity = '0'
    document.body.appendChild(overlay)

    const tl = gsap.timeline()

    tl.to(overlay, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.inOut',
      onComplete: () => {
        router.push(href)
      }
    })
    .to(overlay, {
      backgroundColor: isReverse ? '#ffffff' : '#151c16',
      duration: 0.4,
      delay: 0.2,
      ease: 'power2.inOut',
    })
    .to(overlay, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        overlay.remove()
      }
    })
  }

  return (
    <a href={href} onClick={handleTransition} className={className}>
      {children}
    </a>
  )
}