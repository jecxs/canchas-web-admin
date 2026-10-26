'use client'

import { useActionState, useState } from 'react'
import {
  Alert02Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Layers01Icon,
  MoneyBag01Icon,
  PercentIcon,
  ShieldBanIcon,
  Wallet02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EditGuard, GuardActions, useEditGuard } from '@/components/dashboard/edit-guard'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { updatePlatformParameterAction } from './actions'
import { formatPlatformValue, initialPlatformParameterState } from './types'
import type {
  PlatformParameterAccent,
  PlatformParameterDefinition,
  PlatformParameterIcon,
  PlatformParameterRow,
} from './types'

const ICONS = {
  ban: ShieldBanIcon,
  clock: Clock01Icon,
  layers: Layers01Icon,
  money: MoneyBag01Icon,
  percent: PercentIcon,
  wallet: Wallet02Icon,
} satisfies Record<PlatformParameterIcon, unknown>

const ACCENTS: Record<PlatformParameterAccent, { chip: string; card: string }> = {
  warning: { chip: 'bg-warning/25 text-warning-foreground', card: 'border-warning/45' },
  info: { chip: 'bg-info/20 text-info-foreground', card: 'border-info/45' },
  plum: { chip: 'bg-plum/15 text-plum', card: 'border-plum/40' },
  success: { chip: 'bg-success/20 text-success-foreground', card: 'border-success/45' },
  primary: { chip: 'bg-primary/30 text-primary-foreground', card: 'border-primary/55' },
  destructive: { chip: 'bg-destructive/15 text-destructive', card: 'border-destructive/45' },
}

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
  const accent = ACCENTS[definition.accent]

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
        'flex h-full flex-col shadow-none transition-colors',
        locked ? 'border-border/60 bg-muted/20' : cn('bg-card', accent.card),
        locked && 'cursor-not-allowed',
      )}
    >
      <CardContent className="p-0">
        <form action={action} className="flex h-full flex-col gap-3 p-4">
          <input type="hidden" name="clave" value={definition.key} />

          <div className="flex items-start gap-3">
            <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', accent.chip)}>
              <HugeiconsIcon icon={ICONS[definition.icon]} strokeWidth={2} className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-extrabold">{definition.title}</p>
                <Badge variant={row.value === null ? 'warning' : 'success'} className="font-normal">
                  {formatPlatformValue(row.value, definition.unit)}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{definition.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-muted/70 px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
              {definition.key}
            </span>
            {definition.rangeLabel ? (
              <span className="rounded-md border border-border/70 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {definition.rangeLabel}
              </span>
            ) : null}
          </div>

          {isWords ? (
            <Textarea
              name="valor"
              rows={4}
              defaultValue={words?.join('\n') ?? ''}
              placeholder="Una por línea o separadas por coma"
              aria-label="Palabras prohibidas"
              className="text-xs"
            />
          ) : (
            <div className="relative w-full">
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
                placeholder="Sin configurar"
                aria-label={`Valor de ${definition.title}`}
                aria-invalid={affected > 0}
                className={cn(definition.unit === 'S/' ? 'pl-9' : 'pr-14')}
              />
              {definition.unit ? (
                <span
                  className={cn(
                    'pointer-events-none absolute inset-y-0 grid place-items-center text-xs font-semibold text-muted-foreground',
                    definition.unit === 'S/' ? 'left-3' : 'right-3',
                  )}
                >
                  {definition.unit}
                </span>
              ) : null}
            </div>
          )}

          {definition.impact && guard?.editing ? (
            <div className="rounded-xl border border-warning/30 bg-warning/8 p-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-warning-foreground">
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3.5" />
                Consideraciones
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{definition.impact}</p>
            </div>
          ) : null}

          {affected > 0 && guard?.editing ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/8 p-3">
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

          {state.message ? (
            <p
              className={cn(
                'flex items-start gap-2 text-xs font-semibold',
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

          <div className="mt-auto flex items-center justify-end gap-2 pt-1">
            <GuardActions pending={pending} state={state} submitLabel="Guardar" />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}