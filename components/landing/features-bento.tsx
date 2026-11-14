'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { FinancialControlPreview } from '@/components/landing/financial-control-card'
import { LocalesTree } from '@/components/landing/locales-tree'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const showcaseSlides = [
  {
    title: 'Control Financiero',
    description: 'Entiende tus ingresos por cancha, día y deporte con reportes claros para tomar mejores decisiones.',
    windowLabel: 'Finanzas',
  },
  {
    title: 'Vista de Administrador',
    description: 'Consulta la agenda semanal, los cobros pendientes y la ocupación de tus canchas desde una sola vista.',
    windowLabel: 'Agenda',
  },
  {
    title: 'Gestión de Sedes',
    description: 'Administra los horarios, deportes y actividad de todos tus complejos desde una cuenta.',
    windowLabel: 'Sedes',
  },
]

function ShowcaseWindow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[1.65rem] border border-[#151c16]/10 bg-white p-2.5 shadow-[0_24px_70px_rgba(21,28,22,0.12)] sm:p-3">
      <div aria-hidden="true" className="flex h-8 items-center gap-1.5 px-2.5">
        <span className="size-2.5 rounded-full bg-[#151c16]/25" />
        <span className="size-2.5 rounded-full bg-[#151c16]/25" />
        <span className="size-2.5 rounded-full bg-[#151c16]/25" />
        <span className="ml-2 text-[11px] font-semibold text-[#58635a]">{label}</span>
      </div>
      <div className="overflow-hidden rounded-2xl bg-[#151c16]">
        {children}
      </div>
    </div>
  )
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === 'left' ? <path d="M19 12H5m7 7-7-7 7-7" /> : <path d="M5 12h14m-7-7 7 7-7 7" />}
    </svg>
  )
}

