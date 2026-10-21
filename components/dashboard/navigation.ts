import type { IconSvgElement } from '@hugeicons/react'
import {
  Building03Icon,
  Calendar03Icon,
  Cashier02Icon,
  ChartLineData01Icon,
  CreditCardIcon,
  DashboardSquare01Icon,
  Invoice03Icon,
  Money03Icon,
  Settings02Icon,
  Store01Icon,
  Task01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import type { DashboardRole } from './types'

export type DashboardNavigationItem = {
  title: string
  href: string
  icon: IconSvgElement
  exact?: boolean
}

const ownerNavigation = [
  { title: 'Resumen', href: '/panel', icon: DashboardSquare01Icon, exact: true },
  { title: 'Agenda', href: '/panel/agenda', icon: Calendar03Icon },
  { title: 'Reservas', href: '/panel/reservas', icon: Invoice03Icon },
  { title: 'Canchas', href: '/panel/canchas', icon: Building03Icon },
  { title: 'Tarifas', href: '/panel/tarifas', icon: Money03Icon },
  { title: 'Clientes', href: '/panel/clientes', icon: UserGroupIcon },
  { title: 'Caja', href: '/panel/caja', icon: Cashier02Icon },
  { title: 'Reportes', href: '/panel/reportes', icon: ChartLineData01Icon },
  { title: 'Configuración', href: '/panel/configuracion', icon: Settings02Icon },
  { title: 'Facturación', href: '/panel/suscripcion', icon: CreditCardIcon },
] satisfies DashboardNavigationItem[]

const adminNavigation = [
  { title: 'Resumen', href: '/admin', icon: DashboardSquare01Icon, exact: true },
  { title: 'Solicitudes', href: '/admin/solicitudes', icon: Task01Icon },
  { title: 'Locales', href: '/admin/locales', icon: Store01Icon },
  { title: 'Propietarios', href: '/admin/propietarios', icon: UserGroupIcon },
  { title: 'Suscripciones', href: '/admin/suscripciones', icon: CreditCardIcon },
  { title: 'Monitoreo', href: '/admin/monitoreo', icon: ChartLineData01Icon },
  { title: 'Configuración', href: '/admin/configuracion', icon: Settings02Icon },
] satisfies DashboardNavigationItem[]

export const dashboardNavigation = {
  owner: ownerNavigation,
  admin: adminNavigation,
} satisfies Record<DashboardRole, DashboardNavigationItem[]>

export function isNavigationItemActive(
  pathname: string,
  item: DashboardNavigationItem,
) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function getDashboardPageLabel(pathname: string, role: DashboardRole) {
  const item = dashboardNavigation[role].find((candidate) =>
    isNavigationItemActive(pathname, candidate),
  )

  if (item) return item.title
  if (pathname.endsWith('/perfil')) return 'Mi perfil'
  if (pathname.endsWith('/ayuda')) return 'Ayuda'
  if (pathname.endsWith('/suscripcion')) return 'Suscripción'
  if (pathname.endsWith('/estado-local')) return 'Estado del local'
  if (pathname.endsWith('/suspendido')) return 'Acceso suspendido'
  if (pathname.endsWith('/sin-local')) return 'Sin local'

  return 'Grassly'
}

export type DashboardBreadcrumb = {
  label: string
  href?: string
}

// Etiquetas por defecto para la miga de la ficha cuando la página todavía no
// registró el nombre real de la entidad (SetBreadcrumb).
const entityFallbackLabels: Record<string, string> = {
  locales: 'Ficha del local',
  propietarios: 'Ficha del propietario',
  solicitudes: 'Revisión de solicitud',
}

const subPageLabels: Record<string, string> = {
  configuracion: 'Configuración',
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Seguimiento jerárquico de la ruta actual: Resumen / Sección / Ficha / Subpágina.
// Cada miga intermedia es clickeable para volver a ese nivel; la última es la
// página actual. `entityLabel` es el nombre real que registra la ficha.
export function getDashboardBreadcrumbs(
  pathname: string,
  role: DashboardRole,
  entityLabel?: string | null,
): DashboardBreadcrumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const homeHref = role === 'admin' ? '/admin' : '/panel'

  if (segments.length <= 1) {
    return [{ label: 'Resumen' }]
  }

  const crumbs: DashboardBreadcrumb[] = [{ label: 'Resumen', href: homeHref }]

  const sectionSegment = segments[1]
  const sectionHref = `/${segments[0]}/${sectionSegment}`
  const sectionItem = dashboardNavigation[role].find((item) => item.href === sectionHref)

  if (!sectionItem) {
    // Páginas sueltas (perfil, ayuda, suscripción, suspendido, sin local…).
    crumbs.push({ label: getDashboardPageLabel(pathname, role) })
    return crumbs
  }

  crumbs.push({ label: sectionItem.title, href: sectionHref })

  for (let index = 2; index < segments.length; index += 1) {
    const segment = segments[index]
    const href = `/${segments.slice(0, index + 1).join('/')}`

    if (subPageLabels[segment]) {
      crumbs.push({ label: subPageLabels[segment], href })
    } else if (UUID_PATTERN.test(segment)) {
      crumbs.push({ label: entityLabel || entityFallbackLabels[sectionSegment] || 'Detalle', href })
    } else {
      crumbs.push({ label: segment, href })
    }
  }

  const last = crumbs[crumbs.length - 1]
  if (last) last.href = undefined

  return crumbs
}
