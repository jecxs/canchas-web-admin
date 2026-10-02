import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  CreditCardIcon,
  Store01Icon,
  Task01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { localStatePresentation } from '@/components/dashboard/status'
import { requireAdmin } from '@/lib/auth/dal'
import { getAdminOverview } from '@/features/admin-overview/queries'
import { ADMIN_LOCAL_STATES } from '@/features/admin-locales/types'

const metrics = [
  {
    key: 'applications',
    label: 'Solicitudes por revisar',
    href: '/admin/solicitudes',
    icon: Task01Icon,
  },
  {
    key: 'locales',
    label: 'Locales en la plataforma',
    href: '/admin/locales',
    icon: Store01Icon,
  },
  {
    key: 'owners',
    label: 'Propietarios registrados',
    href: '/admin/propietarios',
    icon: UserGroupIcon,
  },
  {
    key: 'subscriptions',
    label: 'Suscripciones activas',
    href: '/admin/suscripciones',
    icon: CreditCardIcon,
  },
] as const

export default async function AdminDashboardPage() {
  const [context, overview] = await Promise.all([requireAdmin(), getAdminOverview()])

  const values: Record<(typeof metrics)[number]['key'], { value: number; hint: string }> = {
    applications: {
      value: overview.pendingApplications,
      hint: `${overview.locales.byState.aprobado_pendiente_pago} esperando pago`,
    },
    locales: {
      value: overview.locales.total,
      hint: `${overview.locales.published} publicados`,
    },
    owners: {
      value: overview.owners,
      hint: `${overview.totalSubscriptions} con suscripción`,
    },
    subscriptions: {
      value: overview.activeSubscriptions,
      hint: `de ${overview.totalSubscriptions} registradas`,
    },
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-success-foreground">
        Acceso administrativo verificado
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Panel general de Grassly</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Hola, {context.profile.nombre_completo}. Supervisa las solicitudes, locales y suscripciones de
        la plataforma desde este espacio.
      </p>

      <section className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link key={metric.key} href={metric.href} className="group">
            <Card className="h-full gap-0 py-4 transition-colors group-hover:border-plum/50 group-hover:bg-plum/[.05]">
              <CardContent className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/20 text-success-foreground">
                    <HugeiconsIcon icon={metric.icon} strokeWidth={2} className="size-4.5" />
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </div>
                <div>
                  <p className="text-2xl font-black leading-none">{values[metric.key].value}</p>
                  <p className="mt-1 text-xs font-bold">{metric.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{values[metric.key].hint}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Locales por estado</h2>
          <Link href="/admin/locales" className="text-sm font-bold text-success-foreground hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {ADMIN_LOCAL_STATES.map((state) => (
            <Link key={state} href={`/admin/locales?estado=${state}`}>
              <Badge variant={localStatePresentation[state].tone} className="px-3 py-1.5">
                {localStatePresentation[state].label}
                <span className="font-black">{overview.locales.byState[state]}</span>
              </Badge>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
