'use client'

import Link from 'next/link'
import { useEffect, useState, type FocusEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { ClientAvatar } from '@/components/dashboard/client-avatar'
import { cn } from '@/lib/utils'
import type { DashboardClient } from './types'

const LIMA = 'America/Lima'
const ROTATION_MS = 2000

function timeLabel(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA,
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

function clientHref(client: DashboardClient, kind: 'today' | 'frequent') {
  if (kind === 'today' && client.reservationId) {
    return `/panel/agenda?date=${dateKey(client.lastReservationAt)}&reservation=${client.reservationId}`
  }

  const params = new URLSearchParams({ q: client.phone || client.name })
  if (client.clientId) params.set('client', client.clientId)
  return `/panel/clientes?${params.toString()}`
}

function ClientPane({
  label,
  clients,
  index,
  emptyMessage,
  accent,
  kind,
}: {
  label: string
  clients: DashboardClient[]
  index: number
  emptyMessage: string
  accent: string
  kind: 'today' | 'frequent'
}) {
  const current = clients.length ? clients[index % clients.length] : null

  return (
    <div className="flex min-w-0 flex-col justify-between gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-xl font-extrabold uppercase text-plum">{label}</h1>
        <span className="mt-0.5 shrink-0 rounded-full bg-foreground/[.06] px-2 py-0.5 text-[10px] font-bold tabular-nums text-foreground/70">
          {clients.length}
        </span>
      </div>

      {current ? (
        <Link
          key={`${current.key}-${index}`}
          href={clientHref(current, kind)}
          className="group/client pointer-events-auto -mx-2 flex min-w-0 animate-in items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 duration-500 fade-in slide-in-from-bottom-1 transition-[background-color,border-color,box-shadow,transform] motion-safe:hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50 active:translate-y-0"
        >
          <ClientAvatar
            src={current.avatarUrl}
            name={current.name}
            className="size-9 rounded-full"
            fallbackClassName={cn('rounded-full', accent)}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold leading-tight">{current.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {current.reservations === 1 ? '1 reserva' : `${current.reservations} reservas`}
              {' · '}
              {timeLabel(current.lastReservationAt)}
            </p>
          </div>
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            strokeWidth={2}
            className="size-4 shrink-0 text-primary-foreground/40 transition-all duration-200 group-hover/client:text-primary-foreground"
          />
        </Link>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">{emptyMessage}</p>
      )}

      <div className="flex items-center gap-1">
        {clients.length > 1 ? (
          clients.map((client, dotIndex) => (
            <span
              key={client.key}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                dotIndex === index % clients.length ? 'w-4 bg-plum' : 'w-1 bg-foreground/15',
              )}
            />
          ))
        ) : (
          <span className="h-1 w-4 rounded-full bg-foreground/10" />
        )}
      </div>
    </div>
  )
}

export function ClientsSpotlight({
  todayClients,
  frequentClients,
}: {
  todayClients: DashboardClient[]
  frequentClients: DashboardClient[]
}) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const maxItems = Math.max(todayClients.length, frequentClients.length)

  useEffect(() => {
    if (maxItems <= 1 || paused) return

    const interval = window.setInterval(() => {
      setIndex((current) => current + 1)
    }, ROTATION_MS)

    return () => window.clearInterval(interval)
  }, [maxItems, paused])

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false)
  }

  return (
    <div
      className="relative flex min-h-[11rem] flex-1 flex-col overflow-hidden rounded-2xl border border-foreground/15 bg-lime-50/30 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-primary/10 hover:shadow-lg motion-safe:hover:-translate-y-0.5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={handleBlur}
    >
      <Link
        href="/panel/clientes"
        aria-label="Ver todos los clientes"
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-plum/50"
      />

      <div className="pointer-events-none relative z-10 grid flex-1 grid-cols-1 divide-y divide-foreground/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <ClientPane
          label="Reservaron hoy"
          clients={todayClients}
          index={index}
          emptyMessage="Todavía no hay reservas registradas para hoy."
          accent="bg-primary/25 text-primary-foreground"
          kind="today"
        />
        <ClientPane
          label="Clientes frecuentes"
          clients={frequentClients}
          index={index}
          emptyMessage="Aún no hay clientes con 2 o más reservas en los últimos 14 días."
          accent="bg-plum/15 text-plum"
          kind="frequent"
        />
      </div>
    </div>
  )
}
