import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { CreateSedeForm } from '@/features/sedes/create-sede-form'
import { getSedeCreationDefaults, getSedesSummary } from '@/features/sedes/queries'
import { cn } from '@/lib/utils'

export default async function NewSedePage() {
  const [summary, defaults] = await Promise.all([
    getSedesSummary(),
    getSedeCreationDefaults(),
  ])
  const needsSubscription = summary
    ? summary.maxSedes === 0 || (summary.asientosDisponibles > 0 && !summary.puedeCrearSede)
    : false

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href="/panel/sedes"
        className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
        Volver a Sedes
      </Link>

      <div className="mt-6">
        <p className="eyebrow">Nueva sede</p>
        <h1 className="mt-4 text-4xl font-black tracking-[-.04em]">Agregar sede</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Crea otra ubicación para tu negocio. Tendrá su propia operación y podrás publicarla cuando esté lista.
        </p>
      </div>

      <div className="mt-8">
        {summary?.puedeCrearSede ? (
          <CreateSedeForm defaults={defaults} />
        ) : (
          <Alert>
            <AlertTitle>
              {needsSubscription ? 'Tu plan aún no está habilitado' : 'No tienes sedes disponibles'}
            </AlertTitle>
            <AlertDescription>
              {needsSubscription
                ? 'Activa o regulariza tu suscripción para poder crear otra sede.'
                : 'Programa una sede extra desde Facturación. El cupo se habilita cuando se apruebe el cobro correspondiente.'}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/panel/suscripcion" className={buttonVariants({ size: 'sm' })}>
                  Ir a Facturación
                </Link>
                <Link href="/panel/sedes" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                  Volver a Sedes
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
