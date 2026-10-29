'use client'

import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Clock01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { useCourtsSync } from './courts-sync'
import type { DashboardReservation } from './types'

const LIMA = 'America/Lima'

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

function dateKey(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

export function NextTurnCard({
  nextByCourt,
  fallbackNext,
}: {
  nextByCourt: Record<string, DashboardReservation>
  fallbackNext: DashboardReservation | null
}) {
  const { courts, activeCourtId, setPaused } = useCourtsSync()
  const activeCourt = courts.find((court) => court.id === activeCourtId) ?? null
  const next = activeCourtId ? nextByCourt[activeCourtId] ?? null : fallbackNext
  const href = next
    ? `/panel/agenda?date=${dateKey(next.start)}&reservation=${next.id}`
    : activeCourtId
      ? `/panel/agenda?court=${activeCourtId}`
      : '/panel/agenda'

  return (
    <Link
      href={href}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="group rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-plum/40 hover:bg-plum/10 hover:shadow-md active:translate-y-0"
    >
      <div
        key={next?.id ?? activeCourtId ?? 'empty'}
        className="animate-in fade-in slide-in-from-bottom-1 duration-300"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 flex-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-primary transition-colors group-hover:text-plum">
            Próximo turno
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {courts.length > 1 ? (
              <div className="flex items-center gap-0.5">
                {courts.map((court) => (
                  <span
                    key={court.id}
                    className={cn(
                      'size-1.5 rounded-full transition-colors duration-300',
                      court.id === activeCourtId ? 'bg-primary' : 'bg-white/25',
                    )}
                  />
                ))}
              </div>
            ) : null}
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-white/55" />
          </div>
        </div>
        {next ? (
          <>
            <p className="mt-1 text-sm font-bold">
              {next.courtName} · {next.sportName}
            </p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-black leading-none">{formatTime(next.start)}</span>
              <span className="text-sm font-bold text-white/50">– {formatTime(next.end)}</span>
            </p>
            <p className="mt-1 text-xs text-white/60">
              {formatDateTime(next.start)} · {next.customerName}
            </p>
          </>
        ) : (
          <>
            {activeCourt ? (
              <p className="mt-1 text-sm font-bold">{activeCourt.name}</p>
            ) : null}
            <p className="mt-1 text-sm text-white/65">No tienes reservas próximas.</p>
          </>
        )}
      </div>
    </Link>
  )
}
