'use client'

import { useActionState, useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { notify } from '@/lib/notifications/notify'
import { ArrowDown01Icon, Building03Icon, Calendar03Icon, Cancel01Icon, CheckmarkCircle01Icon, Clock01Icon, FootballIcon, Layers01Icon, RulerIcon } from '@hugeicons/core-free-icons'
import { minutesToTime, timeToMinutes } from './date-utils'
import {
  confirmReservationAction,
  cancelReservationAction,
  createEncasedBookingAction,
  createMaintenanceAction,
  createManualBookingAction,
  extendReservationAction,
  markNoShowReservationAction,
  registerPaymentMovementAction,
  rejectReservationAction,
  rescheduleReservationAction,
} from './actions'
import { initialAgendaActionState, type AgendaActionState, type AgendaCourt } from './types'

function Feedback({ state }: { state: AgendaActionState }) {
  if (!state.message || state.success || state.message !== 'Revisa los campos indicados') return null
  return <p role="alert" className="text-xs font-semibold text-destructive">{state.message}</p>
}

function useAgendaFeedback(state: AgendaActionState, onSuccess: () => void) {
  useEffect(() => {
    if (!state.message) return
    if (state.success) {
      notify.success({ description: state.message })
      onSuccess()
    } else if (state.message === 'Revisa los campos indicados') {
      notify.warning()
    } else {
      notify.error({ description: state.message })
    }
  }, [state, onSuccess])
}

function FieldError({ state, field }: { state: AgendaActionState; field: string }) {
  const message = state.fieldErrors?.[field]?.[0]
  return message ? <p className="text-xs font-semibold text-destructive">{message}</p> : null
}

function FormActions({ pending, onCancel, label }: { pending: boolean; onCancel: () => void; label: string }) {
  return <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>Cancelar</Button><Button type="submit" disabled={pending}>{pending && <Spinner />}{label}</Button></div>
}

const inputClass = 'h-10 rounded-xl bg-background'

type SelectOption = { value: string; label: string }

function FormSelect({ name, options, value, defaultValue, onValueChange, placeholder }: { name: string; options: SelectOption[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; placeholder?: string }) {
  return <Select name={name} value={value} defaultValue={defaultValue} onValueChange={onValueChange}><SelectTrigger className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent position="popper" align="start">{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
}

function formatReservationDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00Z`))
}

function ReservationSlotSummary({ court, date, startTime, endTime }: { court: AgendaCourt; date: string; startTime: string; endTime: string }) {
  const dimensions = court.lengthMeters && court.widthMeters ? `${court.lengthMeters} × ${court.widthMeters} m` : null

  return <div className="space-y-2.5">
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-xl border bg-muted/45 px-3 py-2.5"><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-muted-foreground"><HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5 text-primary" /> Fecha</div><p className="mt-1 capitalize text-sm font-extrabold">{formatReservationDate(date)}</p></div>
      <div className="rounded-xl bg-secondary px-3 py-2.5 text-secondary-foreground"><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-secondary-foreground/65"><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5 text-primary" /> Horario</div><p className="mt-1 text-sm font-extrabold tabular-nums">{startTime} <span className="text-primary">—</span> {endTime}</p></div>
    </div>
    <details className="group rounded-xl border bg-background">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5"><span className="flex min-w-0 items-center gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-4" /></span><span className="min-w-0"><span className="block text-[10px] font-extrabold uppercase tracking-[.1em] text-muted-foreground">Cancha</span><span className="block truncate text-sm font-extrabold">{court.name}</span></span></span><span className="grid size-7 shrink-0 place-items-center rounded-lg border text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-label="Mostrar información de la cancha"><HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4" /></span></summary>
      <div className="grid gap-2 border-t px-3 py-3 text-xs text-muted-foreground sm:grid-cols-2">
        <div className="flex items-start gap-2"><HugeiconsIcon icon={FootballIcon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0 text-primary" /><span><strong className="block text-foreground">Deportes</strong>{court.sports.map((sport) => sport.name).join(' · ') || 'Sin deporte configurado'}</span></div>
        {court.surface && <div className="flex items-start gap-2"><HugeiconsIcon icon={Layers01Icon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0 text-primary" /><span><strong className="block text-foreground">Superficie</strong>{court.surface}</span></div>}
        {dimensions && <div className="flex items-start gap-2"><HugeiconsIcon icon={RulerIcon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0 text-primary" /><span><strong className="block text-foreground">Medidas</strong>{dimensions}</span></div>}
        {court.description && <p className="border-t pt-2 sm:col-span-2">{court.description}</p>}
      </div>
    </details>
  </div>
}

export function ManualBookingForm({
  localId,
  date,
  court,
  startTime,
  initialBlocks = 1,
  defaultSportId,
  onCancel,
  onSuccess,
}: {
  localId: string
  date: string
  court: AgendaCourt
  startTime: string
  initialBlocks?: number
  defaultSportId?: string
  onCancel: () => void
  onSuccess: () => void
}) {
  const [state, action, pending] = useActionState(createManualBookingAction, initialAgendaActionState)
  const [blocks, setBlocks] = useState(initialBlocks)
  useAgendaFeedback(state, onSuccess)
  const endTime = minutesToTime(timeToMinutes(startTime) + blocks * 60)
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="localId" value={localId} /><input type="hidden" name="courtId" value={court.id} /><input type="hidden" name="date" value={date} /><input type="hidden" name="time" value={startTime} />
      <ReservationSlotSummary court={court} date={date} startTime={startTime} endTime={endTime} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-semibold">Deporte<FormSelect name="sportId" defaultValue={defaultSportId ?? court.sports[0]?.id ?? ''} options={court.sports.map((sport) => ({ value: sport.id, label: sport.name }))} /><FieldError state={state} field="sportId" /></label>
        <label className="space-y-1.5 text-sm font-semibold">Duración<FormSelect name="blocks" value={String(blocks)} onValueChange={(value) => setBlocks(Number(value))} options={[{ value: '1', label: '1 hora' }, { value: '2', label: '2 horas' }, { value: '3', label: '3 horas' }, { value: '4', label: '4 horas' }]} /><FieldError state={state} field="blocks" /></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-semibold">Nombre del cliente<Input name="customerName" placeholder="Ej. Carlos Quispe" className={inputClass} autoComplete="off" /><FieldError state={state} field="customerName" /></label><label className="space-y-1.5 text-sm font-semibold">Teléfono<Input name="customerPhone" placeholder="999 999 999" className={inputClass} inputMode="tel" autoComplete="off" /><FieldError state={state} field="customerPhone" /></label></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-semibold">Canal<FormSelect name="channel" defaultValue="whatsapp" options={[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'presencial', label: 'Presencial' }]} /></label><label className="space-y-1.5 text-sm font-semibold">Estado<FormSelect name="status" defaultValue="confirmada" options={[{ value: 'confirmada', label: 'Confirmada' }, { value: 'pendiente_pago', label: 'Pendiente de pago' }]} /></label></div>
      <label className="block space-y-1.5 text-sm font-semibold">Nota <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="notes" placeholder="Detalles de la reserva" className="min-h-20 rounded-xl bg-background" /></label>
      <Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Registrar reserva" />
    </form>
  )
}

export function MaintenanceForm({ localId, date, court, startTime, endTime, onCancel, onSuccess }: { localId: string; date: string; court: AgendaCourt; startTime: string; endTime: string; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(createMaintenanceAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="localId" value={localId} /><input type="hidden" name="courtId" value={court.id} /><input type="hidden" name="date" value={date} />
      <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm"><span className="font-bold">{court.name}</span><span className="text-muted-foreground"> · {date}</span></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-semibold">Desde<Input type="time" name="startTime" defaultValue={startTime} className={inputClass} step="3600" /><FieldError state={state} field="startTime" /></label><label className="space-y-1.5 text-sm font-semibold">Hasta<Input type="time" name="endTime" defaultValue={endTime} className={inputClass} step="3600" /><FieldError state={state} field="endTime" /></label></div>
      <label className="block space-y-1.5 text-sm font-semibold">Motivo <span className="font-normal text-muted-foreground">(opcional)</span><Input name="reason" placeholder="Limpieza, reparación…" className={inputClass} /></label>
      <p className="text-xs text-muted-foreground">El bloqueo se aplica al rango completo y no permite reservas activas durante ese horario.</p><Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Bloquear horario" />
    </form>
  )
}

export function EncasedBookingForm({ localId, date, startTime, sportOptions, defaultSportId, onCancel, onSuccess }: { localId: string; date: string; startTime: string; sportOptions: Array<{ id: string; name: string }>; defaultSportId?: string; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(createEncasedBookingAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="localId" value={localId} /><input type="hidden" name="date" value={date} /><input type="hidden" name="time" value={startTime} />
      <div className="rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm">Inicio excepcional: <span className="font-bold">{startTime}</span> · duración fija de 90 minutos.</div>
      <label className="block space-y-1.5 text-sm font-semibold">Deporte<FormSelect name="sportId" defaultValue={defaultSportId ?? sportOptions[0]?.id ?? ''} options={sportOptions.map((sport) => ({ value: sport.id, label: sport.name }))} /><FieldError state={state} field="sportId" /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-semibold">Nombre del cliente<Input name="customerName" placeholder="Ej. Carlos Quispe" className={inputClass} autoComplete="off" /><FieldError state={state} field="customerName" /></label><label className="space-y-1.5 text-sm font-semibold">Teléfono<Input name="customerPhone" placeholder="999 999 999" className={inputClass} inputMode="tel" autoComplete="off" /><FieldError state={state} field="customerPhone" /></label></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-semibold">Canal<FormSelect name="channel" defaultValue="whatsapp" options={[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'presencial', label: 'Presencial' }]} /></label><label className="space-y-1.5 text-sm font-semibold">Estado<FormSelect name="status" defaultValue="confirmada" options={[{ value: 'confirmada', label: 'Confirmada' }, { value: 'pendiente_pago', label: 'Pendiente de pago' }]} /></label></div>
      <label className="block space-y-1.5 text-sm font-semibold">Nota <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="notes" placeholder="Detalles de la reserva" className="min-h-20 rounded-xl bg-background" /></label>
      <Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Registrar 90 minutos" />
    </form>
  )
}

export function ExtendReservationForm({ reservationId, onCancel, onSuccess }: { reservationId: string; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(extendReservationAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="reservationId" value={reservationId} />
      <div className="rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm">Se añadirá exactamente <span className="font-bold">30 minutos</span> al final de la reserva. Solo se autoriza si el siguiente tramo está libre.</div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-semibold">Cobro<FormSelect name="chargeStatus" defaultValue="pendiente" options={[{ value: 'pendiente', label: 'Pendiente' }, { value: 'cobrado', label: 'Cobrado' }]} /></label><label className="space-y-1.5 text-sm font-semibold">Medio <span className="font-normal text-muted-foreground">(opcional)</span><Input name="paymentMethod" placeholder="Yape, efectivo…" className={inputClass} /></label></div>
      <label className="block space-y-1.5 text-sm font-semibold">Nota <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="notes" placeholder="Acuerdo con el cliente" className="min-h-20 rounded-xl bg-background" /></label>
      <Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Autorizar +30 min" />
    </form>
  )
}

export function ConfirmReservationForm({ reservationId, onCancel, onSuccess }: { reservationId: string; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(confirmReservationAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="reservationId" value={reservationId} />
      <p className="text-xs text-muted-foreground">Confirma que el comprobante corresponde al monto solicitado antes de aprobar esta reserva.</p>
      <Feedback state={state} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <Button type="submit" disabled={pending}>{pending ? <Spinner /> : <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} />} Confirmar reserva</Button>
      </div>
    </form>
  )
}

export function RejectReservationForm({ reservationId, onCancel, onSuccess }: { reservationId: string; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(rejectReservationAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="reservationId" value={reservationId} />
      <label className="block space-y-1.5 text-sm font-semibold">Motivo<FormSelect name="reason" defaultValue="pago_no_recibido" options={[{ value: 'pago_no_recibido', label: 'Pago no recibido' }, { value: 'monto_incorrecto', label: 'Monto incorrecto' }, { value: 'comprobante_ilegible', label: 'Comprobante ilegible' }, { value: 'datos_no_coinciden', label: 'Datos no coinciden' }, { value: 'otro', label: 'Otro motivo' }]} /></label>
      <label className="block space-y-1.5 text-sm font-semibold">Comentario <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="comment" placeholder="Indica qué debe corregir el cliente" className="min-h-20 rounded-xl bg-background" /></label>
      <Feedback state={state} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <Button type="submit" variant="destructive" disabled={pending}>{pending ? <Spinner /> : <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />} Rechazar comprobante</Button>
      </div>
    </form>
  )
}

export function RescheduleReservationForm({ reservationId, court, date, time, onCancel, onSuccess }: { reservationId: string; court: AgendaCourt; date: string; time: string; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(rescheduleReservationAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  return <form action={action} className="space-y-4"><input type="hidden" name="reservationId" value={reservationId} /><input type="hidden" name="courtId" value={court.id} /><input type="hidden" name="date" value={date} /><input type="hidden" name="time" value={time} /><div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm">Destino: <strong>{court.name}</strong> · <strong>{formatReservationDate(date)}</strong> · <strong>{time}</strong>. Se conserva la duración y el deporte.</div><p className="text-xs text-muted-foreground">El servidor vuelve a comprobar horario, deporte, mantenimiento y cruces antes de moverla.</p><Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Confirmar reprogramación" /></form>
}

export function CancelReservationForm({ reservationId, canCancelAsClient, onCancel, onSuccess }: { reservationId: string; canCancelAsClient: boolean; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(cancelReservationAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  const statusOptions = canCancelAsClient ? [{ value: 'cancelada_cliente', label: 'Cancelada por el cliente' }, { value: 'cancelada_local', label: 'Cancelada por el local' }] : [{ value: 'cancelada_local', label: 'Cancelada por el local' }]
  return <form action={action} className="space-y-4"><input type="hidden" name="reservationId" value={reservationId} /><p className="rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-sm">La cancelación queda registrada para auditoría. Si es futura, libera este horario de inmediato.</p><label className="block space-y-1.5 text-sm font-semibold">Responsable<FormSelect name="status" defaultValue={statusOptions[0].value} options={statusOptions} /></label><label className="block space-y-1.5 text-sm font-semibold">Reembolso <span className="font-normal text-muted-foreground">(solo seguimiento)</span><FormSelect name="refundStatus" defaultValue="no_aplica" options={[{ value: 'no_aplica', label: 'No aplica' }, { value: 'solicitado', label: 'Solicitado' }, { value: 'aprobado', label: 'Gestionado / aprobado' }, { value: 'rechazado', label: 'No corresponde' }]} /></label><label className="block space-y-1.5 text-sm font-semibold">Motivo <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="reason" maxLength={500} className="min-h-20 rounded-xl bg-background" placeholder="Qué ocurrió" /></label><Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Registrar cancelación" /></form>
}

export function NoShowReservationForm({ reservationId, onCancel, onSuccess }: { reservationId: string; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(markNoShowReservationAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  return <form action={action} className="space-y-4"><input type="hidden" name="reservationId" value={reservationId} /><p className="rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-sm">Solo registra inasistencia si la reserva confirmada ya empezó. Esta acción deja trazabilidad para reportes.</p><label className="block space-y-1.5 text-sm font-semibold">Nota <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="reason" maxLength={500} className="min-h-20 rounded-xl bg-background" placeholder="Ej. El equipo no se presentó" /></label><Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Registrar inasistencia" /></form>
}

export function PaymentMovementForm({ reservationId, outstandingAmount, onCancel, onSuccess }: { reservationId: string; outstandingAmount?: number; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(registerPaymentMovementAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  return <form action={action} className="space-y-4"><input type="hidden" name="reservationId" value={reservationId} /><p className="rounded-xl border bg-muted/45 px-3 py-2 text-sm">Registro interno: no envía ni verifica dinero. {typeof outstandingAmount === 'number' && <><br />Falta por cobrar: <strong>S/ {outstandingAmount.toFixed(2)}</strong>.</>}</p><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-semibold">Concepto<FormSelect name="type" defaultValue="saldo" options={[{ value: 'adelanto', label: 'Adelanto recibido' }, { value: 'saldo', label: 'Saldo recibido' }]} /></label><label className="space-y-1.5 text-sm font-semibold">Monto<Input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" className={inputClass} /><FieldError state={state} field="amount" /></label></div><label className="block space-y-1.5 text-sm font-semibold">Medio <span className="font-normal text-muted-foreground">(opcional)</span><Input name="method" maxLength={60} placeholder="Efectivo, Yape…" className={inputClass} /></label><label className="block space-y-1.5 text-sm font-semibold">Nota <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="notes" maxLength={300} className="min-h-20 rounded-xl bg-background" /></label><Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Guardar movimiento" /></form>
}
