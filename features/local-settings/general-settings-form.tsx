'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { saveGeneralSettingsAction } from './actions'
import { useSettingsFormFeedback } from './form-feedback'
import { initialSettingsActionState, type LocalSettings } from './types'

function errors(messages?: string[]) {
  return messages?.map((message) => ({ message }))
}

export function GeneralSettingsForm({ settings }: { settings: LocalSettings }) {
  const [state, action, pending] = useActionState(saveGeneralSettingsAction, initialSettingsActionState)
  useSettingsFormFeedback(state)

  return (
    <Card id="datos-generales" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Datos generales y ubicación</CardTitle>
        <CardDescription>Información comercial visible para los jugadores.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-7">
          <input type="hidden" name="localId" value={settings.id} />
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(state.fieldErrors?.name)}>
                <FieldLabel htmlFor="name">Nombre comercial</FieldLabel>
                <Input id="name" name="name" defaultValue={settings.nombre} minLength={3} maxLength={100} required />
                <FieldError errors={errors(state.fieldErrors?.name)} />
              </Field>
              <Field data-invalid={Boolean(state.fieldErrors?.ruc)}>
                <FieldLabel htmlFor="ruc">RUC <span className="font-normal text-muted-foreground">(opcional)</span></FieldLabel>
                <Input id="ruc" name="ruc" inputMode="numeric" defaultValue={settings.ruc ?? ''} maxLength={11} />
                <FieldError errors={errors(state.fieldErrors?.ruc)} />
              </Field>
            </div>
            <Field data-invalid={Boolean(state.fieldErrors?.description)}>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Textarea id="description" name="description" defaultValue={settings.descripcion ?? ''} minLength={20} maxLength={600} rows={4} required placeholder="Describe tus instalaciones, iluminación y servicios." />
              <FieldDescription>Entre 20 y 600 caracteres. Evita incluir información que cambie diariamente.</FieldDescription>
              <FieldError errors={errors(state.fieldErrors?.description)} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(state.fieldErrors?.primaryPhone)}>
                <FieldLabel htmlFor="primaryPhone">Celular principal</FieldLabel>
                <Input id="primaryPhone" name="primaryPhone" inputMode="tel" defaultValue={settings.telefono_contacto_principal} maxLength={9} required />
                <FieldError errors={errors(state.fieldErrors?.primaryPhone)} />
              </Field>
              <Field data-invalid={Boolean(state.fieldErrors?.secondaryPhone)}>
                <FieldLabel htmlFor="secondaryPhone">Celular secundario <span className="font-normal text-muted-foreground">(opcional)</span></FieldLabel>
                <Input id="secondaryPhone" name="secondaryPhone" inputMode="tel" defaultValue={settings.telefono_contacto_secundario ?? ''} maxLength={9} />
                <FieldError errors={errors(state.fieldErrors?.secondaryPhone)} />
              </Field>
            </div>
            <Field data-invalid={Boolean(state.fieldErrors?.address)}>
              <FieldLabel htmlFor="address">Dirección</FieldLabel>
              <Input id="address" name="address" defaultValue={settings.direccion} maxLength={250} required />
              <FieldError errors={errors(state.fieldErrors?.address)} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(state.fieldErrors?.latitude)}>
                <FieldLabel htmlFor="latitude">Latitud</FieldLabel>
                <Input id="latitude" name="latitude" type="number" step="any" min={-90} max={90} defaultValue={settings.latitud ?? ''} required placeholder="-13.1631" />
                <FieldDescription>Valor decimal; el selector con mapa se añadirá después.</FieldDescription>
                <FieldError errors={errors(state.fieldErrors?.latitude)} />
              </Field>
              <Field data-invalid={Boolean(state.fieldErrors?.longitude)}>
                <FieldLabel htmlFor="longitude">Longitud</FieldLabel>
                <Input id="longitude" name="longitude" type="number" step="any" min={-180} max={180} defaultValue={settings.longitud ?? ''} required placeholder="-74.2236" />
                <FieldError errors={errors(state.fieldErrors?.longitude)} />
              </Field>
            </div>
          </FieldGroup>
          <Button type="submit" disabled={pending}>{pending && <Spinner />}Guardar datos generales</Button>
        </form>
      </CardContent>
    </Card>
  )
}
