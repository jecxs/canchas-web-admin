import Image from 'next/image'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  FilterHorizontalIcon,
  HistoryIcon,
  Location03Icon,
} from '@hugeicons/core-free-icons'

const features = [
  {
    icon: Location03Icon,
    title: 'Mapa interactivo MapBox',
    description: 'Encuentra canchas y locales cerca de ti.',
  },
  {
    icon: FilterHorizontalIcon,
    title: 'Deportes y horarios',
    description: 'Filtra opciones según cómo y cuándo quieres jugar.',
  },
  {
    icon: HistoryIcon,
    title: 'Historial y perfil de jugador',
    description: 'Consulta tus reservas y mantén tus datos al día.',
  },
]

export function AppShowcase() {
  return (
    <section
      id="app"
      className="relative isolate overflow-hidden bg-[#151c16] px-5 py-24 text-white sm:px-8 lg:px-8 lg:py-32"
    >
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative z-10">
          <h2 className="max-w-xl text-balance font-display text-4xl font-black leading-[.98] tracking-[-.035em] sm:text-5xl lg:text-6xl">
            Reserva y gestiona en{' '}
            <span className="text-[#D7FF38]">segundos</span>
          </h2>

          <div className="mt-8 grid gap-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group flex items-start gap-4 rounded-2xl p-4 transition-colors duration-300 hover:bg-[#17201A]"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/10 text-[#D7FF38] transition-colors duration-300 group-hover:border-[#6E4BFF]/30">
                  <HugeiconsIcon icon={feature.icon} strokeWidth={1.8} className="size-5" />
                </span>
                <span className="pt-1">
                  <span className="block text-base font-bold text-white transition-colors duration-300 group-hover:text-[#6E4BFF]">
                    {feature.title}
                  </span>
                  <span className="mt-1 block max-w-md text-sm leading-6 text-white/60">
                    {feature.description}
                  </span>
                </span>
              </article>
            ))}
          </div>

          <Link
            href="/app-detalles"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#D7FF38] px-7 py-3 text-sm font-extrabold text-[#151c16] transition duration-300 hover:scale-[1.02] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF38] focus-visible:ring-offset-4 focus-visible:ring-offset-[#151c16]"
          >
            Descubrir la App
          </Link>
        </div>

        <div className="relative z-10 flex min-h-[520px] w-full items-center justify-center sm:min-h-[600px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-[400px] w-[250px] rounded-full bg-[#6E4BFF] opacity-30 blur-[120px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-[300px] w-[200px] rounded-full bg-[#D7FF38] opacity-15 blur-[100px]"
          />
          <Image
            src="/landing/app-1.png"
            alt="Vista de la app móvil de Grassly para encontrar canchas y gestionar reservas"
            width={848}
            height={1568}
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 320px, 280px"
            className="app-showcase-float relative z-10 h-auto w-[280px] object-contain drop-shadow-2xl sm:w-[320px]"
          />
        </div>
      </div>
    </section>
  )
}
