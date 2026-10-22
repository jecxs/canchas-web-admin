'use client'

import { useActionState, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon, RefreshIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GuardActions } from '@/components/dashboard/edit-guard'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { saveGeneralSettingsAction } from './actions'
import { useSettingsFormFeedback } from './form-feedback'
import { MapLocationPicker, type LocationPatch } from './map-location-picker'
import { reverseGeocodeAddress } from './map-geocoding'
import { initialSettingsActionState, type LocalSettings } from './types'

function errors(messages?: string[]) {
  return messages?.map((message) => ({ message }))
}

export function GeneralSettingsForm({ settings }: { settings: LocalSettings }) {
  const [state, action, pending] = useActionState(saveGeneralSettingsAction, initialSettingsActionState)
  useSettingsFormFeedback(state)

  const [address, setAddress] = useState(settings.direccion)
  const [latitude, setLatitude] = useState<number | null>(settings.latitud)
  const [longitude, setLongitude] = useState<number | null>(settings.longitud)
  const [updatingAddress, setUpdatingAddress] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)

  function handleLocationChange(patch: LocationPatch) {
    if (typeof patch.latitude === 'number') setLatitude(patch.latitude)
    if (typeof patch.longitude === 'number') setLongitude(patch.longitude)
  }

  async function handleUpdateAddress() {
    if (updatingAddress) return
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      setAddressError('Ubica primero el local en el mapa.')
      return
    }
    setUpdatingAddress(true)
    setAddressError(null)
    try {
      const nextAddress = await reverseGeocodeAddress(longitude, latitude)
      if (!nextAddress) {
        setAddressError('No encontramos una dirección en este punto. Ajusta el pin e inténtalo de nuevo.')
        return
      }
      setAddress(nextAddress)
    } finally {
      setUpdatingAddress(false)
    }
  }

  return (
    <Card id="datos-generales" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Datos generales y ubicación</CardTitle>
        <CardDescription>Información comercial visible para los jugadores.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} onReset={(event) => event.preventDefault()} className="space-y-7">
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
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input id="address" name="address" value={address} onChange={(event) => setAddress(event.target.value)} maxLength={250} required />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleUpdateAddress()}
                  disabled={updatingAddress || latitude === null || longitude === null}
                  className="h-11 shrink-0"
                >
                  {updatingAddress
                    ? <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin" />
                    : <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />}
                  Actualizar según el mapa
                </Button>
              </div>
              <FieldDescription>Escríbela o usa «Actualizar según el mapa» para tomarla del pin.</FieldDescription>
              <FieldError errors={errors(state.fieldErrors?.address)} />
              {addressError ? <p className="text-sm font-medium text-destructive">{addressError}</p> : null}
            </Field>
            <Field>
              <FieldLabel>Ubicación en el mapa</FieldLabel>
              <MapLocationPicker latitude={latitude} longitude={longitude} onLocationChange={handleLocationChange} />
              <FieldDescription>Mueve el pin sobre la puerta del local para fijar las coordenadas exactas.</FieldDescription>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(state.fieldErrors?.latitude)}>
                <FieldLabel htmlFor="latitude">Latitud</FieldLabel>
                <Input id="latitude" name="latitude" value={latitude ?? ''} readOnly tabIndex={-1} aria-readonly className="bg-muted/40" />
                <FieldError errors={errors(state.fieldErrors?.latitude)} />
              </Field>
              <Field data-invalid={Boolean(state.fieldErrors?.longitude)}>
                <FieldLabel htmlFor="longitude">Longitud</FieldLabel>
                <Input id="longitude" name="longitude" value={longitude ?? ''} readOnly tabIndex={-1} aria-readonly className="bg-muted/40" />
                <FieldError errors={errors(state.fieldErrors?.longitude)} />
              </Field>
            </div>
          </FieldGroup>
          <GuardActions pending={pending} state={state} submitLabel="Guardar datos generales" />
        </form>
      </CardContent>
    </Card>
  )
}
