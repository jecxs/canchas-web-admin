'use client'

import { useActionState } from 'react'
import { Alert02Icon, CheckmarkCircle01Icon, MoneyBag01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EditGuard, GuardActions, useEditGuard } from '@/components/dashboard/edit-guard'
import { cn } from '@/lib/utils'
import { initialSubscriptionPriceState, publishSubscriptionPriceAction } from './actions'
import type { SubscriptionPriceVersion } from './queries'

function money(value: number) {
  return `S/ ${value.toFixed(2)}`
}

export function SubscriptionPricingCard({ prices }: { prices: SubscriptionPriceVersion[] }) {
  const active = prices.find((price) => price.es_vigente) ?? null

  return (
    <EditGuard title="Plan mensual de propietarios">
      <SubscriptionPricingForm active={active} />
    </EditGuard>
  )
}

function SubscriptionPricingForm({ active }: { active: SubscriptionPriceVersion | null }) {
  const guard = useEditGuard()
  const [state, action, pending] = useActionState(
    publishSubscriptionPriceAction,
    initialSubscriptionPriceState,
  )

  return (
    <Card className={cn('overflow-hidden shadow-none', guard?.editing ? 'border-primary/45' : 'border-border/60 bg-muted/20')}>
      <CardContent className="p-0">
        <form action={action} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-success/20 text-success-foreground">
                <HugeiconsIcon icon={MoneyBag01Icon} strokeWidth={2} className="size-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-extrabold">Plan mensual de propietarios</h2>
                  <Badge variant={active ? 'success' : 'warning'}>
                    {active ? `Versión ${active.version} vigente` : 'Sin versión vigente'}
                  </Badge>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  La tarifa es un contrato versionado: al guardar se publica una nueva versión para próximos
                  checkouts. Los propietarios que ya contrataron no cambian de importe ni de gracia.
                </p>
              </div>
            </div>
            {active ? (
              <div className="rounded-xl border border-border/70 bg-background px-3 py-2 text-right text-xs">
                <p className="font-semibold text-muted-foreground">Cobro mínimo actual</p>
                <p className="mt-0.5 text-base font-black text-foreground">{money(active.monto_base)}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PriceField
              name="monto_base"
              label="Base mensual"
              suffix="S/"
              defaultValue={active?.monto_base ?? 80}
              step="0.01"
              min="0"
              max="100000"
            />
            <PriceField
              name="monto_sede_extra"
              label="Por sede extra"
              suffix="S/"
              defaultValue={active?.monto_sede_extra ?? 20}
              step="0.01"
              min="0"
              max="100000"
            />
            <PriceField
              name="sedes_incluidas"
              label="Sedes incluidas"
              defaultValue={active?.sedes_incluidas ?? 1}
              step="1"
              min="1"
              max="1000"
            />
            <PriceField
              name="dias_gracia"
              label="Días de gracia"
              defaultValue={active?.dias_gracia ?? 5}
              step="1"
              min="0"
              max="30"
            />
          </div>

          <div className="mt-4 rounded-xl border border-warning/30 bg-warning/8 p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="flex items-center gap-1.5 font-bold text-warning-foreground">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3.5" />
              Política de gracia
            </p>
            <p className="mt-1">
              Un cobro recurrente rechazado conserva el acceso hasta el plazo contratado. Los reintentos
              rechazados no reinician ese plazo. Al vencer, se suspenden el panel, reservas y visibilidad en el app.
            </p>
          </div>

          {state.message ? (
            <p className={cn('mt-4 flex items-start gap-2 text-xs font-semibold', state.success ? 'text-success-foreground' : 'text-destructive')}>
              <HugeiconsIcon icon={state.success ? CheckmarkCircle01Icon : Alert02Icon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0" />
              {state.message}
            </p>
          ) : null}

          <div className="mt-5 flex justify-end">
            <GuardActions pending={pending} state={state} submitLabel="Publicar nueva versión" />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function PriceField({
  name,
  label,
  suffix,
  defaultValue,
  step,
  min,
  max,
}: {
  name: string
  label: string
  suffix?: string
  defaultValue: number
  step: string
  min: string
  max: string
}) {
  return (
    <label className="block text-xs font-bold text-foreground">
      {label}
      <div className="relative mt-1.5">
        <Input
          name={name}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          required
          defaultValue={defaultValue}
          data-label={label}
          className={suffix ? 'pl-9' : ''}
        />
        {suffix ? <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-xs font-semibold text-muted-foreground">{suffix}</span> : null}
      </div>
    </label>
  )
}
