'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Analytics01Icon } from '@hugeicons/core-free-icons'
import { motion, useAnimate, useReducedMotion } from 'motion/react'

const reports = [
  {
    src: '/landing/capCobradoxCancha.png',
    alt: 'Gráfica de cobros agrupados por cancha',
    label: 'Cobrado por cancha',
  },
  {
    src: '/landing/capCobrado.png',
    alt: 'Gráfica de cobros a lo largo del tiempo',
    label: 'Cobrado en el tiempo',
  },
  {
    src: '/landing/capCobradoxDep.png',
    alt: 'Gráfica de cobros agrupados por deporte',
    label: 'Cobrado por deporte',
  },
]

export function FinancialControlCard() {
  const [scope, animate] = useAnimate()
  const animationRef = useRef<ReturnType<typeof animate> | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const carouselReports = prefersReducedMotion ? reports : [...reports, ...reports]

  useEffect(() => {
    if (prefersReducedMotion) return

    const animation = animate(
      scope.current,
      { x: ['0%', '-50%'] },
      { repeat: Infinity, ease: 'linear', duration: 20 },
    )
    animationRef.current = animation

    return () => {
      animation.stop()
      animationRef.current = null
    }
  }, [animate, prefersReducedMotion, scope])

  return (
    <article className="rounded-2xl border border-border bg-card p-7">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-success-foreground">
          <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} className="size-5" />
        </span>
        <div>
          <h3 className="text-2xl font-black tracking-[-.045em]">Control Financiero</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Mira cuánto entra por día, qué canchas rinden más y qué deportes dejan más dinero.
          </p>
        </div>
      </div>

      <div
        className={`relative mt-6 w-full ${prefersReducedMotion ? 'overflow-x-auto' : 'overflow-hidden'}`}
        role="region"
        aria-label="Carrusel de reportes financieros"
        tabIndex={0}
        onMouseEnter={() => animationRef.current?.pause()}
        onMouseLeave={() => animationRef.current?.play()}
        onFocus={() => animationRef.current?.pause()}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            animationRef.current?.play()
          }
        }}
      >
        {!prefersReducedMotion && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-16 bg-gradient-to-r from-card to-transparent sm:w-24"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-16 bg-gradient-to-l from-card to-transparent sm:w-24"
            />
          </>
        )}

        <motion.div
          ref={scope}
          className="flex w-max gap-4 sm:gap-6"
          aria-live="off"
        >
          {carouselReports.map((report, index) => {
            const duplicate = index >= reports.length
            return (
              <div
                key={`${report.src}-${index}`}
                aria-hidden={duplicate || undefined}
                className="w-[340px] flex-none rounded-3xl border border-gray-100 bg-white p-4 shadow-sm md:w-[380px]"
              >
                <div className="relative h-[220px] w-full">
                  <Image
                    src={report.src}
                    alt={duplicate ? '' : report.alt}
                    fill
                    sizes="(min-width: 768px) 380px, 340px"
                    className="object-contain"
                  />
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>
    </article>
  )
}
