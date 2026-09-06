import { notFound } from 'next/navigation'
import { ModulePlaceholder } from '@/components/dashboard/module-placeholder'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdmin } from '@/lib/auth/dal'

const modules = {
  solicitudes: ['Solicitudes', 'Valida propietarios y locales pendientes de incorporación.'],
  locales: ['Locales', 'Supervisa el estado y la información de los locales de la plataforma.'],
  propietarios: ['Propietarios', 'Consulta y administra las cuentas responsables de cada negocio.'],
  suscripciones: ['Suscripciones', 'Controla planes, pagos y periodos de prueba de los propietarios.'],
  monitoreo: ['Monitoreo', 'Observa la actividad y salud operativa general de Grassly.'],
  configuracion: ['Configuración', 'Administra parámetros y reglas globales de la plataforma.'],
} as const

export default async function AdminSectionPage({ params }: PageProps<'/admin/[section]'>) {
  const context = await requireAdmin()
  const { section } = await params

  if (section === 'perfil') {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <p className="eyebrow">Cuenta administrativa</p>
        <h1 className="mt-4 text-4xl font-black tracking-[-.04em]">Mi perfil</h1>
        <Card className="mt-8">
          <CardHeader><CardTitle>{context.profile.nombre_completo}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
            <div><p className="text-muted-foreground">Correo</p><p className="mt-1 font-semibold">{context.profile.email ?? 'No registrado'}</p></div>
            <div><p className="text-muted-foreground">Rol</p><p className="mt-1 font-semibold">Superadministrador</p></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (section === 'ayuda') {
    return <ModulePlaceholder eyebrow="Soporte interno" title="Centro de ayuda" description="Accede a documentación y soporte para la operación administrativa de Grassly." />
  }

  const moduleDefinition = modules[section as keyof typeof modules]
  if (!moduleDefinition) notFound()

  return <ModulePlaceholder eyebrow="Superadministración" title={moduleDefinition[0]} description={moduleDefinition[1]} />
}