export function FeaturesBento() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startScrollLeft: number; moved: boolean } | null>(null)
  const suppressClickRef = useRef(false)
  const [activeSlide, setActiveSlide] = useState(1)
  const [activeCopy, setActiveCopy] = useState(1)
  const [isDragging, setIsDragging] = useState(false)

  useLayoutEffect(() => {
    const track = trackRef.current
    const initialSlide = track?.querySelector<HTMLElement>('[data-showcase-instance="4"]')
    if (!track || !initialSlide) return

    track.scrollLeft = initialSlide.offsetLeft - (track.clientWidth - initialSlide.offsetWidth) / 2
  }, [])

  useGSAP(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const select = gsap.utils.selector(section)
    const media = gsap.matchMedia()

    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        select('[data-showcase-instance="3"], [data-showcase-instance="4"], [data-showcase-instance="5"]'),
        { y: 32, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: track,
            start: 'top 82%',
            once: true,
          },
        },
      )
    })

    return () => media.revert()
  }, { scope: sectionRef })

  function centerSlide(slide: HTMLElement, behavior: ScrollBehavior) {
    const track = trackRef.current
    if (!track) return

    track.scrollTo({
      left: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2,
      behavior,
    })
  }

  function navigate(direction: -1 | 1) {
    const track = trackRef.current
    if (!track) return

    const currentSlide = track.querySelector<HTMLElement>(`[data-showcase-instance="${activeCopy * showcaseSlides.length + activeSlide}"]`)
    const adjacentSlide = currentSlide?.nextElementSibling
    const previousSlide = currentSlide?.previousElementSibling
    const target = direction === 1 ? adjacentSlide : previousSlide

    if (target instanceof HTMLElement) {
      centerSlide(target, 'smooth')
    }
  }

  function updateActiveSlide() {
    const track = trackRef.current
    if (!track) return

    const middleGroupStart = track.querySelector<HTMLElement>('[data-showcase-instance="3"]')
    const lastGroupStart = track.querySelector<HTMLElement>('[data-showcase-instance="6"]')
    if (!middleGroupStart || !lastGroupStart) return

    const groupWidth = lastGroupStart.offsetLeft - middleGroupStart.offsetLeft

    if (track.scrollLeft < groupWidth * 0.5) {
      track.scrollLeft += groupWidth
      if (dragRef.current) dragRef.current.startScrollLeft += groupWidth
    } else if (track.scrollLeft > groupWidth * 1.5) {
      track.scrollLeft -= groupWidth
      if (dragRef.current) dragRef.current.startScrollLeft -= groupWidth
    }

    const trackCenter = track.scrollLeft + track.clientWidth / 2
    const slides = Array.from(track.querySelectorAll<HTMLElement>('[data-showcase-instance]'))
    let closestInstance = -1
    let closestDistance = Number.POSITIVE_INFINITY

    slides.forEach((slide) => {
      const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - trackCenter)
      if (distance < closestDistance) {
        closestInstance = Number(slide.dataset.showcaseInstance)
        closestDistance = distance
      }
    })

    if (closestInstance >= 0) {
      setActiveSlide(closestInstance % showcaseSlides.length)
      setActiveCopy(Math.floor(closestInstance / showcaseSlides.length))
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' || event.button !== 0) return
    if ((event.target as HTMLElement).closest('button, a, input, select, textarea')) return

    const track = trackRef.current
    if (!track) return

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
      moved: false,
    }
    track.style.scrollSnapType = 'none'
    setIsDragging(false)
    track.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const track = trackRef.current
    if (!drag || drag.pointerId !== event.pointerId || !track) return

    const delta = event.clientX - drag.startX
    if (Math.abs(delta) > 5) {
      if (!drag.moved) setIsDragging(true)
      drag.moved = true
    }
    if (drag.moved) {
      event.preventDefault()
      track.scrollLeft = drag.startScrollLeft - delta
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const track = trackRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    if (track?.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId)
    if (track) track.style.scrollSnapType = ''
    setIsDragging(false)
    if (drag.moved) {
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
    }
    dragRef.current = null
  }

  function renderSlide(slideIndex: number, instance: number) {
    const slide = showcaseSlides[slideIndex]
    const copy = Math.floor(instance / showcaseSlides.length)
    const isAccessibleCopy = copy === activeCopy

    return (
      <article
        key={instance}
        data-showcase-instance={instance}
        className="feature-slide w-[min(90vw,760px)] shrink-0 snap-center"
        aria-roledescription="diapositiva"
        aria-label={`${slideIndex + 1} de ${showcaseSlides.length}: ${slide.title}`}
        aria-hidden={!isAccessibleCopy}
        inert={!isAccessibleCopy}
      >
        <ShowcaseWindow label={slide.windowLabel}>
          {slideIndex === 0 ? (
            <FinancialControlPreview autoRotate={copy === activeCopy} />
          ) : slideIndex === 1 ? (
            <div className="relative aspect-[16/10] w-full bg-[#f8faf5]">
              <Image
                src="/landing/capAgenda.png"
                alt="Agenda de Grassly con reservas, estados de pago y horarios de las canchas"
                fill
                sizes="(min-width: 768px) 760px, 90vw"
                className="object-contain"
                draggable={false}
              />
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center bg-[#151c16] p-3 sm:min-h-[320px] sm:p-6">
              <LocalesTree />
            </div>
          )}
        </ShowcaseWindow>
        <div className="mt-3 flex items-start justify-between gap-5 px-1">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#58635a]">
              {slideIndex === 0 ? '01 · Reportes' : slideIndex === 1 ? '02 · Administración' : '03 · Multi-sede'}
            </p>
            <h3 className="font-display text-xl font-black tracking-[-.04em] sm:text-2xl">{slide.title}</h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#465047] sm:text-sm">{slide.description}</p>
          </div>
          <span className="hidden shrink-0 pt-4 text-xs font-bold text-[#58635a] sm:block">{slide.windowLabel}</span>
        </div>
      </article>
    )
  }

  return (
    <section ref={sectionRef} id="beneficios" className="scroll-mt-24 w-full overflow-x-clip bg-[#cfd3d8] text-[#151c16]">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-5 sm:px-8 sm:pb-10 sm:pt-8 lg:px-8 lg:pb-4 lg:pt-4">
        <div
          ref={trackRef}
          className={`relative left-1/2 mt-0 flex w-screen -translate-x-1/2 snap-x items-start ${isDragging ? 'snap-none cursor-grabbing' : 'snap-mandatory cursor-grab'} gap-8 overflow-x-auto overscroll-x-contain py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-x] select-none sm:gap-14 lg:gap-16`}
          style={{ paddingInline: 'max(calc((100vw - min(90vw, 760px)) / 2), 1.25rem)' }}
          role="region"
          aria-label="Vistas de la plataforma Grassly"
          aria-roledescription="carrusel"
          onScroll={updateActiveSlide}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDragStart={(event) => event.preventDefault()}
          onClickCapture={(event) => {
            if (suppressClickRef.current) {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
        >
          {Array.from({ length: showcaseSlides.length * 3 }, (_, instance) =>
            renderSlide(instance % showcaseSlides.length, instance),
          )}
        </div>

        <div className="mt-0 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid size-11 place-items-center rounded-full border border-[#151c16]/60 text-[#151c16] transition hover:bg-[#151c16] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151c16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#cfd3d8]"
            aria-label="Ver vista anterior"
          >
            <ArrowIcon direction="left" />
          </button>
          <div className="flex items-center gap-1" role="group" aria-label="Elegir vista">
            {showcaseSlides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => {
                  const target = trackRef.current?.querySelector<HTMLElement>(
                    `[data-showcase-instance="${activeCopy * showcaseSlides.length + index}"]`,
                  )
                  if (target) centerSlide(target, 'smooth')
                }}
                className="grid size-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151c16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#cfd3d8]"
                aria-label={`Ver ${slide.title}`}
                aria-current={activeSlide === index ? 'true' : undefined}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 rounded-full transition-all ${activeSlide === index ? 'w-7 bg-[#151c16]' : 'w-1.5 bg-[#151c16]/35'}`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="grid size-11 place-items-center rounded-full border border-[#151c16]/60 text-[#151c16] transition hover:bg-[#151c16] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151c16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#cfd3d8]"
            aria-label="Ver siguiente vista"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>
    </section>
  )
}
