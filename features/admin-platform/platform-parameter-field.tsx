'use client'

import { useActionState, useState } from 'react'
import { Alert02Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EditGuard, GuardActions, useEditGuard } from '@/components/dashboard/edit-guard'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { updatePlatformParameterAction } from './actions'
import { formatPlatformValue, initialPlatformParameterState } from './types'
import type { PlatformParameterDefinition, PlatformParameterRow } from './types'

export function PlatformParameterField({
  definition,
  row,
  advancePercentages,
}: {
  definition: PlatformParameterDefinition
  row: PlatformParameterRow
  advancePercentages: number[]
}) {
  return (
    <EditGuard title={definition.title}>
      <PlatformParameterCard definition={definition} row={row} advancePercentages={advancePercentages} />
    </EditGuard>
  )
}

function PlatformParameterCard({
  definition,
  row,
  advancePercentages,
}: {
  definition: PlatformParameterDefinition
  row: PlatformParameterRow
  advancePercentages: number[]
}) {
  const guard = useEditGuard()
  const [state, action, pending] = useActionState(updatePlatformParameterAction, initialPlatformParameterState)

  const numeric = typeof row.value === 'number' ? row.value : null
  const words = Array.isArray(row.value) ? row.value : null
  const isWords = definition.input === 'words'

  const [draft, setDraft] = useState(numeric !== null ? String(numeric) : '')

  // Impacto calculado en el propio cliente: el panel conoce los porcentajes ya
  // configurados, así que la advertencia aparece mientras se escribe y el
  // guardado no necesita rebotar en el servidor para descubrir el problema.
  // Solo aplica cuando el valor cambió respecto al ya guardado.
  const affected = (() => {
    if (definition.key !== 'porcentaje_adelanto_minimo') return 0
    if (draft.trim() === '') return 0
    const draftNumber = Number(draft)
    if (!Number.isFinite(draftNumber) || draftNumber === numeric) return 0
    return advancePercentages.filter((value) => value < draftNumber).length
  })()

  const locked = !guard?.editing

  return (
    <Card
      className={cn(
        'shadow-none transition-colors',
        locked ? 'cursor-not-allowed border-border/60 bg-muted/20' : 'border-primary/30',
      )}
    >
      <CardContent className="p-0">
        <form action={action} className="px-4 py-3.5">
          <input type="hidden" name="clave" value={definition.key} />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="min-w-0 flex-1 basis-56">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-extrabold">{definition.title}</p>
                <Badge variant={row.value === null ? 'warning' : 'success'} className="font-normal">
                  {formatPlatformValue(row.value, definition.unit)}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{definition.description}</p>
            </div>

            {!isWords ? (
              <div className="relative w-28 shrink-0">
                <Input
                  name="valor"
                  type="number"
                  inputMode="decimal"
                  min={definition.min}
                  max={definition.max}
                  step={definition.step}
                  required
                  defaultValue={numeric ?? ''}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="—"
                  aria-label={`Valor de ${definition.title}`}
                  aria-invalid={affected > 0}
                  className={cn('h-9', definition.unit === 'S/' ? 'pl-8' : 'pr-10')}
                />
                {definition.unit ? (
                  <span
                    className={cn(
                      'pointer-events-none absolute inset-y-0 grid place-items-center text-xs text-muted-foreground',
                      definition.unit === 'S/' ? 'left-2.5' : 'right-2.5',
                    )}
                  >
                    {definition.unit}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="flex shrink-0 items-center gap-2">
              <GuardActions pending={pending} state={state} submitLabel="Guardar" />
            </div>
          </div>

          {isWords ? (
            <Textarea
              name="valor"
              rows={3}
              defaultValue={words?.join('\n') ?? ''}
              placeholder="Una por línea o separadas por coma"
              aria-label="Palabras prohibidas"
              className="mt-3 text-xs"
            />
          ) : null}

          {affected > 0 && guard?.editing ? (
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/8 p-3">
              <p className="flex items-start gap-2 text-xs font-bold text-destructive">
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0" />
                {affected} {affected === 1 ? 'local quedaría' : 'locales quedarían'} con un adelanto inválido.
              </p>
              <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <input
                  type="checkbox"
                  name="force"
                  value="1"
                  required
                  data-label="Confirmación de impacto"
                  className="mt-0.5 size-3.5 shrink-0 accent-destructive"
                />
                <span>
                  Entiendo que esos locales no podrán guardar ningún cambio hasta corregir su porcentaje de
                  adelanto.
                </span>
              </label>
            </div>
          ) : null}

          {definition.impact ? (
            <details className="mt-2.5">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-bold text-warning-foreground [&::-webkit-details-marker]:hidden">
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3.5" />
                Consideraciones
              </summary>
              <p className="mt-1.5 rounded-lg border border-warning/25 bg-warning/8 px-2.5 py-2 text-xs leading-relaxed text-muted-foreground">
                {definition.impact}
              </p>
            </details>
          ) : null}

          {state.message ? (
            <p
              className={cn(
                'mt-2.5 flex items-start gap-2 text-xs font-semibold',
                state.success ? 'text-success-foreground' : 'text-destructive',
              )}
            >
              <HugeiconsIcon
                icon={state.success ? CheckmarkCircle01Icon : Alert02Icon}
                strokeWidth={2}
                className="mt-0.5 size-3.5 shrink-0"
              />
              {state.message}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}