import { redirect } from 'next/navigation'
import { OwnerApplicationForm } from '@/features/owner-onboarding/owner-application-form'
import { resolvePostLoginDestination } from '@/lib/auth/access'
import { getAccessContext } from '@/lib/auth/dal'

export default async function CompletarRegistroPage() {
  const context = await getAccessContext()
  if (!context) redirect('/registro')

  const hasCurrentApplication = context.locals.some((local) => local.estado !== 'rechazado')
  if (context.profile.rol !== 'cliente' || hasCurrentApplication) {
    redirect(resolvePostLoginDestination(context))
  }

  const rejectedApplication = context.locals.find(
    (local) => local.estado === 'rechazado',
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <OwnerApplicationForm
        defaultValues={{
          nombreLocal: rejectedApplication?.nombre,
          direccion: rejectedApplication?.direccion,
          ruc: rejectedApplication?.ruc ?? '',
          telefono: (context.profile.telefono ?? '').replace(/^\+51/, ''),
          dni: context.profile.dni ?? '',
        }}
      />
    </main>
  )
}
