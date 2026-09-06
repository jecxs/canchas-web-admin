const AUTHENTICATED_ROUTE_PREFIXES = [
  '/admin',
  '/panel',
  '/completar-registro',
  '/estado-solicitud',
] as const

export function isAuthenticatedRoute(pathname: string) {
  return AUTHENTICATED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

