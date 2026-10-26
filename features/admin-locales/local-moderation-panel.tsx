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
  RefreshCwIcon,
  ViewOffIcon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  applyLocalModerationAction,
  changeLocalPublicationAction,
  grantLocalTrialAction,
  liftLocalModerationAction,
  reactivateLocalTrialAction,
  rejectLocalAction,
} from './actions'
import { adminLocalMessages } from './messages'
import {
  initialAdminLocalActionState,
  type AdminLocalActionState,
  type AdminLocalState,
  type AdminLocalModeration,
} from './types'

const OPERATIONAL_STATES: AdminLocalState[] = ['trial', 'activo', 'en_gracia']
const REACTIVABLE_STATES: AdminLocalState[] = ['trial', 'activo', 'en_gracia', 'suspendido']

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

function ReactivateTrial({ localId }: { localId: string }) {
  const [state, action, pending] = useActionState(reactivateLocalTrialAction, initialAdminLocalActionState)
  useActionFeedback(state)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <HugeiconsIcon icon={RefreshCwIcon} strokeWidth={2} />
          Otorgar acceso de prueba
        </Button>
      </DialogTrigger>
      <DialogContent className="theme-admin">
        <DialogHeader>
          <DialogTitle>Otorgar acceso de prueba</DialogTitle>
          <DialogDescription>
            Otorga acceso temporal a un local de prueba, heredado o que recibe una cortesía comercial.
            No levanta una medida administrativa activa ni modifica su suscripción actual.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <input type="hidden" name="localId" value={localId} />
          <Field data-invalid={Boolean(state.fieldErrors?.days?.length)}>
            <FieldLabel htmlFor="local-reactivate-days">Duración en días</FieldLabel>
            <Input
              id="local-reactivate-days"
              name="days"
              type="number"
              min={1}
              max={90}
              defaultValue={30}
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
              Otorgar acceso
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

const moderationCopy: Record<AdminLocalModeration['type'], {
  label: string
  title: string
  description: string
  requiresEnd: boolean
  destructive?: boolean
}> = {
  advertencia: {
    label: 'Emitir advertencia',
    title: 'Emitir advertencia',
    description: 'El local seguirá operando. El propietario recibirá una notificación y la advertencia vencerá automáticamente en siete días.',
    requiresEnd: false,
  },
  pausa_reservas: {
    label: 'Pausar nuevas reservas',
    title: 'Pausar nuevas reservas',
    description: 'El local dejará de aparecer al público y no podrá recibir reservas nuevas. Sus reservas existentes no se modifican.',
    requiresEnd: true,
  },
  suspension_temporal: {
    label: 'Suspender temporalmente',
    title: 'Suspender temporalmente',
    description: 'Se ocultará el local, se bloquearán nuevas reservas y el panel operativo quedará restringido hasta la fecha indicada.',
    requiresEnd: true,
    destructive: true,
  },
  retiro_definitivo: {
    label: 'Retiro definitivo',
    title: 'Retirar definitivamente',
    description: 'Se ocultará el local y se restringirá su operación sin fecha de término. Esta acción no cancela reservas existentes.',
    requiresEnd: false,
    destructive: true,
  },
}

function ApplyModeration({ localId, type }: { localId: string; type: AdminLocalModeration['type'] }) {
  const [state, action, pending] = useActionState(applyLocalModerationAction, initialAdminLocalActionState)
  const copy = moderationCopy[type]
  useActionFeedback(state)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={copy.destructive ? 'destructive' : 'outline'}>
          {copy.label}
        </Button>
      </DialogTrigger>
      <DialogContent className="theme-admin">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <input type="hidden" name="localId" value={localId} />
          <input type="hidden" name="type" value={type} />
          <Field data-invalid={Boolean(state.fieldErrors?.reason?.length)}>
            <FieldLabel htmlFor={`moderation-reason-${type}`}>Motivo visible para el propietario</FieldLabel>
            <Textarea
              id={`moderation-reason-${type}`}
              name="reason"
              minLength={5}
              maxLength={500}
              rows={4}
              required
              placeholder="Explica la medida y qué debe hacer el propietario."
              aria-invalid={Boolean(state.fieldErrors?.reason?.length)}
            />
            <FieldError errors={state.fieldErrors?.reason?.map((message) => ({ message }))} />
          </Field>
          {copy.requiresEnd ? (
            <Field data-invalid={Boolean(state.fieldErrors?.endsAt?.length)}>
              <FieldLabel htmlFor={`moderation-end-${type}`}>Termina el</FieldLabel>
              <Input id={`moderation-end-${type}`} name="endsAt" type="datetime-local" required aria-invalid={Boolean(state.fieldErrors?.endsAt?.length)} />
              <FieldError errors={state.fieldErrors?.endsAt?.map((message) => ({ message }))} />
            </Field>
          ) : null}
          <Field data-invalid={Boolean(state.fieldErrors?.internalNotes?.length)}>
            <FieldLabel htmlFor={`moderation-notes-${type}`}>Notas internas <span className="font-normal text-muted-foreground">(opcional)</span></FieldLabel>
            <Textarea id={`moderation-notes-${type}`} name="internalNotes" maxLength={2000} rows={3} placeholder="Evidencia o contexto para el equipo." aria-invalid={Boolean(state.fieldErrors?.internalNotes?.length)} />
            <FieldError errors={state.fieldErrors?.internalNotes?.map((message) => ({ message }))} />
          </Field>
          <DecisionError state={state} />
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button type="submit" variant={copy.destructive ? 'destructive' : 'default'} disabled={pending}>
              {pending && <Spinner />}
              Confirmar medida
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LiftModeration({ localId }: { localId: string }) {
  const [state, action, pending] = useActionState(liftLocalModerationAction, initialAdminLocalActionState)
  useActionFeedback(state)
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="secondary">Levantar medida</Button></DialogTrigger>
      <DialogContent className="theme-admin">
        <DialogHeader>
          <DialogTitle>Levantar medida administrativa</DialogTitle>
          <DialogDescription>El local recuperará su visibilidad y acceso según su publicación y suscripción vigentes.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <input type="hidden" name="localId" value={localId} />
          <Field data-invalid={Boolean(state.fieldErrors?.reason?.length)}>
            <FieldLabel htmlFor="lift-moderation-reason">Motivo interno <span className="font-normal text-muted-foreground">(opcional)</span></FieldLabel>
            <Textarea id="lift-moderation-reason" name="reason" maxLength={500} rows={3} placeholder="Ej.: Se verificó la corrección del incumplimiento." aria-invalid={Boolean(state.fieldErrors?.reason?.length)} />
            <FieldError errors={state.fieldErrors?.reason?.map((message) => ({ message }))} />
          </Field>
          <DecisionError state={state} />
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={pending}>{pending && <Spinner />}Levantar medida</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ActiveModeration({ localId, moderation }: { localId: string; moderation: AdminLocalModeration }) {
  const endsAt = moderation.endsAt
    ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(moderation.endsAt))
    : 'Sin vencimiento'
  return (
    <div className="w-full rounded-xl border border-warning/35 bg-warning/10 p-4">
      <p className="text-sm font-bold">Medida activa: {moderationCopy[moderation.type].title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{moderation.reason}</p>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">{endsAt}</p>
      <div className="mt-3 flex flex-wrap gap-2"><LiftModeration localId={localId} /></div>
    </div>
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
  const canReactivate = REACTIVABLE_STATES.includes(state)

  if (!canDecide && !canPublish && !canReactivate) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canPublish ? <PublicationToggle localId={localId} published={published} ready={checklistReady} /> : null}
      {state === 'pendiente_aprobacion' ? <ApproveForPayment localId={localId} /> : null}
      {canDecide ? <GrantTrial localId={localId} /> : null}
      {canReactivate ? <ReactivateTrial localId={localId} /> : null}
      {canDecide ? <RejectLocal localId={localId} /> : null}
    </div>
  )
}

export function LocalModerationSection({
  localId,
  state,
  moderation,
}: {
  localId: string
  state: AdminLocalState
  moderation: AdminLocalModeration | null
}) {
  const canModerate = OPERATIONAL_STATES.includes(state) || state === 'suspendido'
  if (!canModerate) return null

  return (
    <Card className="border-warning/25">
      <CardHeader className="gap-1">
        <CardTitle>Moderación</CardTitle>
        <CardDescription>
          Las medidas administrativas se gestionan por separado de la publicación y de la suscripción.
          No modifican reservas ya creadas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {moderation ? <ActiveModeration localId={localId} moderation={moderation} /> : null}
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <ApplyModeration localId={localId} type="advertencia" />
          <ApplyModeration localId={localId} type="pausa_reservas" />
          <ApplyModeration localId={localId} type="suspension_temporal" />
          <ApplyModeration localId={localId} type="retiro_definitivo" />
        </div>
      </CardContent>
    </Card>
  )
}
