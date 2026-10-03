'use client'

import Image from 'next/image'
import { useActionState, useState } from 'react'
import { BankIcon, Cash01Icon, Wallet02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { saveCommercialSettingsAction } from './actions'
import { getMinimumAdvanceDescription } from './advance-policy'
import { useSettingsFormFeedback } from './form-feedback'
import {
  initialSettingsActionState,
  type LocalSettings,
} from './types'
import type { LocalPaymentMethod, PaymentMethodType } from '@/features/payments/types'

const methods = [
  { type: 'yape', label: 'Yape', group: 'digital' },
  { type: 'plin', label: 'Plin', group: 'digital' },
  { type: 'transferencia', label: 'Transferencia', group: 'digital' },
  { type: 'efectivo', label: 'Efectivo', group: 'local' },
  { type: 'otro', label: 'Otro medio', group: 'local' },
] as const

function PaymentMethodIcon({ type, enabled }: { type: PaymentMethodType; enabled: boolean }) {
  const className = cn(
    'grid size-10 shrink-0 place-items-center rounded-xl border bg-background transition-colors',
    enabled && 'border-primary/50',
  )

  if (type === 'yape') {
    return (
      <span className={className} aria-hidden="true">
        <Image src="/67c3a4c15f5d7-Yape.svg" alt="" width={30} height={30} unoptimized className="size-7 object-contain" />
      </span>
    )
  }

  if (type === 'plin') {
    return (
      <span className={className} aria-hidden="true">
        <Image src="/Plin%20%20AI.svg" alt="" width={30} height={30} unoptimized className="size-7 object-contain" />
      </span>
    )
  }

  const icon = type === 'transferencia'
    ? BankIcon
    : type === 'efectivo'
      ? Cash01Icon
      : Wallet02Icon

  return (
    <span className={className} aria-hidden="true">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
    </span>
  )
}

function MethodFields({ type, current }: { type: PaymentMethodType; current?: LocalPaymentMethod }) {
  if (type === 'yape' || type === 'plin') {
    return <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input name={`payment_${type}_phone`} defaultValue={current?.phone ?? ''} inputMode="numeric" maxLength={9} placeholder="Celular de 9 dígitos" /><Input name={`payment_${type}_holder`} defaultValue={current?.holder ?? ''} maxLength={100} placeholder="Nombre que verá el cliente" /></div>
  }
  if (type === 'transferencia') {
    return <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input name="payment_transferencia_bank" defaultValue={current?.bank ?? ''} maxLength={60} placeholder="Banco" /><Input name="payment_transferencia_holder" defaultValue={current?.holder ?? ''} maxLength={100} placeholder="Titular de la cuenta" /><Input name="payment_transferencia_account" defaultValue={current?.accountNumber ?? ''} maxLength={40} placeholder="Número de cuenta" /><Input name="payment_transferencia_cci" defaultValue={current?.cci ?? ''} inputMode="numeric" maxLength={20} placeholder="CCI (opcional si hay cuenta)" /></div>
  }
  if (type === 'otro') {
    return <Input name="payment_otro_name" defaultValue={current?.name ?? ''} maxLength={60} placeholder="Nombre del medio de cobro" className="mt-3" />
  }
  return <p className="mt-2 text-xs text-muted-foreground">Disponible al registrar cobros realizados en el local.</p>
}

export function CommercialSettingsForm({ settings, paymentMethods, minimumAdvancePercentage }: { settings: LocalSettings; paymentMethods: LocalPaymentMethod[]; minimumAdvancePercentage: number }) {
  const currentMethods = paymentMethods
  const [selected, setSelected] = useState<Set<PaymentMethodType>>(
    () => new Set(currentMethods.filter((method) => method.active).map((method) => method.type)),
  )
  const [state, action, pending] = useActionState(saveCommercialSettingsAction, initialSettingsActionState)
  useSettingsFormFeedback(state)

  function toggle(type: PaymentMethodType) {
    setSelected((value) => {
      const next = new Set(value)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <Card id="pagos-politicas" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Adelanto, pagos y política</CardTitle>
        <CardDescription>Reglas que verá el cliente antes de solicitar una reserva.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} onReset={(event) => event.preventDefault()} className="space-y-7">
          <input type="hidden" name="localId" value={settings.id} />
          <Field data-invalid={Boolean(state.fieldErrors?.advancePercentage)}>
            <FieldLabel htmlFor="advancePercentage">Porcentaje de adelanto</FieldLabel>
            <div className="relative max-w-48"><Input id="advancePercentage" name="advancePercentage" type="number" min={1} max={100} step="0.01" defaultValue={settings.porcentaje_adelanto ?? ''} required className="pr-10" /><span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-muted-foreground">%</span></div>
            <FieldDescription>{getMinimumAdvanceDescription(minimumAdvancePercentage)}</FieldDescription>
            <FieldError errors={state.fieldErrors?.advancePercentage?.map((message) => ({ message }))} />
          </Field>

          <fieldset>
            <legend className="text-sm font-semibold">Medios de cobro</legend>
            <p className="mt-1 text-sm text-muted-foreground">Una sola configuración para las reservas del app y los cobros que registras en el panel.</p>
            <div className="mt-4 space-y-5">
              <section>
                <div className="mb-2"><p className="text-xs font-extrabold uppercase tracking-[.1em]">Pagos digitales</p><p className="mt-1 text-xs text-muted-foreground">Se mostrarán al cliente en el app y también estarán disponibles en el panel.</p></div>
                <div className="grid gap-3">
                  {methods.filter((method) => method.group === 'digital').map((method) => {
                    const enabled = selected.has(method.type)
                    const current = currentMethods.find((item) => item.type === method.type)
                    return (
                      <div key={method.type} className="rounded-2xl border bg-muted/15 p-4">
                        <label className="flex cursor-pointer items-center gap-3 font-semibold">
                          <input type="checkbox" name="paymentMethod" value={method.type} checked={enabled} onChange={() => toggle(method.type)} className="size-4 accent-primary" />
                          <PaymentMethodIcon type={method.type} enabled={enabled} />
                          <span>{method.label}</span>
                        </label>
                        <fieldset disabled={!enabled}><MethodFields type={method.type} current={current} /></fieldset>
                      </div>
                    )
                  })}
                </div>
              </section>
              <section>
                <div className="mb-2"><p className="text-xs font-extrabold uppercase tracking-[.1em]">Cobros en el local</p></div>
                <div className="grid gap-3">
                  {methods.filter((method) => method.group === 'local').map((method) => {
                const enabled = selected.has(method.type)
                const current = currentMethods.find((item) => item.type === method.type)
                return (
                  <div key={method.type} className="rounded-2xl border bg-muted/15 p-4">
                    <label className="flex cursor-pointer items-center gap-3 font-semibold">
                      <input type="checkbox" name="paymentMethod" value={method.type} checked={enabled} onChange={() => toggle(method.type)} className="size-4 accent-primary" />
                      <PaymentMethodIcon type={method.type} enabled={enabled} />
                      <span>{method.label}</span>
                    </label>
                    <fieldset disabled={!enabled}><MethodFields type={method.type} current={current} /></fieldset>
                  </div>
                )
                  })}
                </div>
              </section>
            </div>
            <FieldError className="mt-2" errors={state.fieldErrors?.paymentMethods?.map((message) => ({ message }))} />
          </fieldset>

          <Field data-invalid={Boolean(state.fieldErrors?.refundPolicy)}>
            <FieldLabel htmlFor="refundPolicy">Política de cancelación y reembolso</FieldLabel>
            <Textarea id="refundPolicy" name="refundPolicy" defaultValue={settings.politica_reembolso === 'Este local no especificó su política de reembolso.' ? '' : settings.politica_reembolso} minLength={20} maxLength={1500} rows={6} required placeholder="Explica con cuánta anticipación se puede cancelar y en qué casos corresponde una devolución." />
            <FieldError errors={state.fieldErrors?.refundPolicy?.map((message) => ({ message }))} />
          </Field>
          <Button type="submit" disabled={pending}>{pending && <Spinner />}Guardar reglas comerciales</Button>
        </form>
      </CardContent>
    </Card>
  )
}
