import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { formatAdvancePercentage } from './advance-policy'
import type { AdvanceAlert } from './advance-alert'

export function AdvanceAlertBanner({ alert }: { alert: AdvanceAlert }) {
  return (
    <div className="mx-auto mb-6 w-full max-w-6xl rounded-2xl border border-destructive/30 bg-destructive/8 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-destructive">
            Actualiza el adelanto de tu local
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Grassly subió el adelanto mínimo exigido a{' '}
            <span className="font-bold text-foreground">{formatAdvancePercentage(alert.minimum)}%</span> y tu
            local está en{' '}
            <span className="font-bold text-foreground">{formatAdvancePercentage(alert.current)}%</span>.
            Mientras tu porcentaje siga por debajo del mínimo, la base rechaza <span className="font-semibold text-foreground">cualquier</span>{' '}
            cambio en la información del local, no solo el del porcentaje.
          </p>
          <Button asChild size="sm" variant="destructive" className="mt-3">
            <Link href="/panel/configuracion#pagos-politicas">Actualizar porcentaje</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}