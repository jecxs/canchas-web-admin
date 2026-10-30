'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  Menu01Icon,
} from '@hugeicons/core-free-icons'

const navigation = [
  { label: 'Beneficios', href: '#beneficios' },
  { label: 'El sistema', href: '#panel' },
  { label: 'App móvil', href: '#app' },
  { label: 'Precio', href: '#precio' },
]

export function MagazineHero() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <section className="relative isolate bg-[#AFFF00] px-4 py-8 text-[#2A2A2A] sm:px-7 sm:py-12 lg:px-10 lg:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute right-[5%] top-12 hidden size-52 rounded-full border-[3px] border-[#6BFF2E] lg:block" />

      <div className="relative mx-auto max-w-[1320px] border-[10px] border-[#2A2A2A] bg-[#EDEDED] shadow-[16px_16px_0px_#2A2A2A]">
        <header className="relative z-50 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3 border-b-[3px] border-[#2A2A2A] px-3 py-3 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:px-8 lg:py-4">
          <Link
            href="/"
            aria-label="Grassly, inicio"
            className="inline-flex min-h-11 items-center gap-2 font-display text-2xl font-black uppercase tracking-[-.045em] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF]"
          >
            <span className="relative block size-10 shrink-0 overflow-hidden">
              <Image
                src="/iconGrasslysinFondo.png"
                alt=""
                fill
                sizes="40px"
                className="scale-[1.9] object-contain"
              />
            </span>
            Grassly
          </Link>

          <nav aria-label="Navegación principal" className="hidden items-center justify-center gap-5 lg:flex xl:gap-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="min-h-11 inline-flex items-center text-[11px] font-extrabold uppercase tracking-[.1em] transition-colors hover:text-[#6E4BFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E4BFF]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            className="grid size-11 place-items-center border-2 border-[#2A2A2A] transition-colors hover:bg-[#6BFF2E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF] lg:hidden"
          >
            <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} strokeWidth={2} className="size-5" />
          </button>

          <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:flex sm:justify-end lg:col-span-1">
            <Link
              href="/registro"
              className="inline-flex min-h-11 items-center justify-center border-2 border-[#2A2A2A] px-3 text-[10px] font-black uppercase tracking-[.08em] transition-colors hover:bg-[#6BFF2E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF] sm:px-4"
            >
              Ingresar
            </Link>
            <Link
              href="/registro"
              className="inline-flex min-h-11 items-center justify-center border-2 border-[#2A2A2A] bg-[#2A2A2A] px-3 text-[10px] font-black uppercase tracking-[.08em] text-[#EDEDED] transition-colors hover:bg-[#6BFF2E] hover:text-[#2A2A2A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF] sm:px-4"
            >
              Registrarse
            </Link>
          </div>

          {menuOpen && (
            <nav
              aria-label="Navegación móvil"
              className="absolute left-0 right-0 top-full z-[60] grid gap-1 border-[3px] border-[#2A2A2A] bg-[#EDEDED] p-3 shadow-[8px_8px_0px_#2A2A2A] lg:hidden"
            >
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-11 items-center px-3 text-sm font-bold uppercase transition-colors hover:bg-[#AFFF00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E4BFF]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </header>

        <div className="relative isolate grid min-h-[700px] items-center px-5 py-10 sm:px-8 lg:min-h-[620px] lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:py-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] bg-[#AFFF00] [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)] lg:block" />

          <div className="relative z-40 max-w-[700px] pb-[18rem] sm:pb-[21rem] lg:pb-0">
            <h1 className="font-display text-[clamp(4rem,14vw,11rem)] font-black uppercase leading-[.76] tracking-[-.045em]">
              GRASSLY
            </h1>
            <p className="mt-5 font-display text-[clamp(1.75rem,4.2vw,3.25rem)] font-black uppercase leading-[.92] tracking-[.08em] text-[#6E4BFF]">
              Todo el juego.<br />En orden.
            </p>
            <p className="mt-5 max-w-md text-sm font-semibold leading-6 sm:text-base sm:leading-7">
              Agenda, cobros y tarifas de tus canchas, sin cuadernos ni mensajes sueltos.
            </p>
            <Link
              href="/registro"
              className="mt-8 inline-flex min-h-16 min-w-52 items-center justify-center border-[4px] border-[#2A2A2A] bg-[#2A2A2A] px-10 text-sm font-black uppercase tracking-[.16em] text-[#EDEDED] shadow-[8px_8px_0px_#AFFF00] transition-colors hover:bg-[#6BFF2E] hover:text-[#2A2A2A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#EDEDED]"
            >
              Empezar
            </Link>
          </div>

          <div className="pointer-events-none absolute bottom-[-5%] right-[-5%] z-30 h-[50%] w-[72%] sm:right-[-3%] sm:h-[56%] sm:w-[65%] lg:bottom-[-14%] lg:right-[-12%] lg:h-[125%] lg:w-[50%]">
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
