import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EntityAvatar, LocalLogo } from '@/components/dashboard/entity-media'
import type { AdminOwnerListItem } from './types'

const subscriptionLabels: Record<string, { label: string; tone: 'success' | 'warning' | 'destructive' | 'neutral' | 'info' }> = {
  sin_metodo_pago: { label: 'Método de pago pendiente', tone: 'info' },
  activa: { label: 'Suscripción activa', tone: 'success' },
  pago_fallido: { label: 'Pago fallido', tone: 'destructive' },
  cancelada: { label: 'Suscripción cancelada', tone: 'neutral' },
}

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 }).format(value)
}

export function OwnerCard({ owner }: { owner: AdminOwnerListItem }) {
  const subscription = owner.subscriptionState ? subscriptionLabels[owner.subscriptionState] : null

  return (
    <Link
      href={`/admin/propietarios/${owner.id}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      aria-label={`Ver propietario ${owner.name}`}
    >
      <Card className="relative h-full gap-0 py-0 transition-[transform,border-color,box-shadow,background-color] duration-300 ease-out group-hover:-translate-y-1 group-hover:border-plum/50 group-hover:bg-plum/[.05] group-hover:shadow-md group-active:translate-y-0 group-active:scale-[.995]">
        <CardContent className="flex h-full flex-col gap-2.5 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <EntityAvatar src={owner.avatarUrl} name={owner.name} size="lg" className="transition-transform duration-300 group-hover:scale-105" />
              <div className="min-w-0">
                <h2 className="truncate text-base font-extrabold tracking-tight transition-colors group-hover:text-plum">{owner.name}</h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{owner.email ?? 'Sin correo'}</p>
              </div>
            </div>
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors duration-300 group-hover:border-plum group-hover:bg-plum group-hover:text-white"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {subscription ? <Badge variant={subscription.tone}>{subscription.label}</Badge> : <Badge variant="neutral">Sin suscripción</Badge>}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>{owner.phone ?? 'Sin teléfono'}</span>
            {owner.dni ? <span>DNI {owner.dni}</span> : null}
            <span>Alta {formatDate(owner.createdAt)}</span>
            {owner.monthlyAmount != null ? <span>{formatMoney(owner.monthlyAmount)} / mes</span> : null}
          </div>

          <div className="mt-auto rounded-lg bg-muted/40 px-2.5 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
              {owner.localsCount} {owner.localsCount === 1 ? 'local' : 'locales'} · {owner.publishedCount} publicados
            </p>
            {owner.locals.length ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {owner.locals.slice(0, 5).map((local) => (
                  <LocalLogo key={local.id} src={local.logoUrl} name={local.name} className="size-7 rounded-md" />
                ))}
                {owner.locals.length > 5 ? (
                  <span className="text-[11px] font-semibold text-muted-foreground">+{owner.locals.length - 5}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
