'use client'

import Image from 'next/image'
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

type PreloaderProps = {
  onComplete: () => void
}

export function Preloader({ onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const topHalfRef = useRef<HTMLDivElement>(null)
  const bottomHalfRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  useGSAP((_, contextSafe) => {
    const container = containerRef.current
    const topHalf = topHalfRef.current
    const bottomHalf = bottomHalfRef.current
    const logo = logoRef.current

    if (!container || !topHalf || !bottomHalf || !logo || !contextSafe) return

    const previousOverflow = document.body.style.overflow
    let hasCompleted = false
    document.body.style.overflow = 'hidden'

    const finish = contextSafe(() => {
      if (hasCompleted) return

      hasCompleted = true
      document.body.style.overflow = previousOverflow || 'auto'
      gsap.set(container, { display: 'none' })
      onComplete()
    })

    const timeline = gsap.timeline({ onComplete: finish })

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timeline
        .set(logo, { scale: 0, opacity: 0 })
        .set(topHalf, { xPercent: -100 })
        .set(bottomHalf, { xPercent: 100 })
    } else {
      timeline
        .to(logo, {
          scale: 1.1,
          duration: 0.8,
          yoyo: true,
          repeat: 1,
        })
        .to(logo, {
          scale: 0,
          opacity: 0,
          duration: 0.4,
          ease: 'back.in(1.7)',
        })
        .to(topHalf, {
          xPercent: -100,
          duration: 0.8,
          ease: 'power4.inOut',
        })
        .to(
          bottomHalf,
          {
            xPercent: 100,
            duration: 0.8,
            ease: 'power4.inOut',
          },
          '<',
        )
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, { scope: containerRef })

  return (
    <div
      ref={containerRef}
      role="status"
      aria-label="Cargando Grassly"
      className="fixed inset-0 z-[9999] select-none overflow-hidden pointer-events-auto"
    >
      <div
        ref={topHalfRef}
        className="absolute left-0 top-0 z-10 h-full w-1/2 overflow-hidden border-r border-[#151c16]/10 bg-[#f5f7ef]"
      >
        <div className="absolute inset-y-0 left-0 w-[200%]">
          <Image
            src="/cancha.png"
            alt=""
            fill
            preload
            sizes="100vw"
            className="object-cover opacity-40 brightness-110 contrast-125 saturate-50"
          />
        </div>
      </div>

      <div
        ref={bottomHalfRef}
        className="absolute right-0 top-0 z-10 h-full w-1/2 overflow-hidden border-l border-[#151c16]/10 bg-[#f5f7ef]"
      >
        <div className="absolute inset-y-0 -left-full w-[200%]">
          <Image
            src="/cancha.png"
            alt=""
            fill
            preload
            sizes="100vw"
            className="object-cover opacity-40 brightness-110 contrast-125 saturate-50"
          />
        </div>
      </div>

      <div
        ref={logoRef}
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 z-20 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      >
        <Image
          src="/iconGrasslysinFondo.png"
          alt=""
          fill
          preload
          sizes="112px"
          className="object-contain"
        />
      </div>
    </div>
  )
}
