import type { IconSvgElement } from '@hugeicons/react'
import {
  Building03Icon,
  Calendar03Icon,
  ChartLineData01Icon,
  CreditCardIcon,
  DashboardSquare01Icon,
  Invoice03Icon,
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
  { title: 'Clientes', href: '/panel/clientes', icon: UserGroupIcon },
  { title: 'Reportes', href: '/panel/reportes', icon: ChartLineData01Icon },
  { title: 'Configuración', href: '/panel/configuracion', icon: Settings02Icon },
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
  if (pathname.endsWith('/suspendido')) return 'Acceso suspendido'
  if (pathname.endsWith('/sin-local')) return 'Sin local'

  return 'Grassly'
}
