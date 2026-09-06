'use client'

import { useActionState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { notify } from '@/lib/notifications/notify'
import { submitOwnerApplication } from './actions'
import { ownerApplicationMessages } from './messages'
import { initialOwnerApplicationState, type OwnerApplicationFields } from './types'

type OwnerApplicationFormProps = {
  defaultValues?: Partial<OwnerApplicationFields>
}

function errorsFor(messages?: string[]) {
  return messages?.map((message) => ({ message }))
}

export function OwnerApplicationForm({ defaultValues = {} }: OwnerApplicationFormProps) {
  const [state, formAction, pending] = useActionState(
    submitOwnerApplication,
    initialOwnerApplicationState,
  )

  useEffect(() => {
    if (!state.message) return

    if (state.fieldErrors) {
      notify.warning({ title: ownerApplicationMessages.invalidFields })
      return
    }

    notify.error()
  }, [state])

  const values = { ...defaultValues, ...state.values }
  const formKey = state.values ? JSON.stringify(state.values) : 'initial'

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-black tracking-tight">Completa tus datos</CardTitle>
        <CardDescription>
          Registra la información básica de tu primer local. Todos los campos se verificarán antes de enviar la solicitud.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.message ? (
          <Alert variant="destructive" className="mb-6" aria-live="polite">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <form action={formAction} key={formKey}>
          <FieldGroup>
            <Field data-invalid={Boolean(state.fieldErrors?.nombreLocal)}>
              <FieldLabel htmlFor="nombre-local">Nombre de la cancha o local</FieldLabel>
              <Input
                id="nombre-local"
                name="nombreLocal"
                defaultValue={values.nombreLocal}
                required
                minLength={3}
                maxLength={120}
                aria-invalid={Boolean(state.fieldErrors?.nombreLocal)}
                aria-describedby="nombre-local-error"
              />
              <FieldError id="nombre-local-error" errors={errorsFor(state.fieldErrors?.nombreLocal)} />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(state.fieldErrors?.telefono)}>
                <FieldLabel htmlFor="celular">Celular</FieldLabel>
                <Input
                  id="celular"
                  name="telefono"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  defaultValue={values.telefono}
                  required
                  minLength={9}
                  maxLength={9}
                  pattern="[0-9]{9}"
                  aria-invalid={Boolean(state.fieldErrors?.telefono)}
                  aria-describedby="celular-error"
                />
                <FieldError id="celular-error" errors={errorsFor(state.fieldErrors?.telefono)} />
              </Field>

              <Field data-invalid={Boolean(state.fieldErrors?.dni)}>
                <FieldLabel htmlFor="dni">DNI</FieldLabel>
                <Input
                  id="dni"
                  name="dni"
                  inputMode="numeric"
                  defaultValue={values.dni}
                  required
                  minLength={8}
                  maxLength={8}
                  pattern="[0-9]{8}"
                  aria-invalid={Boolean(state.fieldErrors?.dni)}
                  aria-describedby="dni-error"
                />
                <FieldError id="dni-error" errors={errorsFor(state.fieldErrors?.dni)} />
              </Field>
            </div>

            <Field data-invalid={Boolean(state.fieldErrors?.direccion)}>
              <FieldLabel htmlFor="direccion">Dirección</FieldLabel>
              <Input
                id="direccion"
                name="direccion"
                autoComplete="street-address"
                defaultValue={values.direccion}
                required
                minLength={5}
                maxLength={240}
                aria-invalid={Boolean(state.fieldErrors?.direccion)}
                aria-describedby="direccion-error"
              />
              <FieldError id="direccion-error" errors={errorsFor(state.fieldErrors?.direccion)} />
            </Field>

            <Field data-invalid={Boolean(state.fieldErrors?.ruc)}>
              <FieldLabel htmlFor="ruc">RUC (opcional)</FieldLabel>
              <Input
                id="ruc"
                name="ruc"
                inputMode="numeric"
                defaultValue={values.ruc}
                maxLength={11}
                pattern="[0-9]{11}"
                aria-invalid={Boolean(state.fieldErrors?.ruc)}
                aria-describedby="ruc-error"
              />
              <FieldError id="ruc-error" errors={errorsFor(state.fieldErrors?.ruc)} />
            </Field>

            <Button type="submit" size="lg" disabled={pending} className="w-full font-semibold">
              {pending ? <Spinner /> : null}
              {pending ? 'Enviando solicitud…' : 'Enviar solicitud'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
