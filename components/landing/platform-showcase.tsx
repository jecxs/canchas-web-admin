'use client'

import Image from 'next/image'
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

interface SlideItem {
  src: string
  alt: string
  tag: string
  title: string
  description: string
  width: number
  height: number
}

const SLIDES: SlideItem[] = [
  {
    src: '/landing/capAgenda.png?v=20261113',
    alt: 'Agenda semanal de Grassly con reservas y estados de pago',
    tag: 'OPERACIÓN DIARIA',
    title: 'Toda tu agenda, de un vistazo',
    description: 'Organiza las reservas por cancha, horario y estado de pago desde una sola vista.',
    width: 4320,
    height: 2486,
  },
  {
    src: '/landing/capCanchas.png?v=20261113',
    alt: 'Administración de canchas, deportes y precios en Grassly',
    tag: 'CONFIGURACIÓN',
    title: 'Administra tus canchas',
    description: 'Configura cada cancha, sus deportes y los precios por hora de tu complejo.',
    width: 4320,
    height: 2486,
  },
  {
    src: '/landing/capTarifas.png?v=20261112-2',
    alt: 'Tarifas dinámicas por horario y promociones',
    tag: 'RENTABILIDAD',
    title: 'Define tarifas a tu medida',
    description: 'Combina precios semanales y promociones para cada horario y cancha.',
    width: 4320,
    height: 2486,
  },
  {
    src: '/landing/capClientes.png?v=20261112',
    alt: 'Base de clientes con historial y reservas',
    tag: 'FIDELIZACIÓN',
    title: 'Conoce a tus clientes',
    description: 'Consulta su historial de reservas y el movimiento de cada cliente.',
    width: 4320,
    height: 2486,
  },
  {
    src: '/landing/capReportesFinanciero.png?v=20261112',
    alt: 'Reporte financiero de Grassly con ingresos y saldos',
    tag: 'FINANZAS',
    title: 'Decide con información clara',
    description: 'Revisa ingresos, saldos pendientes, reservas y ticket promedio.',
    width: 4320,
    height: 2486,
  },
]

export function PlatformShowcase() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const rows = gsap.utils.toArray<HTMLElement>('.zigzag-row')

        rows.forEach((row, index) => {
          const isEven = index % 2 === 0
          const imageEl = row.querySelector<HTMLElement>('.zigzag-image')
          const textEl = row.querySelector<HTMLElement>('.zigzag-text')

          if (!imageEl || !textEl) return

          const imageStartX = isEven ? -60 : 60
          const textStartX = isEven ? 40 : -40

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: row,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          })

          tl.fromTo(
            imageEl,
            { autoAlpha: 0, x: imageStartX, scale: 0.97, force3D: true },
            { autoAlpha: 1, x: 0, scale: 1, duration: 0.65, ease: 'power3.out', force3D: true }
          ).fromTo(
            textEl,
            { autoAlpha: 0, x: textStartX, y: 12, force3D: true },
            { autoAlpha: 1, x: 0, y: 0, duration: 0.55, ease: 'power3.out', force3D: true },
            '-=0.4'
          )
        })
      })
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      id="plataforma"
      aria-labelledby="plataforma-title"
      className="scroll-mt-24 overflow-x-clip bg-[#F6F7F1] py-24 text-[#151c16] lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <header className="grid gap-4 md:grid-cols-2 md:items-end">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[.18em] text-[#6E4BFF]">
              PLATAFORMA GRASSLY
            </p>
            <h2
              id="plataforma-title"
              className="text-balance font-display text-[clamp(2.2rem,4.5vw,4rem)] font-black uppercase leading-[.92] tracking-[-.03em]"
            >
              Tu complejo, bajo <span className="text-[#6E4BFF]">control.</span>
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#465047] md:justify-self-end md:text-base md:leading-7">
            Agenda, canchas, tarifas, clientes e ingresos: todo lo que necesitas para gestionar tu negocio en una sola plataforma.
          </p>
        </header>

        <div className="mt-16 flex flex-col gap-20 lg:mt-24 lg:gap-28">
          {SLIDES.map((slide, index) => {
            const isEven = index % 2 === 0

            return (
              <article
                key={slide.src}
                className="zigzag-row grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12"
              >
                <div
                  className={`zigzag-image relative will-change-transform perspective-distant lg:col-span-7 ${
                    isEven ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute -inset-8 -z-10 opacity-70 ${
                      isEven
                        ? 'bg-[radial-gradient(circle_at_30%_50%,rgba(215,255,56,0.35),rgba(110,75,255,0.12)_55%,transparent_75%)]'
                        : 'bg-[radial-gradient(circle_at_70%_50%,rgba(110,75,255,0.18),rgba(215,255,56,0.28)_55%,transparent_75%)]'
                    }`}
                  />

                  <div
                    className={`overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_24px_48px_-12px_rgba(21,28,22,0.22)] transition-transform duration-500 ease-out motion-reduce:transition-none lg:hover:transform-[rotateY(0deg)_rotateX(0deg)_translateY(-4px)] ${
                      isEven
                        ? 'lg:transform-[rotateY(-5deg)_rotateX(1.5deg)]'
                        : 'lg:transform-[rotateY(5deg)_rotateX(1.5deg)]'
                    }`}
                  >
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      width={slide.width}
                      height={slide.height}
                      sizes="(min-width: 1280px) 720px, (min-width: 1024px) 58vw, 94vw"
                      quality={75}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      className="block h-auto w-full"
                    />
                  </div>
                </div>

                <div
                  className={`zigzag-text flex flex-col justify-center will-change-transform lg:col-span-5 ${
                    isEven ? 'lg:order-2 lg:pl-6' : 'lg:order-1 lg:pr-6'
                  }`}
                >
                  <div className="mb-3 flex items-center gap-3 text-xs font-black uppercase tracking-[.16em] text-[#58635a]">
                    <span className="inline-flex items-center justify-center rounded-md bg-[#6E4BFF] px-2.5 py-0.5 text-[11px] text-[#EDEDED]">
                      0{index + 1}
                    </span>
                    <span>{slide.tag}</span>
                  </div>

                  <h3 className="font-display text-2xl font-black leading-tight text-[#151c16] sm:text-3xl lg:text-4xl">
                    {slide.title}
                  </h3>

                  <p className="mt-4 text-base leading-relaxed text-[#465047] sm:text-lg">
                    {slide.description}
                  </p>

                  <span
                    aria-hidden="true"
                    className="mt-6 block h-1 w-12 rounded-full bg-[#2A2A2A]"
                  />
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}