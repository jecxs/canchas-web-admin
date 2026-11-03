import type { ReactNode } from 'react'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { GrasslyMark } from '@/components/brand/grassly-mark'

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
          <Link href="/" aria-label="Grassly, inicio">
            <GrasslyMark className="text-lg" />
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
          <p className="mt-4 text-sm text-[#526055]">Documento de ejemplo · Actualizado el 29 de octubre de 2026</p>
          <div className="mt-8 rounded-xl border-2 border-[#151c16] bg-[#D7FF38]/40 p-4 text-sm leading-6">
            Este contenido es solo una muestra y no constituye una política o documento legal vigente. Debe revisarse y completarse antes de publicar o usar oficialmente.
          </div>
          <div className="mt-8 space-y-8 text-sm leading-7 text-[#39443b] sm:text-base">
            {children}
          </div>
        </article>
      </div>
    </main>
  )
}
