'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatAdvancePercentage } from './advance-policy'
import { AdvanceAlertBanner } from './advance-alert-banner'
import type { AdvanceAlert } from './advance-alert'

// La sección donde vive el campo que resuelve el bloqueo. Es la única salida del
// muro y por eso no se le puede dar cierre.
const FIX_HREF = '/panel/configuracion#pagos-politicas'
const FIX_PATH = '/panel/configuracion'

/**
 * Bloqueo de pantalla completa para locales cuyo adelanto quedó por debajo del
 * mínimo global. Es puramente de interfaz: no altera permisos ni la base.
 *
 * Se muestra en todo el panel salvo en la configuración, que es donde el dueño
 * puede corregir el porcentaje. Sin ese escape el dueño no tendría forma de
 * resolverlo.
 */
export function AdvanceAlertGate({ alert }: { alert: AdvanceAlert }) {
  const pathname = usePathname()

  if (pathname === FIX_PATH) {
    return <AdvanceAlertBanner alert={alert} />
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="top-0 left-0 h-svh w-screen max-w-none translate-x-0 translate-y-0 place-items-center rounded-none border-0 p-0 sm:max-w-none"
      >
        <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-destructive/15 text-destructive">
            <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-8" />
          </span>

          <DialogTitle className="mt-6 max-w-2xl text-3xl font-black tracking-[-.04em]">
            Actualiza el adelanto de tu local
          </DialogTitle>

          <DialogDescription className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Grassly subió el adelanto mínimo exigido a todos los locales a{' '}
            <span className="font-bold text-foreground">{formatAdvancePercentage(alert.minimum)}%</span> y el
            tuyo está en{' '}
            <span className="font-bold text-foreground">{formatAdvancePercentage(alert.current)}%</span>.
          </DialogDescription>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Mientras siga por debajo del mínimo, la base rechaza <span className="font-semibold text-foreground">cualquier</span>{' '}
            cambio en la información de tu local, así que el panel queda bloqueado hasta que lo actualices.
          </p>

          <Button asChild size="lg" variant="destructive" className="mt-8">
            <Link href={FIX_HREF}>Actualizar mi porcentaje</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}