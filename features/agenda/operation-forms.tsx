'use client'

import { useActionState, useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { notify } from '@/lib/notifications/notify'
import { ClientPicker, type PickedClient } from '@/features/clients/client-picker'
import { createClient } from '@/utils/supabase/client'
import { ArrowDown01Icon, Building03Icon, Calendar03Icon, Cancel01Icon, CheckmarkCircle01Icon, Clock01Icon, Edit02Icon, FootballIcon, Layers01Icon, RulerIcon } from '@hugeicons/core-free-icons'
import { localDateTimeToIso, minutesToTime, timeToMinutes } from './date-utils'
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

export function useAgendaFeedback(state: AgendaActionState, onSuccess: () => void) {
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

function FormActions({ pending, onCancel, label, disabled = false }: { pending: boolean; onCancel: () => void; label: string; disabled?: boolean }) {
  return <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>Cancelar</Button><Button type="submit" disabled={pending || disabled}>{pending && <Spinner />}{label}</Button></div>
}

const inputClass = 'h-10 rounded-xl bg-background'

type SelectOption = { value: string; label: string }

function FormSelect({ name, options, value, defaultValue, onValueChange, placeholder, triggerClassName }: { name?: string; options: SelectOption[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; placeholder?: string; triggerClassName?: string }) {
  return <Select name={name} value={value} defaultValue={defaultValue} onValueChange={onValueChange}><SelectTrigger className={`w-full ${triggerClassName ?? ''}`}><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent position="popper" align="start">{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
}

function formatReservationDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00Z`))
}

function ReservationSlotSummary({ court, date, startTime, endTime, editingSchedule = false, onToggleScheduleEditing, minDate, timeOptions, onScheduleChange, dateError, timeError }: { court: AgendaCourt; date: string; startTime: string; endTime: string; editingSchedule?: boolean; onToggleScheduleEditing?: () => void; minDate?: string; timeOptions?: SelectOption[]; onScheduleChange?: (selection: { date: string; startTime: string }) => void; dateError?: string; timeError?: string }) {
  const dimensions = court.lengthMeters && court.widthMeters ? `${court.lengthMeters} × ${court.widthMeters} m` : null

  return <div className="space-y-2.5">
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-xl border bg-muted/45 px-3 py-2.5"><div className="flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-muted-foreground"><span className="flex items-center gap-2"><HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5 text-primary" /> Fecha</span>{onToggleScheduleEditing && <Button type="button" variant="ghost" size="icon-sm" className="-mr-1 -mt-1 size-7" aria-label={editingSchedule ? 'Terminar edición de fecha y horario' : 'Editar fecha y horario'} title={editingSchedule ? 'Listo' : 'Editar fecha y horario'} onClick={onToggleScheduleEditing}><HugeiconsIcon icon={editingSchedule ? CheckmarkCircle01Icon : Edit02Icon} strokeWidth={2} className="size-3.5" /></Button>}</div>{editingSchedule && onScheduleChange && minDate ? <><Input type="date" value={date} min={minDate} onChange={(event) => onScheduleChange({ date: event.target.value, startTime })} className="mt-1 h-8 bg-background px-2 text-xs" /><FieldError state={{ success: false, fieldErrors: { date: dateError ? [dateError] : undefined } }} field="date" /></> : <p className="mt-1 capitalize text-sm font-extrabold">{formatReservationDate(date)}</p>}</div>
      <div className="rounded-xl bg-secondary px-3 py-2.5 text-secondary-foreground"><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-secondary-foreground/65"><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5 text-primary" /> Horario</div>{editingSchedule && onScheduleChange && timeOptions ? <><FormSelect value={startTime} onValueChange={(value) => onScheduleChange({ date, startTime: value })} options={timeOptions} triggerClassName="mt-1 h-8 border-secondary-foreground/20 bg-secondary-foreground/10 px-2 text-xs text-secondary-foreground hover:bg-secondary-foreground/15" /><FieldError state={{ success: false, fieldErrors: { time: timeError ? [timeError] : undefined } }} field="time" /></> : <p className="mt-1 text-sm font-extrabold tabular-nums">{startTime} <span className="text-primary">—</span> {endTime}</p>}</div>
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

type ManualQuoteLine = { start: string; end: string; hourlyPrice: number; subtotal: number; recurringRuleName: string | null; promotionName: string | null }
type ManualQuote = { total: number; suggestedAdvance: number; lines: ManualQuoteLine[] }

function parseManualQuoteLines(value: unknown): ManualQuoteLine[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((line) => {
    if (!line || typeof line !== 'object' || Array.isArray(line)) return []
    const record = line as Record<string, unknown>
    const hourlyPrice = Number(record.precio_por_hora)
    const subtotal = Number(record.subtotal)
    if (typeof record.inicio !== 'string' || typeof record.fin !== 'string' || !Number.isFinite(hourlyPrice) || !Number.isFinite(subtotal)) return []
    return [{ start: record.inicio, end: record.fin, hourlyPrice, subtotal, recurringRuleName: typeof record.regla_recurrente_nombre === 'string' ? record.regla_recurrente_nombre : null, promotionName: typeof record.promocion_nombre === 'string' ? record.promocion_nombre : null }]
  })
}

function formatManualAmount(value: number) {
  return `S/ ${value.toFixed(2)}`
}

function formatManualTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' }).format(new Date(value))
}

function quoteLineLabel(line: ManualQuoteLine) {
  if (line.promotionName) return `Promoción · ${line.promotionName}`
  if (line.recurringRuleName) return `Tarifa recurrente · ${line.recurringRuleName}`
  return 'Tarifa base'
}

function ManualPriceBreakdown({ quote }: { quote: ManualQuote }) {
  return <details className="group rounded-xl border bg-muted/25"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-bold"><span>Ver desglose del precio</span><span className="flex items-center gap-2 text-foreground"><span>{formatManualAmount(quote.total)}</span><HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4 text-muted-foreground transition-transform group-open:rotate-180" /></span></summary><div className="space-y-2 border-t px-3 py-3">{quote.lines.map((line) => <div key={`${line.start}-${line.end}`} className="flex items-start justify-between gap-3 text-xs"><div><p className="font-bold text-foreground">{formatManualTime(line.start)}–{formatManualTime(line.end)} · {formatManualAmount(line.hourlyPrice)}/h</p><p className="mt-0.5 text-muted-foreground">{quoteLineLabel(line)}</p></div><span className="shrink-0 font-extrabold text-foreground">{formatManualAmount(line.subtotal)}</span></div>)}<div className="flex justify-between border-t pt-2 text-xs font-extrabold"><span>Total</span><span>{formatManualAmount(quote.total)}</span></div></div></details>
}

export function ManualAdvanceField({ localId, courtId, sportId, date, startTime, durationMinutes, state }: { localId: string; courtId: string; sportId: string; date: string; startTime: string; durationMinutes: number; state: AgendaActionState }) {
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<ManualQuote | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  useEffect(() => {
    const start = localDateTimeToIso(date, startTime)
    if (!start || !sportId) return

    let active = true
    const supabase = createClient()
    void supabase.rpc('cotizar_reserva_manual_detallada_dueno', {
      p_local_id: localId,
      p_cancha_id: courtId,
      p_deporte_id: sportId,
      p_inicio: start,
      p_duracion_minutos: durationMinutes,
    }).then(({ data, error }) => {
      if (!active) return
      const result = data?.[0]
      const suggestedAdvance = Number(result?.monto_adelanto_sugerido)
      const total = Number(result?.monto_total)
      if (error || !result || !Number.isFinite(suggestedAdvance) || !Number.isFinite(total)) {
        setQuoteError('No pudimos calcular el adelanto sugerido. Ajusta el horario o inténtalo de nuevo.')
        return
      }
      setQuote({ total, suggestedAdvance, lines: parseManualQuoteLines(result.detalle_tarifario) })
      setAmount(suggestedAdvance.toFixed(2))
    })
    return () => { active = false }
  }, [courtId, date, durationMinutes, localId, sportId, startTime])

  return <div className="space-y-3"><label className="block space-y-1.5 text-sm font-semibold">Adelanto recibido<div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm text-muted-foreground">S/</span><Input name="advanceAmount" type="number" min="0.01" max={quote?.total} step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={quote ? quote.suggestedAdvance.toFixed(2) : 'Calculando…'} className={`${inputClass} pl-9`} required /></div>{quote ? <p className="text-xs font-normal leading-5 text-muted-foreground">Sugerido por Grassly: <strong className="text-foreground">{formatManualAmount(quote.suggestedAdvance)}</strong> de {formatManualAmount(quote.total)}. Puedes ajustarlo para este acuerdo directo.</p> : <p className="text-xs font-normal text-muted-foreground">{quoteError ?? 'Calculando el adelanto según la tarifa y reglas vigentes…'}</p>}<FieldError state={state} field="advanceAmount" /></label>{quote && <ManualPriceBreakdown quote={quote} />}</div>
}

export function ManualBookingForm({
  localId,
  date,
  court,
  startTime,
  blocks,
  timeOptions,
  minDate,
  defaultSportId,
  initialClient,
  onScheduleChange,
  onCancel,
  onSuccess,
}: {
  localId: string
  date: string
  court: AgendaCourt
  startTime: string
  blocks: number
  timeOptions: SelectOption[]
  minDate: string
  defaultSportId?: string
  initialClient?: PickedClient | null
  onScheduleChange: (selection: { date: string; startTime: string; blocks: number }) => void
  onCancel: () => void
  onSuccess: () => void
}) {
  const [state, action, pending] = useActionState(createManualBookingAction, initialAgendaActionState)
  const [editingSchedule, setEditingSchedule] = useState(false)
  const [sportId, setSportId] = useState(defaultSportId ?? court.sports[0]?.id ?? '')
  const [clientBlocked, setClientBlocked] = useState(false)
  useAgendaFeedback(state, onSuccess)
  const endTime = minutesToTime(timeToMinutes(startTime) + blocks * 60)
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="localId" value={localId} /><input type="hidden" name="courtId" value={court.id} /><input type="hidden" name="date" value={date} /><input type="hidden" name="time" value={startTime} />
      <ReservationSlotSummary court={court} date={date} startTime={startTime} endTime={endTime} editingSchedule={editingSchedule} onToggleScheduleEditing={() => setEditingSchedule((value) => !value)} minDate={minDate} timeOptions={timeOptions} onScheduleChange={(selection) => onScheduleChange({ ...selection, blocks })} dateError={state.fieldErrors?.date?.[0]} timeError={state.fieldErrors?.time?.[0]} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-semibold">Deporte<FormSelect name="sportId" value={sportId} onValueChange={setSportId} options={court.sports.map((sport) => ({ value: sport.id, label: sport.name }))} /><FieldError state={state} field="sportId" /></label>
        <label className="space-y-1.5 text-sm font-semibold">Duración<FormSelect name="blocks" value={String(blocks)} onValueChange={(value) => onScheduleChange({ date, startTime, blocks: Number(value) })} options={[{ value: '1', label: '1 hora' }, { value: '2', label: '2 horas' }, { value: '3', label: '3 horas' }, { value: '4', label: '4 horas' }]} /><FieldError state={state} field="blocks" /></label>
      </div>
      <ClientPicker localId={localId} state={state} onBlockedChange={setClientBlocked} initial={initialClient} />
      <ManualAdvanceField key={`${court.id}-${sportId}-${date}-${startTime}-${blocks}`} localId={localId} courtId={court.id} sportId={sportId} date={date} startTime={startTime} durationMinutes={blocks * 60} state={state} />
      <label className="block space-y-1.5 text-sm font-semibold">Canal<FormSelect name="channel" defaultValue="whatsapp" options={[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'presencial', label: 'Presencial' }]} /></label>
      <p className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs leading-5 text-foreground">Al guardar, la reserva quedará <strong>confirmada</strong> y el adelanto se registrará en su historial de cobros.</p>
      <label className="block space-y-1.5 text-sm font-semibold">Nota <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="notes" placeholder="Detalles de la reserva" className="min-h-20 rounded-xl bg-background" /></label>
      <Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Registrar reserva" disabled={clientBlocked} />
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

export function EncasedBookingForm({ localId, court, date, startTime, sportOptions, defaultSportId, onCancel, onSuccess }: { localId: string; court: AgendaCourt; date: string; startTime: string; sportOptions: Array<{ id: string; name: string }>; defaultSportId?: string; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(createEncasedBookingAction, initialAgendaActionState)
  const [sportId, setSportId] = useState(defaultSportId ?? sportOptions[0]?.id ?? '')
  const [clientBlocked, setClientBlocked] = useState(false)
  useAgendaFeedback(state, onSuccess)
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="localId" value={localId} /><input type="hidden" name="courtId" value={court.id} /><input type="hidden" name="date" value={date} /><input type="hidden" name="time" value={startTime} />
      <div className="rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm">Inicio excepcional: <span className="font-bold">{startTime}</span> · duración fija de 90 minutos.</div>
      <label className="block space-y-1.5 text-sm font-semibold">Deporte<FormSelect name="sportId" value={sportId} onValueChange={setSportId} options={sportOptions.map((sport) => ({ value: sport.id, label: sport.name }))} /><FieldError state={state} field="sportId" /></label>
      <ClientPicker localId={localId} state={state} onBlockedChange={setClientBlocked} />
      <ManualAdvanceField key={`${court.id}-${sportId}-${date}-${startTime}-90`} localId={localId} courtId={court.id} sportId={sportId} date={date} startTime={startTime} durationMinutes={90} state={state} />
      <label className="block space-y-1.5 text-sm font-semibold">Canal<FormSelect name="channel" defaultValue="whatsapp" options={[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'presencial', label: 'Presencial' }]} /></label>
      <p className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs leading-5 text-foreground">Al guardar, la reserva quedará <strong>confirmada</strong> y el adelanto se registrará en su historial de cobros.</p>
      <label className="block space-y-1.5 text-sm font-semibold">Nota <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="notes" placeholder="Detalles de la reserva" className="min-h-20 rounded-xl bg-background" /></label>
      <Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Registrar 90 minutos" disabled={clientBlocked} />
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
