'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowRight01Icon,
  EyeIcon,
  EyeOffIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { AutoMarquee } from '@/components/dashboard/auto-marquee'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { notify } from '@/lib/notifications/notify'
import { changePublicationAction } from './actions'
import {
  initialPublicationActionState,
  type PublicationChecklist,
} from './types'

const checklistItems = [
  ['generalData', 'Datos generales y contacto', '/panel/configuracion'],
  ['location', 'Coordenadas del local', '/panel/configuracion'],
  ['logo', 'Logo del negocio', '/panel/configuracion'],
  ['gallery', 'Galería del local', '/panel/configuracion'],
  ['schedules', 'Horarios de atención', '/panel/configuracion'],
  ['courtsAndRates', 'Canchas y tarifas', '/panel/canchas'],
  ['advance', 'Porcentaje de adelanto', '/panel/configuracion'],
  ['paymentMethods', 'Medios de pago', '/panel/configuracion'],
  ['refundPolicy', 'Política de reembolso', '/panel/configuracion'],
] as const

export function PublicationChecklistCard({
  localId,
  localName,
  published,
  checklist,
}: {
  localId: string
  localName: string
  published: boolean
  checklist: PublicationChecklist
}) {
  const [state, action, pending] = useActionState(
    changePublicationAction,
    initialPublicationActionState,
  )
  const [open, setOpen] = useState(false)
  const completed = checklistItems.filter(([key]) => checklist[key]).length
  const total = checklistItems.length
  const progress = Math.round((completed / total) * 100)
  const statusLabel = published
    ? 'Publicado en la app'
    : checklist.ready
      ? 'Listo para publicar'
      : 'Faltan requisitos'

  useEffect(() => {
    if (!state.message) return
    if (state.success) notify.success()
    else if (state.message === 'Revisa los campos indicados') notify.warning()
    else notify.error()
  }, [state])

  return (
    <>
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[.06] text-center sm:flex-row sm:text-left">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 p-2.5 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-white/70">
            Requisitos
          </p>
          <div className="relative size-14 shrink-0 transition-[transform,filter] duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_var(--plum)]">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from -90deg, var(--primary) 0deg ${progress * 3.6}deg, rgba(255,255,255,.14) ${progress * 3.6}deg 360deg)`,
              }}
            />
            <div className="absolute inset-[15%] grid place-items-center rounded-full bg-secondary">
              <span className="font-display text-sm font-black leading-none text-white tabular-nums">
                {completed}/{total}
              </span>
            </div>
          </div>
        </button>

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 p-2.5">
          <p className="text-xs mb-2 font-bold text-white">{statusLabel}</p>
          <form action={action} className="w-full">
            <input type="hidden" name="localId" value={localId} />
            <input type="hidden" name="published" value={published ? 'false' : 'true'} />
            <Button
              type="submit"
              size="sm"
              variant={published ? 'outline' : 'default'}
              disabled={pending || (!published && !checklist.ready)}
              className={cn(
                'w-full overflow-hidden whitespace-nowrap text-[11px] leading-4',
                published && 'border-white/20 bg-plum/25 text-white hover:bg-plum/35 hover:text-white',
              )}
            >
              {pending ? (
                <Spinner />
              ) : (
                <HugeiconsIcon icon={published ? EyeOffIcon : EyeIcon} strokeWidth={2} />
              )}
              <AutoMarquee
                className="min-w-0 flex-1"
                gapClassName="pr-6"
                gapPx={24}
                centerWhenFits
              >
                {published ? 'Retirar del catálogo' : 'Publicar en la app'}
              </AutoMarquee>
            </Button>
            {!published && !checklist.ready ? (
              <p className="mt-1 text-[9px] text-white/40">Completa los requisitos para publicar</p>
            ) : null}
          </form>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Preparación para publicar</DialogTitle>
            <DialogDescription>
              {completed} de {total} requisitos completados para {localName}. Haz clic en uno para
              configurarlo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5 sm:grid-cols-2">
            {checklistItems.map(([key, label, href]) => {
              const complete = checklist[key]
              return (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-2.5 rounded-xl border border-border/60 px-2.5 py-2 transition-colors hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full',
                      complete
                        ? 'bg-success/18 text-success-foreground'
                        : 'bg-warning/20 text-warning-foreground',
                    )}
                  >
                    <HugeiconsIcon
                      icon={complete ? Tick02Icon : Alert02Icon}
                      strokeWidth={2}
                      className="size-3.5"
                    />
                  </span>
                  <span className="min-w-0 flex-1 text-xs font-semibold leading-4">{label}</span>
                  <span
                    className={cn(
                      'text-[9px] font-extrabold uppercase tracking-[.08em]',
                      complete ? 'text-success-foreground' : 'text-warning-foreground',
                    )}
                  >
                    {complete ? 'Listo' : 'Falta'}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </Link>
              )
            })}
          </div>

          <DialogFooter>
            <Button asChild size="sm" variant="ghost">
              <Link href="/panel/configuracion" onClick={() => setOpen(false)}>
                Ir a configuración
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
