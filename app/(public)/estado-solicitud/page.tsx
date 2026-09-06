import Link from 'next/link'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { PendingApprovalState, RejectedApplicationState } from '@/components/states'
import { OwnerApplicationFeedback } from '@/features/owner-onboarding/owner-application-feedback'
import { requireApplicationContext } from '@/lib/auth/dal'
import { cn } from '@/lib/utils'

export default async function EstadoSolicitudPage({
  searchParams,
}: PageProps<'/estado-solicitud'>) {
  const { context, local } = await requireApplicationContext()
  const { enviada } = await searchParams
  const rejected = local.estado === 'rechazado'

  const content = (
    <>
      <dl className="w-full space-y-3 rounded-xl border bg-surface p-5 text-left text-sm">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Local</dt>
          <dd className="mt-1 font-semibold">{local.nombre}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dirección</dt>
          <dd className="mt-1">{local.direccion}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Solicitante</dt>
          <dd className="mt-1">{context.profile.nombre_completo}</dd>
        </div>
      </dl>
      {local.motivo_rechazo ? (
        <Alert variant="destructive" className="w-full text-left">
          <AlertTitle>Observación</AlertTitle>
          <AlertDescription>{local.motivo_rechazo}</AlertDescription>
        </Alert>
      ) : null}
      {rejected ? (
        <Link href="/completar-registro" className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
          Enviar una nueva solicitud
        </Link>
      ) : null}
      <SignOutButton className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')} />
    </>
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <OwnerApplicationFeedback submitted={enviada === '1'} />
      {rejected ? (
        <RejectedApplicationState className="w-full max-w-2xl">{content}</RejectedApplicationState>
      ) : (
        <PendingApprovalState className="w-full max-w-2xl">{content}</PendingApprovalState>
      )}
    </main>
  )
}
