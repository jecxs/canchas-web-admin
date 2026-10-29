'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useCourtsSync } from './courts-sync'

export function CourtsCarousel({ children }: { children?: ReactNode }) {
  const { courts, activeCourtId } = useCourtsSync()
  const current =
    courts.find((court) => court.id === activeCourtId) ?? courts[0] ?? null

  return (
    <>
      <div className="flex w-8 shrink-0 flex-col items-center border-r border-white/10 pr-2">
        {courts.length > 1 ? (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-0.5">
            {courts.map((court) => (
              <span
                key={court.id}
                className={cn(
                  'size-1.5 rounded-full transition-colors duration-300',
                  court.id === current?.id ? 'bg-primary' : 'bg-white/25',
                )}
              />
            ))}
          </div>
        ) : null}

        <p className="rotate-180 text-[9px] font-extrabold uppercase tracking-[.16em] text-white/45 [writing-mode:vertical-rl]">
          Canchas
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col pl-2">
        <div className="flex min-h-8 items-center justify-center overflow-hidden">
          <p
            key={current?.id ?? 'empty'}
            className="w-full animate-in fade-in slide-in-from-bottom-1 truncate text-center text-base font-bold text-white/90 duration-500 sm:text-lg"
          >
            {current?.name ?? 'Sin canchas activas'}
          </p>
        </div>

        {children ? <div className="mt-auto pt-3">{children}</div> : null}
      </div>
    </>
  )
}
