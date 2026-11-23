import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'

export function LegalPageShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#F4F6F0] px-5 py-8 text-[#151c16] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <Link
            href="/"
            aria-label="Grassly, inicio"
            className="inline-flex min-h-11 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151c16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F6F0]"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#2A2A2A] sm:size-14">
              <span className="relative block size-[85%]">
                <Image
                  src="/iconGrasslysinFondo.png"
                  alt=""
                  fill
                  sizes="(min-width: 640px) 48px, 40px"
                  quality={100}
                  className="object-contain"
                />
              </span>
            </span>
            <span className="font-display text-2xl font-black uppercase tracking-tight text-[#2A2A2A] sm:text-3xl">
              GRASSLY
            </span>
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#39443b] hover:text-[#151c16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151c16]">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
            Volver a Grassly
          </Link>
        </header>

        <article className="mt-12 rounded-2xl border-2 border-[#151c16] bg-white p-6 sm:mt-16 sm:p-10">
          <h1 className="font-display text-4xl font-black uppercase leading-[.9] tracking-[-.025em] sm:text-6xl">
            {title}
          </h1>
          <div className="mt-8 space-y-8 text-sm leading-7 text-[#39443b] sm:text-base">
            {children}
          </div>
        </article>
      </div>
    </main>
  )
}
