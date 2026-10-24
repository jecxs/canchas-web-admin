'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useSettingsFormFeedback } from '@/features/local-settings/form-feedback'
import { MapLocationPicker, type LocationPatch } from '@/features/local-settings/map-location-picker'
import { initialSettingsActionState } from '@/features/local-settings/types'
import { cn } from '@/lib/utils'
import { createSedeAction } from './actions'
import type { SedeCreationDefaults } from './queries'

const AYACUCHO_CENTER = { latitude: -13.1631, longitude: -74.2244 }

function errors(messages?: string[]) {
  return messages?.map((message) => ({ message }))
}

export function CreateSedeForm({ defaults }: { defaults: SedeCreationDefaults }) {
  const [state, action, pending] = useActionState(createSedeAction, initialSettingsActionState)
  useSettingsFormFeedback(state)

  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  function handleLocationChange(patch: LocationPatch) {
    if (typeof patch.latitude === 'number') setLatitude(patch.latitude)
    if (typeof patch.longitude === 'number') setLongitude(patch.longitude)
    if (typeof patch.address === 'string') setAddress(patch.address)
  }

  const defaultCenter =
    defaults.latitude !== null && defaults.longitude !== null
      ? { latitude: defaults.latitude, longitude: defaults.longitude }
      : AYACUCHO_CENTER

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la nueva sede</CardTitle>
        <CardDescription>
          La sede se crea aprobada y operativa, pero permanece oculta del catálogo hasta que tú la publiques.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-7">
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(state.fieldErrors?.name)}>
                <FieldLabel htmlFor="sede-name">Nombre comercial</FieldLabel>
                <Input id="sede-name" name="name" minLength={3} maxLength={100} required placeholder="Ej. El Pelotero · San Juan Bautista" />
                <FieldError errors={errors(state.fieldErrors?.name)} />
              </Field>
              <Field data-invalid={Boolean(state.fieldErrors?.ruc)}>
                <FieldLabel htmlFor="sede-ruc">RUC <span className="font-normal text-muted-foreground">(opcional)</span></FieldLabel>
                <Input id="sede-ruc" name="ruc" inputMode="numeric" defaultValue={defaults.ruc} maxLength={11} />
                <FieldError errors={errors(state.fieldErrors?.ruc)} />
              </Field>
            </div>

            <Field data-invalid={Boolean(state.fieldErrors?.description)}>
              <FieldLabel htmlFor="sede-description">Descripción <span className="font-normal text-muted-foreground">(opcional)</span></FieldLabel>
              <Textarea id="sede-description" name="description" minLength={20} maxLength={600} rows={4} placeholder="Describe las instalaciones, iluminación y servicios de esta sede." />
              <FieldDescription>Si la completas, debe tener entre 20 y 600 caracteres. También puedes hacerlo después en Configuración.</FieldDescription>
              <FieldError errors={errors(state.fieldErrors?.description)} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(state.fieldErrors?.primaryPhone)}>
                <FieldLabel htmlFor="sede-primary-phone">Celular principal</FieldLabel>
                <Input id="sede-primary-phone" name="primaryPhone" inputMode="tel" defaultValue={defaults.phone} maxLength={9} required />
                <FieldError errors={errors(state.fieldErrors?.primaryPhone)} />
              </Field>
              <Field data-invalid={Boolean(state.fieldErrors?.secondaryPhone)}>
                <FieldLabel htmlFor="sede-secondary-phone">Celular secundario <span className="font-normal text-muted-foreground">(opcional)</span></FieldLabel>
                <Input id="sede-secondary-phone" name="secondaryPhone" inputMode="tel" maxLength={9} />
                <FieldError errors={errors(state.fieldErrors?.secondaryPhone)} />
              </Field>
            </div>

            <Field data-invalid={Boolean(state.fieldErrors?.address)}>
              <FieldLabel htmlFor="sede-address">Dirección</FieldLabel>
              <Input id="sede-address" name="address" value={address} onChange={(event) => setAddress(event.target.value)} maxLength={250} required />
              <FieldDescription>Se completa automáticamente al elegir la zona en el mapa; puedes ajustarla si hace falta.</FieldDescription>
              <FieldError errors={errors(state.fieldErrors?.address)} />
            </Field>

            <Field>
              <FieldLabel>Ubicación en el mapa</FieldLabel>
              <MapLocationPicker
                latitude={latitude}
                longitude={longitude}
                defaultCenter={defaultCenter}
                onLocationChange={handleLocationChange}
              />
              <FieldDescription>Mueve el pin sobre la puerta de la sede para fijar las coordenadas exactas.</FieldDescription>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(state.fieldErrors?.latitude)}>
                <FieldLabel htmlFor="sede-latitude">Latitud</FieldLabel>
                <Input id="sede-latitude" name="latitude" value={latitude ?? ''} readOnly tabIndex={-1} aria-readonly className="bg-muted/40" />
                <FieldError errors={errors(state.fieldErrors?.latitude)} />
              </Field>
              <Field data-invalid={Boolean(state.fieldErrors?.longitude)}>
                <FieldLabel htmlFor="sede-longitude">Longitud</FieldLabel>
                <Input id="sede-longitude" name="longitude" value={longitude ?? ''} readOnly tabIndex={-1} aria-readonly className="bg-muted/40" />
                <FieldError errors={errors(state.fieldErrors?.longitude)} />
              </Field>
            </div>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link href="/panel/sedes" className={cn(buttonVariants({ variant: 'outline' }), 'w-full sm:w-auto')}>
              Cancelar
            </Link>
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? <Spinner /> : null}
              Crear sede
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
