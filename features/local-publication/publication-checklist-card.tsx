'use client'

import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Clock01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
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
  const completed = checklistItems.filter(([key]) => checklist[key]).length

  useEffect(() => {
    if (!state.message) return
    if (state.success) notify.success()
    else if (state.message === 'Revisa los campos indicados') notify.warning()
    else notify.error()
  }, [state])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/25">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Preparación para publicar</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {completed} de {checklistItems.length} requisitos completados para {localName}.
            </p>
          </div>
          <Badge variant={published ? 'success' : checklist.ready ? 'info' : 'neutral'}>
            {published ? 'Publicado' : checklist.ready ? 'Listo para publicar' : 'No publicado'}
          </Badge>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/70" aria-hidden="true">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${Math.round((completed / checklistItems.length) * 100)}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ul className="grid gap-2 sm:grid-cols-2">
          {checklistItems.map(([key, label, href]) => {
            const complete = checklist[key]
            return (
              <li key={key}>
                <Link
                  href={href}
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm hover:border-border hover:bg-muted/45"
                >
                  <span className={complete
                    ? 'grid size-7 place-items-center rounded-full bg-success/18 text-success-foreground'
                    : 'grid size-7 place-items-center rounded-full bg-muted text-muted-foreground'}>
                    <HugeiconsIcon icon={complete ? Tick02Icon : Clock01Icon} strokeWidth={2} className="size-4" />
                  </span>
                  <span className="flex-1 font-semibold">{label}</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            )
          })}
        </ul>

        <form action={action} className="mt-6 border-t pt-5">
          <input type="hidden" name="localId" value={localId} />
          <input type="hidden" name="published" value={published ? 'false' : 'true'} />
          <Button
            type="submit"
            variant={published ? 'outline' : 'default'}
            disabled={pending || (!published && !checklist.ready)}
            className="w-full sm:w-auto"
          >
            {pending && <Spinner />}
            {published ? 'Retirar del catálogo' : 'Publicar en la app'}
          </Button>
          {!published && !checklist.ready && (
            <p className="mt-2 text-xs text-muted-foreground">
              El botón se habilitará cuando todos los requisitos estén completos.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
