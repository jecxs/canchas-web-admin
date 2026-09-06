import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdmin } from '@/lib/auth/dal'

export default async function AdminDashboardPage() {
  const context = await requireAdmin()

  return (
    <div className="mx-auto w-full max-w-7xl">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-success-foreground">Acceso administrativo verificado</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Panel general de Grassly</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Hola, {context.profile.nombre_completo}. Supervisa las solicitudes, locales y suscripciones de la plataforma desde este espacio.
      </p>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Rol</CardDescription>
            <CardTitle>Superadministrador</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Locales propios</CardDescription>
            <CardTitle>No requeridos</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Seguridad</CardDescription>
            <CardTitle className="text-success-foreground">DAL + RLS</CardTitle>
          </CardHeader>
        </Card>
      </section>
    </div>
  )
}
