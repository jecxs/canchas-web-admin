import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Calendar03Icon,
  Location01Icon,
  Store01Icon,
  StoreAdd01Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/states'
import { localStatePresentation } from '@/components/dashboard/status'
import { selectActiveLocalAction } from '@/lib/auth/actions'
import { getOwnerShellContext } from '@/lib/auth/dal'
import { getSedesSummary } from '@/features/sedes/queries'
import { cn } from '@/lib/utils'

const stateDotClass: Record<string, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  destructive: 'bg-destructive',
  neutral: 'bg-muted-foreground/40',
}

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
  const publishedCount = context.locals.filter((local) => local.publicado).length
  const usagePct = summary && summary.maxSedes > 0
    ? Math.min(100, Math.round((summary.sedesUsadas / summary.maxSedes) * 100))
    : 0
  const effectiveIncluded = summary
    ? Math.max(summary.maxSedes - summary.sedesExtraContratadas, 0)
    : 0
  const planHint = summary
    ? summary.maxSedes === 0
      ? 'Sin plan activo'
      : summary.sedesExtraContratadas > 0
        ? `${effectiveIncluded} incluida${effectiveIncluded === 1 ? '' : 's'} + ${summary.sedesExtraContratadas} extra${summary.sedesExtraContratadas === 1 ? '' : 's'}`
        : `${effectiveIncluded} sede${effectiveIncluded === 1 ? '' : 's'} incluida${effectiveIncluded === 1 ? '' : 's'}`
    : undefined
  const segmentCount = summary ? Math.min(Math.max(summary.maxSedes, 1), 12) : 0

  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-muted-foreground">
            <span className="h-3 w-0.5 rounded-full bg-plum" />
            Mi negocio
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-[-.04em]">Sedes</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cada sede conserva su propia agenda, canchas, tarifas y visibilidad. Cambia de sede sin perder la configuración de las demás.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-muted-foreground">
            <span>{context.locals.length} registrada{context.locals.length === 1 ? '' : 's'}</span>
            <span className="h-3 w-px bg-border" />
            <span>{publishedCount} publicada{publishedCount === 1 ? '' : 's'}</span>
            {activeLocal ? (
              <>
                <span className="h-3 w-px bg-border" />
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-plum" />
                  <span className="max-w-[14rem] truncate">{activeLocal.nombre}</span>
                </span>
              </>
            ) : null}
          </div>
        </div>

        {summary?.puedeCrearSede ? (
          <Button asChild className="shadow-sm">
            <Link href="/panel/sedes/nueva">
              <HugeiconsIcon icon={StoreAdd01Icon} strokeWidth={2} />
              Agregar sede
            </Link>
          </Button>
        ) : (
          <Link
            href="/panel/suscripcion"
            className="group/action inline-flex shrink-0 items-center gap-1.5 py-2 text-sm font-bold text-foreground transition-colors hover:text-plum"
          >
            Gestionar plan
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="size-4 transition-transform group-hover/action:translate-x-0.5"
            />
          </Link>
        )}
      </div>

      {creada === '1' ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-success" />
            <div className="min-w-0">
              <p className="text-sm font-extrabold">Sede creada</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                Ya puedes completar su descripción, horarios, canchas y medios de pago. La sede permanece oculta del catálogo hasta que la publiques.
              </p>
            </div>
          </div>
          <Link
            href="/panel/configuracion"
            className="group/action inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-foreground transition-colors hover:text-plum"
          >
            Completar configuración
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="size-4 transition-transform group-hover/action:translate-x-0.5"
            />
          </Link>
        </div>
      ) : null}

      {summary ? (
        <section className="mt-6 rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 max-w-xl">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-muted-foreground">
                <span className="h-3 w-0.5 rounded-full bg-plum" />
                Cupo de sedes
              </div>
              <p className="mt-3 text-2xl font-black tracking-[-.03em] sm:text-[1.75rem]">
                {summary.maxSedes > 0
                  ? `${summary.sedesUsadas} de ${summary.maxSedes} sedes en uso`
                  : 'Sin plan de sedes activo'}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {summary.maxSedes === 0
                  ? 'Tu cuenta todavía no tiene un plan de sedes habilitado.'
                  : summary.asientosDisponibles > 0
                    ? `Tienes ${summary.asientosDisponibles} ${summary.asientosDisponibles === 1 ? 'asiento disponible' : 'asientos disponibles'} para abrir otra sede.`
                    : 'Puedes ampliar tu cupo desde Facturación cuando necesites otra sede.'}
              </p>
              <div className="mt-4 flex gap-1" aria-hidden>
                {Array.from({ length: segmentCount }).map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      'h-1.5 flex-1 rounded-full',
                      summary.maxSedes > 0 && index < summary.sedesUsadas ? 'bg-primary' : 'bg-muted',
                    )}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-muted-foreground">
                <span>{usagePct}% del cupo</span>
                <span>{summary.asientosDisponibles} disponible{summary.asientosDisponibles === 1 ? '' : 's'}</span>
              </div>
            </div>

            <dl className="grid w-full gap-4 border-t border-border/70 pt-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border/70 sm:pt-0 xl:w-auto xl:min-w-[24rem] xl:border-t-0 xl:border-l xl:border-border/70 xl:pl-6">
              <div className="sm:px-4 sm:first:pl-0">
                <dt className="text-[10px] font-black uppercase tracking-[.12em] text-muted-foreground">Plan</dt>
                <dd className="mt-1 text-lg font-black tracking-tight">
                  {summary.maxSedes > 0 ? `${summary.maxSedes} sedes` : '—'}
                </dd>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{planHint}</p>
              </div>
              <div className="sm:px-4">
                <dt className="text-[10px] font-black uppercase tracking-[.12em] text-muted-foreground">En uso</dt>
                <dd className="mt-1 text-lg font-black tracking-tight">
                  {summary.sedesUsadas}
                  {summary.maxSedes > 0 ? <span className="text-sm font-semibold text-muted-foreground"> de {summary.maxSedes}</span> : null}
                </dd>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">sedes registradas</p>
              </div>
              <div className="sm:px-4 sm:last:pr-0">
                <dt className="text-[10px] font-black uppercase tracking-[.12em] text-muted-foreground">Disponibles</dt>
                <dd className={cn('mt-1 text-lg font-black tracking-tight', summary.asientosDisponibles > 0 && 'text-plum')}>
                  {summary.maxSedes > 0 ? summary.asientosDisponibles : '—'}
                </dd>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                  {summary.asientosDisponibles > 0 ? 'para abrir otra sede' : 'sin cupo libre'}
                </p>
              </div>
            </dl>
          </div>

          {!summary.puedeCrearSede ? (
            <div className="mt-5 flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6">
                <span className="font-extrabold">
                  {needsSubscription ? 'Plan no habilitado.' : 'Sin cupo disponible.'}
                </span>{' '}
                <span className="text-muted-foreground">
                  {needsSubscription
                    ? 'Activa o regulariza tu suscripción para poder crear otra sede.'
                    : 'Programa una sede extra desde Facturación. El cupo se habilita cuando se apruebe el cobro.'}
                </span>
              </p>
              <Link
                href="/panel/suscripcion"
                className="group/action inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-foreground transition-colors hover:text-plum"
              >
                Ir a Facturación
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="size-4 transition-transform group-hover/action:translate-x-0.5"
                />
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-muted-foreground">Tus sedes</p>
            <h2 className="mt-1 text-xl font-black tracking-tight">Operación por sede</h2>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            {context.locals.length} registrada{context.locals.length === 1 ? '' : 's'} · {publishedCount} publicada{publishedCount === 1 ? '' : 's'}
          </p>
        </div>

        {context.locals.length === 0 ? (
          <EmptyState
            title="No encontramos sedes asociadas"
            description="Tu cuenta figura como propietaria, pero todavía no tiene una sede vinculada."
            className="mt-4"
          />
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {context.locals.map((local, index) => {
              const state = localStatePresentation[local.estado]
              const isActive = activeLocal?.id === local.id
              const action = selectActiveLocalAction.bind(null, local.id)

              return (
                <article
                  key={local.id}
                  className={cn(
                    'group relative min-w-0 rounded-2xl border bg-card p-5 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-foreground/15 hover:shadow-md',
                    isActive ? 'border-plum/35' : 'border-border/70',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'grid size-10 shrink-0 place-items-center rounded-xl',
                        isActive ? 'bg-foreground text-background' : 'bg-muted text-foreground/60',
                      )}
                    >
                      <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="line-clamp-2 min-w-0 break-words text-[17px] font-black leading-6 tracking-tight">
                          {local.nombre}
                        </h3>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-plum/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-[.1em] text-plum">
                            <span className="size-1 rounded-full bg-plum" />
                            Activa
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 flex items-start gap-1.5 text-sm leading-5 text-muted-foreground">
                        <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" />
                        <span className="line-clamp-2 break-words">{local.direccion}</span>
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn('size-1.5 rounded-full', stateDotClass[state.tone] ?? stateDotClass.neutral)} />
                          {state.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn('size-1.5 rounded-full', local.publicado ? 'bg-success' : 'bg-muted-foreground/40')} />
                          {local.publicado ? 'Publicada' : 'No publicada'}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 pt-0.5 text-[10px] font-black tracking-[.14em] text-muted-foreground/40">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {local.estado === 'rechazado' && local.motivo_rechazo ? (
                    <p className="mt-4 line-clamp-3 border-l-2 border-destructive/40 pl-3 text-xs leading-5 text-destructive">
                      {local.motivo_rechazo}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5 text-muted-foreground/60" />
                      Alta {new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(local.created_at))}
                    </span>
                    {isActive ? (
                      <Link
                        href="/panel"
                        className="group/action inline-flex items-center gap-1.5 py-1 text-sm font-bold text-foreground transition-colors hover:text-plum"
                      >
                        Ir al panel
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          strokeWidth={2}
                          className="size-4 transition-transform group-hover/action:translate-x-0.5"
                        />
                      </Link>
                    ) : (
                      <form action={action}>
                        <button
                          type="submit"
                          className="group/action inline-flex items-center gap-1.5 py-1 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Usar esta sede
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            strokeWidth={2}
                            className="size-4 transition-transform group-hover/action:translate-x-0.5"
                          />
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
