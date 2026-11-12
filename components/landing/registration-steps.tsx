'use client'

import { useState, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const steps = [
  {
    title: 'CREAR CUENTA',
    text: 'Conecta tu cuenta en un clic con Google para un acceso rápido y seguro a tu panel de administración.',
  },
  {
    title: 'REGISTRAR LOCAL',
    text: 'Ingresa el nombre, la dirección exacta y el contacto principal de tu complejo deportivo para que tus clientes te encuentren.',
  },
  {
    title: 'VALIDAMOS TU COMPLEJO',
    text: 'Revisamos los datos de tu sede de forma ágil para garantizar la seguridad, calidad y legitimidad en la plataforma.',
  },
  {
    title: 'EMPEZAR A OPERAR',
    text: 'Configura tus tarifas por hora, abre tu agenda digital y comienza a recibir reservas automáticas sin cruces.',
  },
]

export function RegistrationSteps() {
  const sectionRef = useRef<HTMLElement>(null)
  const stepsRef = useRef<HTMLOListElement>(null)
  const [activeStep, setActiveStep] = useState(0)

  useGSAP(() => {
    const list = stepsRef.current
    if (!list) return

    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const items = list.querySelectorAll('li')
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: list,
          start: 'top 82%',
          toggleActions: 'play none none reverse',
        },
      })

      timeline.fromTo(
        items,
        { y: 32, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.65,
          stagger: 0.2,
          ease: 'power3.out',
        },
      )
    })

    return () => media.revert()
  }, { scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      aria-label="Pasos para comenzar"
      className="bg-[#F4F6F0] px-5 py-20 text-[#151c16] sm:py-24 lg:px-8 lg:py-28"
    >
      <ol ref={stepsRef} className="mx-auto grid max-w-7xl grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2">
        {steps.map((step, index) => (
          <li
            key={step.title}
            onPointerEnter={() => setActiveStep(index)}
            onFocusCapture={() => setActiveStep(index)}
            className="group"
          >
            <div className="flex items-center">
              <button
                type="button"
                aria-label={`Resaltar paso ${index + 1}: ${step.title.toLowerCase()}`}
                aria-pressed={activeStep === index}
                onClick={() => setActiveStep(index)}
                className={`relative z-10 grid size-14 shrink-0 place-items-center rounded-full border-2 border-[#151c16] bg-[#D7FF38] text-xl font-black transition-[transform,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#151c16]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F6F0] hover:rotate-[-6deg] hover:scale-110 active:scale-95 sm:size-16 sm:text-2xl ${
                  activeStep === index
                    ? 'scale-105 shadow-[5px_5px_0_#151c16]'
                    : 'shadow-[3px_3px_0_#151c16]'
                }`}
              >
                {index + 1}
              </button>
              <span
                aria-hidden="true"
                className={`h-0 flex-1 border-t-2 transition-colors duration-300 ${
                  activeStep === index ? 'border-[#9cc21d]' : 'border-[#151c16]'
                }`}
              />
            </div>
            <h2 className={`mt-6 text-xl font-black uppercase leading-tight transition-[transform,color] duration-300 sm:text-2xl ${
              activeStep === index ? 'translate-x-1 text-[#40551a]' : ''
            }`}>
              {step.title}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#26352a] sm:text-lg">
              {step.text}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
