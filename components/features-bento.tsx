'use client'

import Image from 'next/image'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar03Icon,
  Store01Icon,
} from '@hugeicons/core-free-icons'
import { FinancialControlCard } from '@/components/financial-control-card'

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
]

export function FeaturesBento() {
  return (
    <section id="beneficios" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        <div>
          <h2 className="section-title">Menos tareas<br />manuales. Más cancha.</h2>
        </div>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground lg:justify-self-end">
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
          <div className="mt-8 overflow-hidden rounded-xl border border-gray-200/70 bg-[#151c16] shadow-2xl shadow-gray-200/50">
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

        <article className="relative isolate overflow-hidden rounded-2xl border border-border bg-card p-7">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.07]">
            <svg viewBox="0 0 480 240" fill="none" className="absolute -right-10 -top-8 h-[125%] w-[70%] text-[#151c16]">
              <path d="M288-20 240 36l34 35-47 35 31 39-48 54 28 59M352-20l-30 47 42 23-38 44 31 35-34 40 39 48M420-20l-45 54 38 32-32 42 39 34-40 42 34 48M482 11l-50 37 31 41-44 38 39 35-35 47 28 34" stroke="currentColor" strokeWidth="2"/>
              <path d="m239 36 83-9 56 18 42-34M227 106l95-17 74 28 58-43M210 160l112-19 78 28 55-17M182 214l140-14 79 15 52-24" stroke="currentColor" strokeWidth="2"/>
              <circle cx="322" cy="89" r="7" fill="currentColor"/>
              <circle cx="400" cy="115" r="5" fill="currentColor"/>
              <circle cx="357" cy="200" r="6" fill="currentColor"/>
            </svg>
          </div>
          <div className="relative z-10 flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-success-foreground">
              <HugeiconsIcon icon={features[1].icon} strokeWidth={2} className="size-5" />
            </span>
            <div>
              <h3 className="text-2xl font-black tracking-[-.045em]">{features[1].title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{features[1].text}</p>
            </div>
          </div>
          <div className="relative z-10 mt-6 flex flex-wrap gap-2" aria-label="Ejemplo de selector de sedes">
            <span className="inline-flex min-h-10 items-center rounded-full border border-[#151c16] bg-[#D7FF38] px-4 text-sm font-bold text-[#151c16]">
              Complejo Norte
            </span>
            <span className="inline-flex min-h-10 items-center rounded-full border border-[#151c16]/20 bg-white px-4 text-sm font-bold text-[#151c16]">
              Complejo Sur
            </span>
          </div>
        </article>

        <FinancialControlCard />
      </div>
    </section>
  )
}
