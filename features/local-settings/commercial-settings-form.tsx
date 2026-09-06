'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { saveCommercialSettingsAction } from './actions'
import { useSettingsFormFeedback } from './form-feedback'
import {
  initialSettingsActionState,
  parsePaymentMethods,
  type LocalSettings,
  type PaymentMethodType,
} from './types'

const methods = [
  { type: 'yape', label: 'Yape', placeholder: 'Número y nombre del titular' },
  { type: 'plin', label: 'Plin', placeholder: 'Número y nombre del titular' },
  { type: 'transferencia', label: 'Transferencia', placeholder: 'Banco, cuenta o CCI y titular' },
  { type: 'efectivo', label: 'Efectivo', placeholder: 'Indica cuándo se acepta' },
  { type: 'otro', label: 'Otro', placeholder: 'Nombre e instrucciones' },
] as const

export function CommercialSettingsForm({ settings }: { settings: LocalSettings }) {
  const currentMethods = parsePaymentMethods(settings.medios_pago_adelanto)
  const [selected, setSelected] = useState<Set<PaymentMethodType>>(
    () => new Set(currentMethods.map((method) => method.tipo)),
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
        <form action={action} className="space-y-7">
          <input type="hidden" name="localId" value={settings.id} />
          <Field data-invalid={Boolean(state.fieldErrors?.advancePercentage)}>
            <FieldLabel htmlFor="advancePercentage">Porcentaje de adelanto</FieldLabel>
            <div className="relative max-w-48"><Input id="advancePercentage" name="advancePercentage" type="number" min={1} max={100} step="0.01" defaultValue={settings.porcentaje_adelanto ?? ''} required className="pr-10" /><span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm text-muted-foreground">%</span></div>
            <FieldDescription>La base también comprobará el mínimo global configurado por Grassly.</FieldDescription>
            <FieldError errors={state.fieldErrors?.advancePercentage?.map((message) => ({ message }))} />
          </Field>

          <fieldset>
            <legend className="text-sm font-semibold">Medios aceptados para el adelanto</legend>
            <p className="mt-1 text-sm text-muted-foreground">Marca solo medios que puedas verificar manualmente.</p>
            <div className="mt-4 grid gap-3">
              {methods.map((method) => {
                const enabled = selected.has(method.type)
                const current = currentMethods.find((item) => item.tipo === method.type)?.detalle ?? ''
                return (
                  <div key={method.type} className="rounded-2xl border bg-muted/15 p-4">
                    <label className="flex cursor-pointer items-center gap-3 font-semibold">
                      <input type="checkbox" name="paymentMethod" value={method.type} checked={enabled} onChange={() => toggle(method.type)} className="size-4 accent-primary" />
                      {method.label}
                    </label>
                    <Input name={`payment_${method.type}`} defaultValue={current} disabled={!enabled} required={enabled} maxLength={120} placeholder={method.placeholder} className="mt-3" />
                  </div>
                )
              })}
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
