import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Clock01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PublicationChecklist } from '@/features/local-publication/types'

const items = [
  ['generalData', 'Datos generales y contacto', '#datos-generales'],
  ['location', 'Coordenadas del local', '#datos-generales'],
  ['logo', 'Logo del negocio', '#identidad-visual'],
  ['gallery', 'Galería del local', '#identidad-visual'],
  ['schedules', 'Horarios de atención', '#horarios'],
  ['courtsAndRates', 'Canchas y tarifas', '#canchas'],
  ['advance', 'Porcentaje de adelanto', '#pagos-politicas'],
  ['paymentMethods', 'Medios de pago', '#pagos-politicas'],
  ['refundPolicy', 'Política de reembolso', '#pagos-politicas'],
] as const

export function AdminLocalChecklist({
  localId,
  checklist,
}: {
  localId: string
  checklist: PublicationChecklist
}) {
  const completed = items.filter(([key]) => checklist[key]).length
  const base = `/admin/locales/${localId}/configuracion`

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/25">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Configuración del local</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {completed} de {items.length} secciones completas. Entra a cada una para revisarla o editarla.
            </p>
          </div>
          <Badge variant={checklist.ready ? 'success' : 'neutral'}>
            {checklist.ready ? 'Listo para publicar' : 'En preparación'}
          </Badge>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/70" aria-hidden="true">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${Math.round((completed / items.length) * 100)}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map(([key, label, hash]) => {
            const complete = checklist[key]
            return (
              <li key={key}>
                <Link
                  href={`${base}${hash}`}
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm transition-colors hover:border-border hover:bg-muted/45"
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
      </CardContent>
    </Card>
  )
}
