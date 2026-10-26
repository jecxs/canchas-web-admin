'use client'

import Link from 'next/link'
import { useEffect, useState, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'datos-generales', label: 'Datos generales' },
  { id: 'identidad-visual', label: 'Logo y galería' },
  { id: 'horarios', label: 'Horarios' },
  { id: 'beneficios', label: 'Beneficios' },
  { id: 'pagos-politicas', label: 'Pagos y políticas' },
  { id: 'mercado-pago', label: 'Mercado Pago' },
] as const

type SectionId = (typeof sections)[number]['id']

export function SettingsSectionNav({ courtsHref = '/panel/canchas' }: { courtsHref?: string } = {}) {
  const [activeSection, setActiveSection] = useState<SectionId>('datos-generales')

  useEffect(() => {
    const scrollRoot = document.querySelector<HTMLElement>('[data-slot="dashboard-content"]')
    const elements = sections
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]

        if (visibleEntry) {
          setActiveSection(visibleEntry.target.id as SectionId)
        }
      },
      { root: scrollRoot, rootMargin: '-24px 0px -65% 0px', threshold: 0 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  function scrollToSection(event: MouseEvent<HTMLAnchorElement>, id: SectionId) {
    event.preventDefault()
    const target = document.getElementById(id)
    const scrollRoot = document.querySelector<HTMLElement>('[data-slot="dashboard-content"]')
    if (!target || !scrollRoot) return

    const top = scrollRoot.scrollTop
      + target.getBoundingClientRect().top
      - scrollRoot.getBoundingClientRect().top
      - 24
    scrollRoot.scrollTo({ top, behavior: 'smooth' })
    window.history.replaceState(null, '', `#${id}`)
    setActiveSection(id)
  }

  return (
    <nav
      aria-label="Secciones de configuración"
      className="sticky top-0 z-20 flex gap-1 overflow-x-auto rounded-2xl border border-border/80 bg-background/95 p-2 shadow-sm backdrop-blur-xl lg:top-6 lg:block lg:overflow-visible lg:bg-card lg:shadow-none"
    >
      {sections.map(({ id, label }) => {
        const isActive = activeSection === id

        return (
          <a
            key={id}
            href={`#${id}`}
            aria-current={isActive ? 'location' : undefined}
            onClick={(event) => scrollToSection(event, id)}
            className={cn(
              'shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors lg:block',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
          >
            {label}
          </a>
        )
      })}
      <Link
        href={courtsHref}
        className="shrink-0 rounded-xl bg-primary/14 px-3 py-2.5 text-sm font-bold transition-colors hover:bg-primary/22 lg:mt-1 lg:block"
      >
        Canchas y tarifas →
      </Link>
    </nav>
  )
}
