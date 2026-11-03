'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'

const sections = [
  {
    image: '/imagesApp/phone-mapaApp2.png',
    alt: 'Mapa interactivo de Grassly con canchas y filtros para encontrar locales cercanos',
    title: (
      <>
        Encuentra tu <span className="text-[#D7FF38]">cancha</span> ideal.
      </>
    ),
    description:
      'Explora el mapa interactivo de MapBox en tiempo real, filtra por deportes y encuentra complejos deportivos cerca de ti.',
  },
  {
    image: '/imagesApp/phone-canchaApp.png',
    alt: 'Detalles de una cancha, servicios y comodidades disponibles',
    title: <>Conoce cada detalle.</>,
    description:
      'Revisa fotos, comodidades como Wi-Fi y estacionamiento, y el tipo de grass antes de separar tu turno. Todo transparente.',
  },
  {
    image: '/imagesApp/phone-horarioApp.png',
    alt: 'Horarios disponibles y precios para elegir un turno en Grassly',
    title: <>Elige tu horario al instante.</>,
    description:
      'Consulta los turnos disponibles y sus precios para encontrar el horario que mejor se adapta a tu partido.',
  },
  {
    image: '/imagesApp/phone-pasarelaPagoApp.png',
    alt: 'Opciones para pagar una reserva con Yape o Plin desde Grassly',
    title: (
      <>
        Reserva y paga en <span className="text-[#6E4BFF]">3 toques.</span>
      </>
    ),
    description:
      'Elige tu horario y asegura tu cancha rápidamente subiendo tu comprobante de Yape o Plin directo desde la app.',
  },
  {
    image: '/imagesApp/phone-miPerfilApp.png',
    alt: 'Perfil de jugador con sus reservas próximas e historial',
    title: <>Tu agenda siempre en orden.</>,
    description:
      'Accede a tu perfil para revisar tus reservas próximas, tu historial de partidos jugados y tus locales favoritos.',
  },
]

function StorySection({
  index,
  active,
  onActive,
}: {
  index: number
  active: boolean
  onActive: (index: number) => void
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, {
    margin: '-45% 0px -45% 0px',
  })
  const section = sections[index]

  useEffect(() => {
    if (isInView) onActive(index)
  }, [index, isInView, onActive])

  return (
    <section
      ref={sectionRef}
      aria-labelledby={`app-detail-title-${index}`}
      className="flex min-h-[100svh] scroll-mt-32 flex-col justify-center py-24 lg:min-h-screen lg:py-20"
    >
      <div className="max-w-xl">
        <h2
          id={`app-detail-title-${index}`}
          className="text-balance font-display text-4xl font-black leading-[.98] tracking-[-.035em] text-white sm:text-5xl lg:text-6xl"
        >
          {section.title}
        </h2>
        <p className="mt-6 max-w-lg text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
          {section.description}
        </p>
        <span
          aria-hidden="true"
          className={`mt-8 block h-1 w-12 rounded-full transition-colors duration-500 ${
            active ? 'bg-[#D7FF38]' : 'bg-white/20'
          }`}
        />
      </div>

      <div className="relative mx-auto mt-10 w-[min(70vw,280px)] sm:w-[min(60vw,320px)] lg:hidden">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-[#0B0D0B]">
          <Image
            src={section.image}
            alt={section.alt}
            fill
            sizes="(min-width: 640px) 320px, 280px"
            className="object-contain"
          />
        </div>
      </div>
    </section>
  )
}

export function AppDetallesScrolly() {
  const [activeSection, setActiveSection] = useState(0)
  const prefersReducedMotion = useReducedMotion()
  const setActive = useCallback((index: number) => {
    setActiveSection(index)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  return (
    <main className="relative overflow-clip bg-[#151c16] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-48 top-40 size-[32rem] rounded-full bg-[#6E4BFF]/[.07] blur-[120px]"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="relative z-10">
          {sections.map((section, index) => (
            <StorySection
              key={section.image}
              index={index}
              active={activeSection === index}
              onActive={setActive}
            />
          ))}
        </div>

        <div className="sticky top-24 z-10 hidden h-[calc(100svh_-_6rem)] self-start items-center justify-center lg:flex">
          <div className="relative flex h-full w-full items-center justify-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-[400px] w-[250px] rounded-full bg-[#6E4BFF] opacity-30 blur-[120px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-[300px] w-[200px] translate-x-20 translate-y-24 rounded-full bg-[#D7FF38] opacity-15 blur-[100px]"
            />

            <div className="relative z-10 mx-auto h-[min(700px,78svh)] w-full max-w-sm">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={sections[activeSection].image}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  <Image
                    src={sections[activeSection].image}
                    alt={sections[activeSection].alt}
                    fill
                    sizes="(min-width: 1024px) 384px, 100vw"
                    preload={activeSection === 0}
                    className="object-contain"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
