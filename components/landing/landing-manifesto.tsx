'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export function LandingManifesto() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    const section = sectionRef.current
    if (!section) return

    gsap.fromTo(
      '.reveal-text',
      { y: '110%' },
      {
        y: '0%',
        duration: 1.2,
        stagger: 1.2,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top 95%',
          end: 'top 15%',
          scrub: true,
        },
      },
    )

    gsap.fromTo(
      '.manifesto-metric',
      { y: 32, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.18,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.manifesto-metrics',
          start: 'top 85%',
          end: 'top 55%',
          scrub: 1,
        },
      },
    )
  }, { scope: sectionRef })

  return (
    <section ref={sectionRef} className="bg-[#151c16] px-5 py-32 text-white sm:py-36 lg:px-8 lg:py-40">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-16">
        <h2 className="section-title text-white">
          <div className="overflow-hidden pb-2">
            <span className="reveal-text block">MENOS TAREAS</span>
          </div>
          <div className="overflow-hidden pb-2">
            <span className="reveal-text block">MANUALES.</span>
          </div>
          <div className="overflow-hidden pb-2">
            <span className="reveal-text block text-[#D7FF38] transition-colors duration-300 hover:text-[#6E4BFF]">
              MÁS CANCHA.
            </span>
          </div>
        </h2>
        <div className="max-w-xl lg:justify-self-end">
          <p className="text-lg leading-8 text-gray-400">
            Tú conoces a tus clientes y tu negocio. Grassly se encarga del orden detrás de cada reserva para que puedas concentrarte en hacerlo crecer.
          </p>
          <div className="manifesto-metrics mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
            <div className="manifesto-metric">
              <p className="text-3xl font-black text-white">+90%</p>
              <p className="text-xs text-gray-400">Menos llamadas</p>
            </div>
            <div className="manifesto-metric">
              <p className="text-3xl font-black text-[#D7FF38]">100%</p>
              <p className="text-xs text-gray-400">Digital</p>
            </div>
            <div className="manifesto-metric">
              <p className="text-3xl font-black text-white">24/7</p>
              <p className="text-xs text-gray-400">Control en vivo</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
