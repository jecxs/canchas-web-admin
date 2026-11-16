'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)
gsap.registerPlugin(useGSAP)

export function MagazineHero({ isReady = true }: { isReady?: boolean }) {
  const heroRef = useRef<HTMLElement>(null)

  useGSAP((_, contextSafe) => {
    if (!heroRef.current || !contextSafe || !isReady) return

    const fadeOnScroll = contextSafe(() => {
      gsap.fromTo(
        '.animate-text',
        { autoAlpha: 1, y: 0 },
        {
          autoAlpha: 0,
          y: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    })

    const tl = gsap.timeline({ onComplete: fadeOnScroll })
    tl.fromTo(
      '.animate-text',
      { x: -100, autoAlpha: 0 },
      {
        x: 0,
        autoAlpha: 1,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
      },
    ).fromTo(
      '.animate-mascot',
      { y: 40, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 1,
        ease: 'power3.out',
      },
      '<0.15',
    )
  }, { scope: heroRef, dependencies: [isReady], revertOnUpdate: true })

  return (
    <section ref={heroRef} className="relative isolate min-h-screen bg-[#AFFF00] px-4 pt-[120px] pb-8 text-[#2A2A2A] sm:px-7 sm:pt-[136px] sm:pb-12 lg:px-10 lg:pt-[152px] lg:pb-16">
      <div aria-hidden="true" className="pointer-events-none absolute right-[5%] top-12 hidden size-52 rounded-full border-[3px] border-[#6BFF2E] lg:block" />

      <div className="relative mx-auto max-w-[1320px] border-[10px] border-[#2A2A2A] bg-[#EDEDED] shadow-[16px_16px_0px_#2A2A2A]">
        <div className="relative isolate grid min-h-[700px] items-center px-5 py-10 sm:px-8 lg:min-h-[620px] lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:py-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] bg-[#AFFF00] [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)] lg:block" />

          <div className="relative z-40 max-w-[700px] pb-[18rem] sm:pb-[21rem] lg:pb-0">
            <h1 className="animate-text invisible font-display text-[clamp(4rem,14vw,11rem)] font-black uppercase leading-[.76] tracking-[-.045em]">
              GRASSLY
            </h1>
            <p className="animate-text invisible mt-5 font-display text-[clamp(1.75rem,4.2vw,3.25rem)] font-black uppercase leading-[.92] tracking-[.08em] text-[#6E4BFF]">
              Todo el juego.<br />En orden.
            </p>
            <p className="animate-text invisible mt-5 max-w-md text-sm font-semibold leading-6 sm:text-base sm:leading-7">
              Agenda, cobros y tarifas de tus canchas, sin cuadernos ni mensajes sueltos.
            </p>
            <Link
              href="/registro"
              className="animate-text invisible mt-8 inline-flex min-h-16 min-w-52 items-center justify-center border-[4px] border-[#2A2A2A] bg-[#2A2A2A] px-10 text-sm font-black uppercase tracking-[.16em] text-[#EDEDED] shadow-[8px_8px_0px_#AFFF00] transition-colors hover:bg-[#6BFF2E] hover:text-[#2A2A2A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#EDEDED]"
            >
              Empezar
            </Link>
          </div>

          <div className="animate-mascot invisible pointer-events-none absolute bottom-[-5%] right-[-5%] z-50 h-[50%] w-[72%] sm:right-[-3%] sm:h-[56%] sm:w-[65%] lg:bottom-[-14%] lg:right-[-12%] lg:h-[125%] lg:w-[50%]">
            <Image
              src="/mascota/grassyCelebracion.png"
              alt="La mascota de Grassly celebrando con los brazos abiertos"
              width={908}
              height={1536}
              preload
              sizes="(min-width: 1024px) 600px, (min-width: 640px) 55vw, 72vw"
              className="h-full w-full object-contain object-bottom"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
