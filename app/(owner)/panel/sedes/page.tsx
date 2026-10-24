import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowRight01Icon, Store01Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/states'
import { localStatePresentation } from '@/components/dashboard/status'
import { selectActiveLocalAction } from '@/lib/auth/actions'
import { getOwnerShellContext } from '@/lib/auth/dal'
import { getSedesSummary } from '@/features/sedes/queries'
import { cn } from '@/lib/utils'

export default async function SedesPage({
  searchParams,
}: {
  searchParams: Promise<{ creada?: string }>
}) {
  const { context, activeLocal } = await getOwnerShellContext()
  const summary = await getSedesSummary()
  const { creada } = await searchParams
  const needsSubscription = summary
    ? summary.maxSedes === 0 || (summary.asientosDisponibles > 0 && !summary.puedeCrearSede)
    : false

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Mi negocio</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-.04em]">Sedes</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Cada sede conserva su propia agenda, canchas, tarifas y visibilidad. Cambia de sede sin perder la configuración de las demás.
          </p>
        </div>
        {summary?.puedeCrearSede ? (
          <Button asChild>
            <Link href="/panel/sedes/nueva">
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Agregar sede
            </Link>
          </Button>
        ) : null}
      </div>

      {creada === '1' ? (
        <Alert className="mt-6">
          <AlertTitle>Sede creada</AlertTitle>
          <AlertDescription>
            Ya puedes{' '}
            <Link href="/panel/configuracion" className="font-semibold text-primary underline">
              completar su configuración
            </Link>
            : descripción, horarios, canchas y medios de pago. La sede permanece oculta del catálogo hasta que la publiques.
          </AlertDescription>
        </Alert>
      ) : null}

      {summary ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Cupo de sedes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="mt-1 font-bold">
                  {summary.maxSedes === 0
                    ? 'Sin plan activo'
                    : (
                      <>
                        {summary.sedesIncluidas} incluida{summary.sedesIncluidas === 1 ? '' : 's'}
                        {summary.sedesExtraContratadas > 0
                          ? ` + ${summary.sedesExtraContratadas} extra${summary.sedesExtraContratadas === 1 ? '' : 's'}`
                          : ''}
                      </>
                    )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sedes en uso</dt>
                <dd className="mt-1 font-bold">
                  {summary.maxSedes > 0
                    ? `${summary.sedesUsadas} de ${summary.maxSedes}`
                    : `${summary.sedesUsadas} · sin plan activo`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Asientos disponibles</dt>
                <dd className="mt-1 font-bold">
                  {summary.maxSedes > 0 ? summary.asientosDisponibles : '—'}
                </dd>
              </div>
            </dl>

            {!summary.puedeCrearSede ? (
              <Alert>
                <AlertTitle>
                  {needsSubscription ? 'Tu plan aún no está habilitado' : 'No tienes sedes disponibles'}
                </AlertTitle>
                <AlertDescription>
                  {needsSubscription
                    ? 'Activa o regulariza tu suscripción para poder crear otra sede.'
                    : 'Programa una sede extra desde Facturación. El cupo se habilita cuando se apruebe el cobro correspondiente.'}
                  {' '}
                  <Link href="/panel/suscripcion" className="font-semibold text-primary underline">
                    Ir a Facturación
                  </Link>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <section className="mt-8">
        {context.locals.length === 0 ? (
          <EmptyState
            title="No encontramos sedes asociadas"
            description="Tu cuenta figura como propietaria, pero todavía no tiene una sede vinculada."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {context.locals.map((local) => {
              const state = localStatePresentation[local.estado]
              const isActive = activeLocal?.id === local.id
              const action = selectActiveLocalAction.bind(null, local.id)

              return (
                <Card key={local.id} className={cn('transition-colors', isActive && 'border-primary/50')}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15">
                          <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <CardTitle className="truncate">{local.nombre}</CardTitle>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{local.direccion}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Badge variant={state.tone}>{state.label}</Badge>
                        <Badge variant={local.publicado ? 'success' : 'neutral'}>
                          {local.publicado ? 'Publicada' : 'No publicada'}
                        </Badge>
                        {isActive ? <Badge variant="default">Sede activa</Badge> : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {local.estado === 'rechazado' && local.motivo_rechazo ? (
                      <p className="mb-4 rounded-xl bg-destructive/8 px-3 py-2 text-xs text-destructive">
                        {local.motivo_rechazo}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                      <p className="text-xs text-muted-foreground">
                        Alta: {new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(local.created_at))}
                      </p>
                      {isActive ? (
                        <Link href="/panel" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
                          Ir al panel
                          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
                        </Link>
                      ) : (
                        <form action={action}>
                          <Button type="submit" size="sm" variant="outline">
                            Usar esta sede
                          </Button>
                        </form>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
