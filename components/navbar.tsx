'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Menu01Icon } from '@hugeicons/core-free-icons'

const navigation = [
  { label: 'Beneficios', href: '/#beneficios' },
  { label: 'El sistema', href: '/#panel' },
  { label: 'App móvil', href: '/#app' },
  { label: 'Precio', href: '/#precio' },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 z-[100] grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3 border-b-[6px] border-[#2A2A2A] bg-[#EDEDED] px-4 py-3 shadow-[0px_8px_0px_#2A2A2A] sm:px-8 lg:grid-cols-[auto_1fr_auto] lg:py-4">
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
            className="inline-flex min-h-11 items-center text-[11px] font-extrabold uppercase tracking-[.1em] transition-colors hover:text-[#6E4BFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E4BFF]"
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
  )
}
