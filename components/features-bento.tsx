'use client'

import Image from 'next/image'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Analytics01Icon,
  Calendar03Icon,
  Store01Icon,
} from '@hugeicons/core-free-icons'
import { useState } from 'react'

const features = [
  {
    icon: Calendar03Icon,
    title: 'Vista de Administrador',
    text: 'Visualiza cada horario, cancha y estado en un calendario vivo. Menos llamadas, cero doble reserva.',
  },
  {
    icon: Store01Icon,
    title: 'Panel Multisede',
    text: 'Administra una cancha hoy o una red completa mañana, sin perder el control de cada sede.',
  },
  {
    icon: Analytics01Icon,
    title: 'Control Financiero',
    text: 'Mira cuánto entra por día, qué canchas rinden más y qué deportes dejan más dinero.',
  },
]

export function FeaturesBento() {
  const [activeCard, setActiveCard] = useState<'tiempo' | 'cancha' | 'deporte'>('deporte')

  return (
    <section id="beneficios" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
        <div>
          <h2 className="section-title">Menos tareas<br />manuales. Más cancha.</h2>
        </div>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          Tú conoces a tus clientes y tu negocio. Grassly se encarga del orden detrás de cada reserva para que puedas concentrarte en hacerlo crecer.
        </p>
      </div>

      <div className="mt-14 grid gap-4 lg:grid-cols-2">
        <article className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-floating lg:row-span-2">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-success-foreground">
              <HugeiconsIcon icon={features[0].icon} strokeWidth={2} className="size-5" />
            </span>
            <div>
              <h3 className="text-2xl font-black tracking-[-.045em]">{features[0].title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{features[0].text}</p>
            </div>
          </div>
          <div className="mt-8 overflow-hidden rounded-xl border-2 border-[#151c16] bg-[#151c16]">
            <div className="flex h-9 items-center gap-2 px-3">
              <span aria-hidden="true" className="flex gap-1.5">
                <span className="size-2 rounded-full bg-white/40" />
                <span className="size-2 rounded-full bg-white/40" />
                <span className="size-2 rounded-full bg-white/40" />
              </span>
              <span className="ml-2 truncate font-mono text-[10px] text-white/70">grassly.app/agenda</span>
            </div>
            <div className="relative h-64 bg-white lg:h-72">
              <Image
                src="/landing/capAgenda.png"
                alt="Agenda de Grassly con reservas por cancha y horario"
                fill
                sizes="(min-width: 1024px) 640px, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-7">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-success-foreground">
              <HugeiconsIcon icon={features[1].icon} strokeWidth={2} className="size-5" />
            </span>
            <div>
              <h3 className="text-2xl font-black tracking-[-.045em]">{features[1].title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{features[1].text}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Ejemplo de selector de sedes">
            <span className="inline-flex min-h-10 items-center rounded-full border border-[#151c16] bg-[#D7FF38] px-4 text-sm font-bold text-[#151c16]">
              Complejo Norte
            </span>
            <span className="inline-flex min-h-10 items-center rounded-full border border-[#151c16]/20 bg-white px-4 text-sm font-bold text-[#151c16]">
              Complejo Sur
            </span>
          </div>
        </article>

        <article className="group rounded-2xl border border-border bg-card p-7">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-success-foreground">
              <HugeiconsIcon icon={features[2].icon} strokeWidth={2} className="size-5" />
            </span>
            <div>
              <h3 className="text-2xl font-black tracking-[-.045em]">{features[2].title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{features[2].text}</p>
            </div>
          </div>
          <div className="relative mt-8 h-64" aria-label="Vistas de reportes financieros">
            <button
              type="button"
              onClick={() => setActiveCard('tiempo')}
              aria-label="Destacar reporte de cobros en el tiempo"
              aria-pressed={activeCard === 'tiempo'}
              className={`absolute left-1/2 top-0 w-[92%] -translate-x-1/2 cursor-pointer overflow-hidden rounded-xl border-2 border-[#151c16] bg-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151c16] ${activeCard === 'tiempo' ? 'z-40 rotate-0 scale-105 shadow-[8px_8px_0px_#151c16]' : 'z-10 rotate-2 scale-[.96] opacity-90 shadow-[4px_4px_0px_#151c16] hover:opacity-100'}`}
            >
              <Image
                src="/landing/capCobrado.png"
                alt="Reporte de cobros en el tiempo"
                width={1450}
                height={500}
                sizes="(min-width: 1024px) 480px, 80vw"
                className="block h-auto w-full"
              />
            </button>
            <button
              type="button"
              onClick={() => setActiveCard('cancha')}
              aria-label="Destacar reporte de cobros por cancha"
              aria-pressed={activeCard === 'cancha'}
              className={`absolute bottom-0 left-0 w-[66%] cursor-pointer overflow-hidden rounded-xl border-2 border-[#151c16] bg-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151c16] ${activeCard === 'cancha' ? 'z-40 rotate-0 scale-105 shadow-[8px_8px_0px_#151c16]' : 'z-20 -rotate-3 opacity-90 shadow-[4px_4px_0px_#151c16] hover:opacity-100'}`}
            >
              <Image
                src="/landing/capCobradoxCancha.png"
                alt="Reporte de cobros por cancha"
                width={740}
                height={432}
                sizes="(min-width: 1024px) 420px, 72vw"
                className="block h-auto w-full"
              />
            </button>
            <button
              type="button"
              onClick={() => setActiveCard('deporte')}
              aria-label="Destacar reporte de cobros por deporte"
              aria-pressed={activeCard === 'deporte'}
              className={`absolute bottom-0 right-0 w-[60%] cursor-pointer overflow-hidden rounded-xl border-2 border-[#151c16] bg-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151c16] ${activeCard === 'deporte' ? 'z-40 rotate-0 scale-105 shadow-[8px_8px_0px_#151c16]' : 'z-30 rotate-2 opacity-90 shadow-[4px_4px_0px_#151c16] hover:opacity-100'}`}
            >
              <Image
                src="/landing/capCobradoxDep.png"
                alt="Reporte de cobros por deporte"
                width={718}
                height={300}
                sizes="(min-width: 1024px) 340px, 58vw"
                className="block h-auto w-full"
              />
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}
