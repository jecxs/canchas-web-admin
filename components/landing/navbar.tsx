'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef} from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Menu01Icon } from '@hugeicons/core-free-icons'
import { FlashTransitionLink } from '@/components/flashTransitionLink'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const navigation = [
  { label: 'PLATAFORMA', href: '/#plataforma' },
  { label: 'APP MÓVIL', href: '/app-detalles' },
  { label: 'PRECIO', href: '/#precio' },
]

function BrandLogo({ isReady }: { isReady: boolean }) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const brandText = "GRASSLY".split("")

  const pathname = usePathname()

  useGSAP(() => {
    if (!isReady) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo('.logo-icon',
      { scale: 0, opacity: 0, rotate: -15 },
      { scale: 1, opacity: 1, rotate: 0, duration: 0.6, ease: 'back.out(1.7)' }
    )

    tl.fromTo('.logo-letter',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.05 },
      "-=0.4"
    )
  }, { scope: containerRef,
    dependencies: [pathname, isReady],
    revertOnUpdate: true })

  return (
    <span ref={containerRef} className="group inline-flex cursor-pointer items-center gap-3">
      <span className="logo-icon relative flex items-center justify-center size-12 shrink-0 sm:size-14 rounded-2xl bg-[#2A2A2A] transition-transform duration-300 ease-out group-hover:scale-105">
        <span className="relative block size-[85%]">
          <Image
            src="/iconGrasslysinFondo.png"
            alt="Grassly Logo"
            fill
            sizes="(min-width: 640px) 48px, 40px"
            quality={100}
            priority
            className="object-contain"
          />
        </span>
      </span>

      <span className="flex overflow-hidden font-display text-2xl font-black uppercase tracking-tight text-[#2A2A2A] sm:text-3xl">
        {brandText.map((letter, i) => (
          <span key={i} className="logo-letter inline-block">
            {letter}
          </span>
        ))}
      </span>
    </span>
  )
}


export function Navbar({ isReady = true }: { isReady?: boolean }) {
  const pathname = usePathname()
  const isFocusMode = pathname === '/app-detalles'
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className={`fixed top-0 left-0 z-[100] grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3 border-b-[6px] border-[#2A2A2A] bg-[#EDEDED] px-4 py-3 shadow-[0px_8px_0px_#2A2A2A] sm:px-8 lg:py-4 ${isFocusMode ? 'lg:grid-cols-[1fr_auto]' : 'lg:grid-cols-[auto_1fr_auto]'}`}>
      <div className="inline-flex min-h-11 items-center">
        {isFocusMode ? (
          <FlashTransitionLink
            href="/"
            isReverse={true}
            aria-label="Grassly, inicio"
            className="inline-flex min-h-11 items-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF]">
            <BrandLogo isReady={isReady} />
          </FlashTransitionLink>
        ) : (
          <Link
            href="/"
            aria-label="Grassly, inicio"
            className="inline-flex min-h-11 items-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF]">
            {/* Y AQUÍ */}
            <BrandLogo isReady={isReady} />
          </Link>
        )}
      </div>

      {!isFocusMode && (
        <nav aria-label="Navegación principal" className="hidden items-center justify-center gap-5 lg:flex xl:gap-8">
          {navigation.map((item) => {
            if (item.href === '/app-detalles') {
              return (
                <FlashTransitionLink
                  key={item.href}
                  href={item.href}
                  className="group relative inline-flex min-h-11 items-center text-sm font-black uppercase tracking-wider text-gray-800 transition-all duration-300 hover:text-[#6E4BFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E4BFF]"
                >
                  <span className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
                    {item.label}
                  </span>
                  <span className="absolute bottom-2 left-0 h-[2px] w-0 bg-[#6E4BFF] transition-all duration-300 group-hover:w-full" />
                </FlashTransitionLink>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative inline-flex min-h-11 items-center text-sm font-black uppercase tracking-wider text-gray-800 transition-all duration-300 hover:text-[#6E4BFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E4BFF]"
              >
                <span className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
                  {item.label}
                </span>
                <span className="absolute bottom-2 left-0 h-[2px] w-0 bg-[#6E4BFF] transition-all duration-300 group-hover:w-full" />
              </Link>
            )
          })}
        </nav>
      )}

      {!isFocusMode && (
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          className="grid size-11 place-items-center border-2 border-[#2A2A2A] transition-colors hover:bg-[#6BFF2E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF] lg:hidden"
        >
          <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} strokeWidth={2} className="size-5" />
        </button>
      )}

      <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:flex sm:justify-end lg:col-span-1">
        <Link
          href="/registro"
          className="group relative inline-flex min-h-11 items-center justify-center overflow-hidden border-2 border-[#2A2A2A] px-3 text-[10px] font-black uppercase tracking-[.08em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF] sm:px-4">
            <span className="absolute inset-0 bg-[#6E4BFF] translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0" />
              <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                Ingresar
              </span>
        </Link>
        <Link
          href="/registro"
          className="group relative inline-flex min-h-11 items-center justify-center overflow-hidden border-2 border-[#2A2A2A] bg-[#2A2A2A] px-3 text-[10px] font-black uppercase tracking-[.08em] text-[#EDEDED] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF] sm:px-4">
            <span className="absolute inset-0 bg-[#6E4BFF] translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0" />
              <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                Registrarse
              </span>
        </Link>
      </div>

      {!isFocusMode && menuOpen && (
        <nav
        aria-label="Navegación móvil" className="absolute left-0 right-0 top-full z-[60] grid gap-1 border-[3px] border-[#2A2A2A] bg-[#EDEDED] p-3 shadow-[8px_8px_0px_#2A2A2A] lg:hidden">
        {navigation.map((item) => {
          if (item.href === '/app-detalles') {
            return (
              <FlashTransitionLink
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="group inline-flex min-h-11 items-center px-3 text-sm font-black uppercase tracking-wider text-gray-800 transition-all duration-200 hover:bg-[#6BFF2E] hover:text-[#2A2A2A] hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E4BFF]">
                {item.label}
              </FlashTransitionLink>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="group inline-flex min-h-11 items-center px-3 text-sm font-black uppercase tracking-wider text-gray-800 transition-all duration-200 hover:bg-[#6BFF2E] hover:text-[#2A2A2A] hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E4BFF]">
              {item.label}
            </Link>
          )
        })}
      </nav>
      )}
    </header>
  )
}
