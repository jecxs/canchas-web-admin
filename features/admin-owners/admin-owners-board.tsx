'use client'

import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/states/empty-state'
import { OwnerCard } from './owner-card'
import type { AdminOwnersData } from './types'

export function AdminOwnersBoard({ data }: { data: AdminOwnersData }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return data.owners
    return data.owners.filter((owner) =>
      `${owner.name} ${owner.email ?? ''} ${owner.dni ?? ''} ${owner.phone ?? ''}`.toLowerCase().includes(term),
    )
  }, [data.owners, query])

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Cuentas de negocio</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">Propietarios</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Consulta las cuentas responsables de cada negocio, sus locales y su estado comercial.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 sm:min-w-64">
          <div>
            <p className="text-xl font-black leading-none">{data.summary.total}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">propietarios</p>
          </div>
          <div>
            <p className="text-xl font-black leading-none text-success-foreground">{data.summary.withActiveSubscription}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">con suscripción</p>
          </div>
          <div>
            <p className="text-xl font-black leading-none text-info-foreground">{data.summary.withPublishedLocals}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">con publicados</p>
          </div>
        </div>
      </div>

      <div className="relative mt-7 w-full sm:max-w-sm">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, correo o DNI"
          className="pl-10"
        />
      </div>

      <section className="mt-6">
        {filtered.length ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((owner) => (
              <OwnerCard key={owner.id} owner={owner} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay propietarios con estos criterios"
            description="Prueba con otro nombre, correo o número de documento."
          />
        )}
      </section>
    </div>
  )
}
