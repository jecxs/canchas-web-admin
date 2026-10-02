'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  CreditCardIcon,
  EyeIcon,
  ViewOffIcon,
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
import { notify } from '@/lib/notifications/notify'
import {
  approveLocalForPaymentAction,
  changeLocalPublicationAction,
  grantLocalTrialAction,
  rejectLocalAction,
} from './actions'
import { adminLocalMessages } from './messages'
import {
  initialAdminLocalActionState,
  type AdminLocalActionState,
  type AdminLocalState,
} from './types'

const OPERATIONAL_STATES: AdminLocalState[] = ['trial', 'activo', 'en_gracia']

function useActionFeedback(state: AdminLocalActionState) {
  const router = useRouter()

  useEffect(() => {
    if (!state.message) return
    if (state.success) {
      notify.success({ title: state.message })
      router.refresh()
      return
    }
    if (state.message === adminLocalMessages.invalidFields) {
      notify.warning({ title: state.message })
      return
    }
    notify.error({ title: state.message })
  }, [state, router])
}

function DecisionError({ state }: { state: AdminLocalActionState }) {
  return state.message ? (
    <p className="text-sm text-destructive" role="alert">
      {state.message}
    </p>
  ) : null
}

function PublicationToggle({ localId, published, ready }: { localId: string; published: boolean; ready: boolean }) {
  const [state, action, pending] = useActionState(changeLocalPublicationAction, initialAdminLocalActionState)
  useActionFeedback(state)

  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="localId" value={localId} />
      <input type="hidden" name="published" value={published ? 'false' : 'true'} />
      <Button
        type="submit"
        variant={published ? 'outline' : 'default'}
        disabled={pending || (!published && !ready)}
      >
        {pending ? <Spinner /> : <HugeiconsIcon icon={published ? ViewOffIcon : EyeIcon} strokeWidth={2} />}
        {published ? 'Retirar del catálogo' : 'Publicar en la app'}
      </Button>
    </form>
  )
}

function ApproveForPayment({ localId }: { localId: string }) {
  const [state, action, pending] = useActionState(approveLocalForPaymentAction, initialAdminLocalActionState)
  useActionFeedback(state)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
          Aprobar para pago
        </Button>
      </DialogTrigger>
      <DialogContent className="theme-admin">
        <DialogHeader>
          <DialogTitle>Aprobar solicitud</DialogTitle>
          <DialogDescription>
            El propietario pasará a aprobado pendiente de pago. Su panel operativo seguirá bloqueado
            hasta que tenga una suscripción activa.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <input type="hidden" name="localId" value={localId} />
          <DecisionError state={state} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner /> : <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} />}
              Confirmar aprobación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function GrantTrial({ localId }: { localId: string }) {
  const [state, action, pending] = useActionState(grantLocalTrialAction, initialAdminLocalActionState)
  useActionFeedback(state)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
          Otorgar trial
        </Button>
      </DialogTrigger>
      <DialogContent className="theme-admin">
        <DialogHeader>
          <DialogTitle>Habilitar periodo de prueba</DialogTitle>
          <DialogDescription>
            El propietario obtendrá acceso al panel. El local comenzará sin publicar hasta completar
            su configuración.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <input type="hidden" name="localId" value={localId} />
          <Field data-invalid={Boolean(state.fieldErrors?.days?.length)}>
            <FieldLabel htmlFor="local-trial-days">Duración en días</FieldLabel>
            <Input
              id="local-trial-days"
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
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancelar</Button>
            </DialogClose>
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

function RejectLocal({ localId }: { localId: string }) {
  const [state, action, pending] = useActionState(rejectLocalAction, initialAdminLocalActionState)
  useActionFeedback(state)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:text-destructive">
          <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} />
          Observar solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="theme-admin">
        <DialogHeader>
          <DialogTitle>Observar y devolver solicitud</DialogTitle>
          <DialogDescription>
            Explica claramente qué debe corregir el propietario. Este texto será visible en su
            pantalla de estado.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <input type="hidden" name="localId" value={localId} />
          <Field data-invalid={Boolean(state.fieldErrors?.reason?.length)}>
            <FieldLabel htmlFor="local-rejection-reason">Motivo de la observación</FieldLabel>
            <Textarea
              id="local-rejection-reason"
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
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancelar</Button>
            </DialogClose>
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

export function LocalModerationPanel({
  localId,
  state,
  published,
  checklistReady,
}: {
  localId: string
  state: AdminLocalState
  published: boolean
  checklistReady: boolean
}) {
  const canDecide = state === 'pendiente_aprobacion' || state === 'aprobado_pendiente_pago'
  const canPublish = published || OPERATIONAL_STATES.includes(state)

  if (!canDecide && !canPublish) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canPublish ? <PublicationToggle localId={localId} published={published} ready={checklistReady} /> : null}
      {state === 'pendiente_aprobacion' ? <ApproveForPayment localId={localId} /> : null}
      {canDecide ? <GrantTrial localId={localId} /> : null}
      {canDecide ? <RejectLocal localId={localId} /> : null}
    </div>
  )
}
