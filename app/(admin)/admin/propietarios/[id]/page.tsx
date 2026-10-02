import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  CreditCardIcon,
  Store01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { localStatePresentation } from '@/components/dashboard/status'
import { EntityAvatar, LocalLogo } from '@/components/dashboard/entity-media'
import { getAdminOwnerDetail } from '@/features/admin-owners/queries'

const subscriptionLabels: Record<string, { label: string; tone: 'success' | 'warning' | 'destructive' | 'neutral' | 'info' }> = {
  sin_metodo_pago: { label: 'Método de pago pendiente', tone: 'info' },
  activa: { label: 'Suscripción activa', tone: 'success' },
  pago_fallido: { label: 'Pago fallido', tone: 'destructive' },
  cancelada: { label: 'Suscripción cancelada', tone: 'neutral' },
}

const roleLabels: Record<string, string> = {
  cliente: 'Cliente',
  dueno: 'Propietario',
  super_admin: 'Superadministrador',
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return 'No registrado'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No registrado'
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const } : {}),
  }).format(date)
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 }).format(value)
}

function DataItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-semibold">{value || 'No registrado'}</dd>
    </div>
  )
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: IconSvgElement
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/20 text-success-foreground">
            <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
          </span>
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default async function AdminOwnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const owner = await getAdminOwnerDetail(id)
  if (!owner) notFound()

  const publishedCount = owner.locals.filter((local) => local.published).length
  const subscription = owner.subscription

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">Ficha del propietario</p>
            <Badge variant={owner.role === 'dueno' ? 'default' : 'neutral'}>
              {roleLabels[owner.role] ?? owner.role}
            </Badge>
          </div>
          <h1 className="mt-4 flex items-center gap-3 text-4xl font-black tracking-[-.04em]">
            <EntityAvatar src={owner.avatarUrl} name={owner.name} size="lg" />
            {owner.name}
          </h1>
          <p className="mt-3 text-muted-foreground">{owner.email ?? 'Sin correo registrado'}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card px-4 py-3 sm:min-w-72">
          <div>
            <p className="text-2xl font-black leading-none">{owner.locals.length}</p>
            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">locales</p>
          </div>
          <div>
            <p className="text-2xl font-black leading-none text-success-foreground">{publishedCount}</p>
            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">publicados</p>
          </div>
          <div>
            <p className="text-2xl font-black leading-none text-info-foreground">{owner.quota ?? '—'}</p>
            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">cupo</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <SectionCard icon={UserIcon} title="Datos de la cuenta">
          <dl className="grid gap-5 sm:grid-cols-2">
            <DataItem label="Nombre completo" value={owner.name} />
            <DataItem label="DNI" value={owner.dni} />
            <DataItem label="Correo" value={owner.email} />
            <DataItem label="Teléfono" value={owner.phone} />
            <DataItem label="Alta" value={formatDate(owner.createdAt)} />
            <DataItem label="Última actualización" value={formatDate(owner.updatedAt, true)} />
          </dl>
        </SectionCard>

        <SectionCard icon={CreditCardIcon} title="Suscripción" description="Estado comercial del propietario.">
          {subscription ? (
            <div className="space-y-5">
              <Badge variant={subscriptionLabels[subscription.state]?.tone ?? 'neutral'}>
                {subscriptionLabels[subscription.state]?.label ?? subscription.state}
              </Badge>
              <dl className="grid gap-5 sm:grid-cols-2">
                <DataItem label="Monto mensual" value={formatMoney(subscription.amount)} />
                <DataItem label="Próximo cobro" value={formatDate(subscription.nextChargeAt)} />
                <DataItem label="Sedes extra" value={String(subscription.extraSedes)} />
              </dl>
              <Separator />
              <div>
                <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Pagos registrados</p>
                {subscription.payments.length ? (
                  <ul className="mt-3 space-y-2">
                    {subscription.payments.slice(0, 8).map((payment) => (
                      <li key={payment.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2.5 text-sm">
                        <span className="font-semibold">{formatDate(payment.paidAt, true)}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground">{payment.status}</span>
                          <span className="font-extrabold">{formatMoney(payment.amount)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Sin pagos registrados.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Este propietario aún no tiene una suscripción registrada.</p>
          )}
        </SectionCard>
      </div>

      <div className="mt-5">
        <SectionCard
          icon={Store01Icon}
          title="Locales del propietario"
          description={`${owner.locals.length} ${owner.locals.length === 1 ? 'local registrado' : 'locales registrados'}.`}
        >
          {owner.locals.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {owner.locals.map((local) => {
                const state = localStatePresentation[local.state]
                return (
                  <Link
                    key={local.id}
                    href={`/admin/locales/${local.id}`}
                    className="group flex items-start justify-between gap-3 rounded-2xl border border-border/70 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <LocalLogo src={local.logoUrl} name={local.name} className="size-9 rounded-lg" />
                        <p className="truncate text-sm font-extrabold">{local.name}</p>
                      </div>
                      <p className="mt-1.5 truncate text-xs text-muted-foreground">{local.address}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant={state.tone}>{state.label}</Badge>
                        <Badge variant={local.published ? 'success' : 'neutral'}>
                          {local.published ? 'Publicado' : 'No publicado'}
                        </Badge>
                      </div>
                    </div>
                    <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 shrink-0 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin locales registrados.</p>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
