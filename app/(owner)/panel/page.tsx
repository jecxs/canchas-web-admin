import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicationChecklistCard } from '@/features/local-publication/publication-checklist-card'
import { getPublicationChecklist } from '@/features/local-publication/queries'
import { requireOperationalOwnerLocal } from '@/lib/auth/dal'

export default async function OwnerDashboardPage() {
  const { context, local } = await requireOperationalOwnerLocal()
  const checklist = await getPublicationChecklist(local.id)

  return (
    <div className="mx-auto w-full max-w-7xl">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-success-foreground">Operación de hoy</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Hola, {context.profile.nombre_completo}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Administra la agenda, reservas y operación de {local.nombre} desde un solo lugar.
      </p>
      <Card className="mt-8 max-w-xl shadow-sm">
        <CardHeader>
          <CardDescription>Local activo</CardDescription>
          <CardTitle className="text-2xl">{local.nombre}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{local.direccion}</p>
          <Badge className="mt-4">{local.estado}</Badge>
        </CardContent>
      </Card>
      <section className="mt-6 max-w-4xl">
        <PublicationChecklistCard
          localId={local.id}
          localName={local.nombre}
          published={local.publicado}
          checklist={checklist}
        />
      </section>
    </div>
  )
}
