import { notFound } from 'next/navigation'
import { ModulePlaceholder } from '@/components/dashboard/module-placeholder'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireOperationalOwnerLocal, requireOwner } from '@/lib/auth/dal'

const modules = {
  agenda: ['Agenda', 'Organiza horarios, reservas y bloqueos de cada cancha.'],
  reservas: ['Reservas', 'Revisa solicitudes, pagos y reservas registradas por cualquier canal.'],
  canchas: ['Canchas', 'Configura espacios deportivos, tarifas y disponibilidad.'],
  clientes: ['Clientes', 'Consulta la información necesaria para atender a tus jugadores.'],
  reportes: ['Reportes', 'Convierte la actividad del local en información útil para decidir.'],
  configuracion: ['Configuración', 'Administra los datos y reglas operativas de tu negocio.'],
} as const

export default async function OwnerSectionPage({ params }: PageProps<'/panel/[section]'>) {
  const { section } = await params

  if (section === 'perfil') {
    const context = await requireOwner()
    return (
      <div className="mx-auto w-full max-w-3xl">
        <p className="eyebrow">Cuenta</p>
        <h1 className="mt-4 text-4xl font-black tracking-[-.04em]">Mi perfil</h1>
        <Card className="mt-8">
          <CardHeader><CardTitle>{context.profile.nombre_completo}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
            <div><p className="text-muted-foreground">Correo</p><p className="mt-1 font-semibold">{context.profile.email ?? 'No registrado'}</p></div>
            <div><p className="text-muted-foreground">Rol</p><p className="mt-1 font-semibold">Propietario</p></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (section === 'ayuda') {
    await requireOwner()
    return <ModulePlaceholder eyebrow="Soporte" title="¿Cómo podemos ayudarte?" description="Aquí encontrarás respuestas y canales de soporte para operar Grassly con tranquilidad." />
  }

  const moduleDefinition = modules[section as keyof typeof modules]
  if (!moduleDefinition) notFound()

  await requireOperationalOwnerLocal()
  return <ModulePlaceholder eyebrow="Panel del propietario" title={moduleDefinition[0]} description={moduleDefinition[1]} />
}
