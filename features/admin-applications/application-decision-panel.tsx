'use client'

import { useActionState, useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CancelCircleIcon,
  Clock01Icon,
  CreditCardIcon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { notify, notificationMessages } from '@/lib/notifications/notify'
import {
  approveForPaymentAction,
  grantTrialAction,
  rejectApplicationAction,
} from './actions'
import {
  initialAdminDecisionState,
  type AdminApplicationStatus,
  type AdminDecisionState,
} from './types'

function DecisionError({ state }: { state: AdminDecisionState }) {
  useEffect(() => {
    if (!state.message) return
    if (state.message === notificationMessages.checkFields) {
      notify.warning({ title: notificationMessages.checkFields })
      return
    }
    notify.error()
  }, [state])

  return state.message ? (
    <p className="text-sm text-destructive" role="alert">{state.message}</p>
  ) : null
}

function ApproveForPayment({ localId }: { localId: string }) {
  const [state, action, pending] = useActionState(
    approveForPaymentAction,
    initialAdminDecisionState,
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
          Aprobar para pago
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprobar solicitud</DialogTitle>
          <DialogDescription>
            El propietario pasará a aprobado pendiente de pago. Su panel operativo
            seguirá bloqueado hasta que tenga una suscripción activa.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <input type="hidden" name="localId" value={localId} />
          <DecisionError state={state} />
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              Confirmar aprobación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function GrantTrial({ localId }: { localId: string }) {
  const [state, action, pending] = useActionState(
    grantTrialAction,
    initialAdminDecisionState,
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
          Otorgar trial
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Habilitar periodo de prueba</DialogTitle>
          <DialogDescription>
            El propietario obtendrá acceso al panel. El local comenzará sin publicar
            hasta completar su configuración y decidir publicarlo.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <input type="hidden" name="localId" value={localId} />
          <Field data-invalid={Boolean(state.fieldErrors?.days?.length)}>
            <FieldLabel htmlFor="trial-days">Duración en días</FieldLabel>
            <Input
              id="trial-days"
              name="days"
              type="number"
              min={1}
              max={90}
              defaultValue={14}
              required
              aria-invalid={Boolean(state.fieldErrors?.days?.length)}
            />
            <FieldError errors={state.fieldErrors?.days?.map((message) => ({ message }))} />
          </Field>
          <DecisionError state={state} />
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              Activar trial
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RejectApplication({ localId }: { localId: string }) {
  const [state, action, pending] = useActionState(
    rejectApplicationAction,
    initialAdminDecisionState,
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:text-destructive">
          <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} />
          Observar solicitud
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Observar y devolver solicitud</DialogTitle>
          <DialogDescription>
            Explica claramente qué debe corregir el propietario. Este texto será
            visible en su pantalla de estado.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <input type="hidden" name="localId" value={localId} />
          <Field data-invalid={Boolean(state.fieldErrors?.reason?.length)}>
            <FieldLabel htmlFor="rejection-reason">Motivo de la observación</FieldLabel>
            <Textarea
              id="rejection-reason"
              name="reason"
              minLength={5}
              maxLength={500}
              rows={5}
              required
              placeholder="Ej.: El RUC indicado no coincide con el nombre comercial."
              aria-invalid={Boolean(state.fieldErrors?.reason?.length)}
            />
            <FieldError errors={state.fieldErrors?.reason?.map((message) => ({ message }))} />
          </Field>
          <DecisionError state={state} />
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Spinner />}
              Enviar observación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ApplicationDecisionPanel({
  localId,
  status,
}: {
  localId: string
  status: AdminApplicationStatus
}) {
  if (status === 'rechazado') return null

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'pendiente_aprobacion' && <ApproveForPayment localId={localId} />}
      <GrantTrial localId={localId} />
      <RejectApplication localId={localId} />
    </div>
  )
}
