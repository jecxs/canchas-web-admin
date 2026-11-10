'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { notify } from '@/lib/notifications/notify'
import { ClientPicker, type PickedClient } from '@/features/clients/client-picker'
import { createClient } from '@/utils/supabase/client'
import { paymentMethodOptionLabel, type LocalPaymentMethod } from '@/features/payments/types'
import { ArrowDown01Icon, Building03Icon, Calendar03Icon, Cancel01Icon, CheckmarkCircle01Icon, Clock01Icon, Edit02Icon, FootballIcon, Layers01Icon, RulerIcon } from '@hugeicons/core-free-icons'
import { localDateTimeToIso, minutesToTime, timeToMinutes } from './date-utils'
import {
  applySpecialPriceAction,
  addHourToReservationAction,
  confirmReservationAction,
  cancelReservationAction,
  createEncasedBookingAction,
  createMaintenanceAction,
  createManualBookingAction,
  extendReservationAction,
  quoteHourExtensionAction,
  revertHourExtensionAction,
  markNoShowReservationAction,
  registerPaymentMovementAction,
  rejectReservationAction,
  rescheduleReservationAction,
  updateReservationPublicNameAction,
} from './actions'
import type { HourExtensionQuote } from './actions'
import { initialAgendaActionState, type AgendaActionState, type AgendaCourt } from './types'

function Feedback({ state }: { state: AgendaActionState }) {
  if (!state.message || state.success || state.message !== 'Revisa los campos indicados') return null
  return <p role="alert" className="text-xs font-semibold text-destructive">{state.message}</p>
}

export function useAgendaFeedback(state: AgendaActionState, onSuccess: () => void) {
  const processedState = useRef<AgendaActionState | null>(null)
  useEffect(() => {
    if (!state.message || processedState.current === state) return
    processedState.current = state
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

function FormSelect({ name, options, value, defaultValue, onValueChange, open, onOpenChange, placeholder, triggerClassName }: { name?: string; options: SelectOption[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; open?: boolean; onOpenChange?: (open: boolean) => void; placeholder?: string; triggerClassName?: string }) {
  return <Select name={name} value={value} defaultValue={defaultValue} onValueChange={onValueChange} open={open} onOpenChange={onOpenChange}><SelectTrigger className={`w-full ${triggerClassName ?? ''}`}><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent position="popper" align="start">{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
}

function PaymentMethodSelect({ methods, state, label = 'Medio de cobro', required = true }: { methods: LocalPaymentMethod[]; state: AgendaActionState; label?: string; required?: boolean }) {
  return <label className="block space-y-1.5 text-sm font-semibold">{label}<FormSelect name="paymentMethodId" defaultValue={methods[0]?.id} placeholder="Selecciona un medio" options={methods.map((method) => ({ value: method.id, label: paymentMethodOptionLabel(method) }))} /><FieldError state={state} field="paymentMethodId" />{methods.length === 0 && <p className="text-xs font-normal text-destructive">Activa al menos un medio de cobro en Configuración.</p>} {!required && <span className="sr-only">Opcional</span>}</label>
}

function BookingOriginField() {
  return <fieldset className="space-y-2">
    <legend className="text-sm font-semibold">Origen de la reserva</legend>
    <div className="flex gap-2">
      {[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'presencial', label: 'Presencial' }].map((option) => <label key={option.value} className="min-w-0 flex-1 cursor-pointer">
        <input type="radio" name="channel" value={option.value} defaultChecked={option.value === 'whatsapp'} required className="peer sr-only" />
        <span className="flex h-10 items-center justify-center rounded-full border bg-background px-3 text-sm font-semibold transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">{option.label}</span>
      </label>)}
    </div>
  </fieldset>
}

function BookingNoteField({ state }: { state: AgendaActionState }) {
  return <details className="group rounded-xl border bg-background" open={Boolean(state.fieldErrors?.notes?.length) || undefined}>
    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-semibold">Añadir nota <span className="text-xs font-normal text-muted-foreground">Opcional</span></summary>
    <div className="border-t px-3 py-3"><Textarea name="notes" aria-label="Nota de la reserva" maxLength={500} placeholder="Detalles de la reserva" className="min-h-16 rounded-xl bg-background" /><FieldError state={state} field="notes" /></div>
  </details>
}

function formatReservationDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00Z`))
}

function ReservationSlotSummary({
  court,
  date,
  startTime,
  endTime,
  blocks,
  minDate,
  timeOptions,
  onScheduleChange,
  dateError,
  timeError,
}: {
  court: AgendaCourt
  date: string
  startTime: string
  endTime: string
  blocks: number
  minDate?: string
  timeOptions?: SelectOption[]
  onScheduleChange?: (selection: { date: string; startTime: string; blocks?: number }) => void
  dateError?: string
  timeError?: string
}) {
  const dimensions = court.lengthMeters && court.widthMeters ? `${court.lengthMeters} × ${court.widthMeters} m` : null
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [editingDate, setEditingDate] = useState(false)
  const [editingTime, setEditingTime] = useState(false)

  useEffect(() => {
    if (!editingDate) return
    const frame = window.requestAnimationFrame(() => {
      const input = dateInputRef.current
      if (!input) return
      input.focus()
      input.showPicker?.()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [editingDate])

  function toggleDateEditing() {
    setEditingTime(false)
    setEditingDate((value) => !value)
  }

  function toggleTimeEditing() {
    setEditingDate(false)
    setEditingTime((value) => !value)
  }

  return <div className="space-y-2.5">
    <details className="group rounded-xl border bg-background">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5"><span className="flex min-w-0 items-center gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-4" /></span><span className="min-w-0"><span className="block text-[10px] font-extrabold uppercase tracking-[.1em] text-muted-foreground">Cancha</span><span className="block truncate text-sm font-extrabold">{court.name}</span></span></span><span className="grid size-7 shrink-0 place-items-center rounded-lg border text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-label="Mostrar información de la cancha"><HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4" /></span></summary>
      <div className="grid gap-2 border-t px-3 py-3 text-xs text-muted-foreground sm:grid-cols-2">
        <div className="flex items-start gap-2"><HugeiconsIcon icon={FootballIcon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0 text-primary" /><span><strong className="block text-foreground">Deportes</strong>{court.sports.map((sport) => sport.name).join(' · ') || 'Sin deporte configurado'}</span></div>
        {court.surface && <div className="flex items-start gap-2"><HugeiconsIcon icon={Layers01Icon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0 text-primary" /><span><strong className="block text-foreground">Superficie</strong>{court.surface}</span></div>}
        {dimensions && <div className="flex items-start gap-2"><HugeiconsIcon icon={RulerIcon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0 text-primary" /><span><strong className="block text-foreground">Medidas</strong>{dimensions}</span></div>}
        {court.description && <p className="border-t pt-2 sm:col-span-2">{court.description}</p>}
      </div>
    </details>
    <div className="grid gap-2 sm:grid-cols-2">
      <div
          className="rounded-xl border bg-muted/45 px-3 py-2.5"
      >
        <div className="flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-muted-foreground">
          <span className="flex items-center gap-2">
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5 text-primary" />
            Fecha
          </span>
          {onScheduleChange && (
              <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="-mr-1 -mt-1 size-8 rounded-lg border border-foreground/45 bg-background text-foreground shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/75 hover:bg-foreground/5 hover:shadow-md hover:shadow-foreground/10"
                  aria-label={editingDate ? 'Cerrar calendario' : 'Elegir fecha en el calendario'}
                  title={editingDate ? 'Listo' : 'Elegir fecha'}
                  onClick={toggleDateEditing}
              >
                <HugeiconsIcon icon={editingDate ? CheckmarkCircle01Icon : Edit02Icon} strokeWidth={2} className="size-3.5" />
              </Button>
          )}
        </div>
        {editingDate && onScheduleChange && minDate ? (
            <>
              <Input
                  ref={dateInputRef}
                  type="date"
                  value={date}
                  min={minDate}
                  onChange={(event) => {
                    if (!event.target.value) return
                    onScheduleChange({ date: event.target.value, startTime })
                    setEditingDate(false)
                  }}
                  onClick={(event) => event.currentTarget.showPicker?.()}
                  className="mt-1 h-8 cursor-pointer rounded-full border-primary/25 bg-background px-3 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/10 focus-visible:ring-2 focus-visible:ring-primary/45"
              />
              <FieldError state={{ success: false, fieldErrors: { date: dateError ? [dateError] : undefined } }} field="date" />
            </>
        ) : <p className="mt-1 capitalize text-sm font-extrabold">{formatReservationDate(date)}</p>}
      </div>
      <div
          className="rounded-xl bg-secondary px-3 py-2.5 text-secondary-foreground"
      >
        <div className="flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-secondary-foreground/65">
          <span className="flex items-center gap-2">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5 text-primary" />
            Horario
          </span>
          {onScheduleChange && (
              <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="-mr-1 -mt-1 size-8 rounded-lg border border-primary/60 bg-secondary-foreground/10 text-primary transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-secondary-foreground/20 hover:text-primary hover:shadow-md hover:shadow-primary/20"
                  aria-label={editingTime ? 'Cerrar lista de horas' : 'Elegir hora de inicio'}
                  title={editingTime ? 'Listo' : 'Elegir hora de inicio'}
                  onClick={toggleTimeEditing}
              >
                <HugeiconsIcon icon={editingTime ? CheckmarkCircle01Icon : Edit02Icon} strokeWidth={2} className="size-3.5 text-primary" />
              </Button>
          )}
        </div>
        {editingTime && onScheduleChange && timeOptions ? (
            <>
              <div className="mt-1">
                <span className="mb-1 block text-[9px] font-extrabold uppercase tracking-[.08em] text-secondary-foreground/60">
                  Hora de inicio
                </span>
                <FormSelect
                    value={startTime}
                    open={editingTime}
                    onOpenChange={setEditingTime}
                    onValueChange={(value) => {
                      onScheduleChange({ date, startTime: value, blocks })
                      setEditingTime(false)
                    }}
                    options={timeOptions}
                    triggerClassName="h-8 w-full border-primary/70 bg-secondary-foreground/10 px-2 text-xs font-extrabold text-secondary-foreground hover:bg-secondary-foreground/15 [&_svg]:text-primary [&_svg]:opacity-100"
                />
              </div>
              <FieldError state={{ success: false, fieldErrors: { time: timeError ? [timeError] : undefined } }} field="time" />
            </>
        ) : <p className="mt-1 text-sm font-extrabold tabular-nums">{startTime} <span className="text-primary">—</span> {endTime}</p>}
      </div>
    </div>
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

export function ManualAdvanceField({ localId, courtId, sportId, date, startTime, durationMinutes, state, withoutAdvance, onWithoutAdvanceChange }: { localId: string; courtId: string; sportId: string; date: string; startTime: string; durationMinutes: number; state: AgendaActionState; withoutAdvance: boolean; onWithoutAdvanceChange: (value: boolean) => void }) {
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<ManualQuote | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [special, setSpecial] = useState(false)
  const [finalAmount, setFinalAmount] = useState('')

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
      setSpecial(false)
      setFinalAmount('')
    })
    return () => { active = false }
  }, [courtId, date, durationMinutes, localId, sportId, startTime])

  const effectiveTotal = special && Number(finalAmount) > 0 ? Math.min(Number(finalAmount), quote?.total ?? Number(finalAmount)) : quote?.total
  return <div className="space-y-3">
    {quote && <ManualPriceBreakdown quote={quote} />}
    <input type="hidden" name="quotedTotal" value={quote?.total ?? ''} />
    <FieldError state={state} field="quotedTotal" />
    <input type="hidden" name="withoutAdvance" value={withoutAdvance ? 'yes' : 'no'} />
    <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={special} onChange={(event) => { setSpecial(event.target.checked); setFinalAmount('') }} disabled={!quote} />Precio especial para esta reserva</label>
    {special && quote && <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
      <label className="block space-y-1 text-sm font-semibold">Precio final acordado<Input name="specialFinalAmount" type="number" min="0.01" max={quote.total - 0.01} step="0.01" value={finalAmount} onChange={(event) => setFinalAmount(event.target.value)} required className={inputClass} /><FieldError state={state} field="specialFinalAmount" /></label>
      <p className="text-xs text-muted-foreground">Tarifa {formatManualAmount(quote.total)} · descuento {formatManualAmount(Math.max(0, quote.total - Number(finalAmount || quote.total)))}</p>
      <label className="block space-y-1 text-sm font-semibold">Motivo privado<Textarea name="discountReason" minLength={3} maxLength={300} required placeholder="Ej. atención especial a cliente frecuente" className="min-h-16 rounded-xl bg-background" /><FieldError state={state} field="discountReason" /></label>
    </div>}
    <label className="flex items-center gap-2.5 text-sm font-semibold"><input type="checkbox" checked={withoutAdvance} onChange={(event) => onWithoutAdvanceChange(event.target.checked)} disabled={!quote} />Reservar sin adelanto</label>
    {withoutAdvance ? <><input type="hidden" name="advanceAmount" value="0" /><div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-xs"><span>Cobrado ahora: <strong>S/ 0.00</strong></span><span>Por cobrar: <strong>{effectiveTotal === undefined ? '—' : formatManualAmount(effectiveTotal)}</strong></span></div><FieldError state={state} field="advanceAmount" /></> : <label className="block space-y-1.5 text-sm font-semibold">Adelanto recibido<div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm text-muted-foreground">S/</span><Input name="advanceAmount" type="number" min="0.01" max={effectiveTotal} step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={quote ? quote.suggestedAdvance.toFixed(2) : 'Calculando…'} className={`${inputClass} pl-9`} required /></div>{quote ? <p className="text-xs font-normal leading-5 text-muted-foreground">Sugerido: <strong className="text-foreground">{formatManualAmount(quote.suggestedAdvance)}</strong> · puedes cambiarlo.</p> : <p className="text-xs font-normal text-muted-foreground">{quoteError ?? 'Calculando adelanto…'}</p>}<FieldError state={state} field="advanceAmount" /></label>}
  </div>
}

export function SpecialPriceForm({ reservationId, tariffAmount, currentTotal, paidAmount, advanceAmount, onCancel, onSuccess }: { reservationId: string; tariffAmount: number; currentTotal: number; paidAmount: number; advanceAmount: number; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(applySpecialPriceAction, initialAgendaActionState)
  const [amount, setAmount] = useState(currentTotal.toFixed(2))
  useAgendaFeedback(state, onSuccess)
  const parsed = Number(amount)
  const min = Math.max(paidAmount, advanceAmount, 0.01)
  return <form action={action} className="space-y-4">
    <input type="hidden" name="reservationId" value={reservationId} /><input type="hidden" name="expectedTotal" value={currentTotal} />
    <div className="rounded-xl bg-muted p-3 text-xs leading-6">Tarifa con ofertas: <strong>{formatManualAmount(tariffAmount)}</strong><br />Ya cobrado: <strong>{formatManualAmount(paidAmount)}</strong> · adelanto acordado: <strong>{formatManualAmount(advanceAmount)}</strong></div>
    <label className="block space-y-1.5 text-sm font-semibold">Nuevo precio final<Input name="finalAmount" type="number" min={min} max={tariffAmount} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required className={inputClass} /><FieldError state={state} field="finalAmount" /></label>
    {Number.isFinite(parsed) && parsed > 0 && <p className="text-xs text-muted-foreground">Descuento: {formatManualAmount(Math.max(0, tariffAmount - parsed))} · saldo luego del cambio: {formatManualAmount(Math.max(0, parsed - paidAmount))}</p>}
    <label className="block space-y-1.5 text-sm font-semibold">Motivo privado<Textarea name="reason" minLength={3} maxLength={300} required placeholder="Ej. cumpleaños de cliente frecuente" className="min-h-20 rounded-xl bg-background" /><FieldError state={state} field="reason" /></label>
    <p className="text-xs text-muted-foreground">El adelanto ya registrado se conserva. El descuento no crea un movimiento de caja.</p>
    <Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Guardar precio especial" disabled={parsed === currentTotal || parsed < min || parsed > tariffAmount} />
  </form>
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
  paymentMethods,
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
  paymentMethods: LocalPaymentMethod[]
  onScheduleChange: (selection: { date: string; startTime: string; blocks: number }) => void
  onCancel: () => void
  onSuccess: () => void
}) {
  const [state, action, pending] = useActionState(createManualBookingAction, initialAgendaActionState)
  const [sportId, setSportId] = useState(defaultSportId ?? court.sports[0]?.id ?? '')
  const [clientBlocked, setClientBlocked] = useState(false)
  const [withoutAdvance, setWithoutAdvance] = useState(false)
  useAgendaFeedback(state, onSuccess)
  const endTime = minutesToTime(timeToMinutes(startTime) + blocks * 60)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="localId" value={localId} /><input type="hidden" name="courtId" value={court.id} /><input type="hidden" name="date" value={date} /><input type="hidden" name="time" value={startTime} />
      <ReservationSlotSummary court={court} date={date} startTime={startTime} endTime={endTime} blocks={blocks} minDate={minDate} timeOptions={timeOptions} onScheduleChange={(selection) => onScheduleChange({ ...selection, blocks: selection.blocks ?? blocks })} dateError={state.fieldErrors?.date?.[0]} timeError={state.fieldErrors?.time?.[0]} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-semibold">Deporte<FormSelect name="sportId" value={sportId} onValueChange={setSportId} options={court.sports.map((sport) => ({ value: sport.id, label: sport.name }))} triggerClassName="transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/10" /><FieldError state={state} field="sportId" /></label>
        <label className="space-y-1.5 text-sm font-semibold">Duración<FormSelect name="blocks" value={String(blocks)} onValueChange={(value) => onScheduleChange({ date, startTime, blocks: Number(value) })} options={[{ value: '1', label: '1 hora' }, { value: '2', label: '2 horas' }, { value: '3', label: '3 horas' }, { value: '4', label: '4 horas' }]} triggerClassName="transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/10" /><FieldError state={state} field="blocks" /></label>
      </div>
      <ClientPicker localId={localId} state={state} onBlockedChange={setClientBlocked} initial={initialClient} />
      <label className="block space-y-1.5 text-sm font-semibold">Nombre visible en el horario <span className="font-normal text-muted-foreground">(opcional)</span><Input name="publicName" maxLength={40} placeholder="Equipo o apodo" className={inputClass} /><span className="block text-xs font-normal text-muted-foreground">Si queda vacío, se mostrará el primer nombre del cliente.</span><FieldError state={state} field="publicName" /></label>
      <ManualAdvanceField key={`${court.id}-${sportId}-${date}-${startTime}-${blocks}`} localId={localId} courtId={court.id} sportId={sportId} date={date} startTime={startTime} durationMinutes={blocks * 60} state={state} withoutAdvance={withoutAdvance} onWithoutAdvanceChange={setWithoutAdvance} />
      {!withoutAdvance && <PaymentMethodSelect methods={paymentMethods} state={state} label="Medio del adelanto" />}
      <BookingOriginField />
      <BookingNoteField state={state} />
      <p className="text-xs text-muted-foreground">{withoutAdvance ? 'Se guardará confirmada. El total quedará por cobrar.' : 'Se guardará confirmada y el adelanto quedará registrado como cobro.'}</p>
      <Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Registrar reserva" disabled={clientBlocked || (!withoutAdvance && paymentMethods.length === 0)} />
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

export function EncasedBookingForm({ localId, court, date, startTime, blocks, onBlocksChange, availableBlocks, sportOptions, defaultSportId, paymentMethods, onCancel, onSuccess }: { localId: string; court: AgendaCourt; date: string; startTime: string; blocks: number; onBlocksChange: (blocks: number) => void; availableBlocks: number[]; sportOptions: Array<{ id: string; name: string }>; defaultSportId?: string; paymentMethods: LocalPaymentMethod[]; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(createEncasedBookingAction, initialAgendaActionState)
  const [sportId, setSportId] = useState(defaultSportId ?? sportOptions[0]?.id ?? '')
  const [clientBlocked, setClientBlocked] = useState(false)
  const [withoutAdvance, setWithoutAdvance] = useState(false)
  useAgendaFeedback(state, onSuccess)
  const endTime = minutesToTime(timeToMinutes(startTime) + blocks * 60 + 30)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="localId" value={localId} /><input type="hidden" name="courtId" value={court.id} /><input type="hidden" name="date" value={date} /><input type="hidden" name="time" value={startTime} />
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-foreground px-4 py-3 text-background"><div><p className="text-[11px] font-bold uppercase tracking-widest text-background/65">Media hora liberada</p><p className="mt-1 text-sm font-semibold">{court.name} · {date}</p></div><span className="shrink-0 text-base font-extrabold tabular-nums">{startTime}–{endTime}</span></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm font-semibold">Deporte<FormSelect name="sportId" value={sportId} onValueChange={setSportId} options={sportOptions.map((sport) => ({ value: sport.id, label: sport.name }))} /><FieldError state={state} field="sportId" /></label>
        <label className="block space-y-1.5 text-sm font-semibold">Tiempo después de la media hora<FormSelect name="blocks" value={String(blocks)} onValueChange={(value) => onBlocksChange(Number(value))} options={availableBlocks.map((value) => ({ value: String(value), label: `+ ${value} ${value === 1 ? 'hora' : 'horas'} · ${value} h 30 min en total` }))} /><FieldError state={state} field="blocks" /></label>
      </div>
      {availableBlocks.length === 0 && <p role="status" className="rounded-xl bg-muted px-3 py-2 text-sm">No queda una hora completa libre después de esa media hora.</p>}
      <ClientPicker localId={localId} state={state} onBlockedChange={setClientBlocked} />
      <label className="block space-y-1.5 text-sm font-semibold">Nombre visible en el horario <span className="font-normal text-muted-foreground">(opcional)</span><Input name="publicName" maxLength={40} placeholder="Equipo o apodo" className={inputClass} /><span className="block text-xs font-normal text-muted-foreground">Si lo dejas vacío se mostrará el primer nombre del cliente.</span><FieldError state={state} field="publicName" /></label>
      <ManualAdvanceField key={`${court.id}-${sportId}-${date}-${startTime}-${blocks}`} localId={localId} courtId={court.id} sportId={sportId} date={date} startTime={startTime} durationMinutes={blocks * 60 + 30} state={state} withoutAdvance={withoutAdvance} onWithoutAdvanceChange={setWithoutAdvance} />
      {!withoutAdvance && <PaymentMethodSelect methods={paymentMethods} state={state} label="Medio del adelanto" />}
      <BookingOriginField />
      <BookingNoteField state={state} />
      <p className="text-xs text-muted-foreground">{withoutAdvance ? 'Se guardará confirmada. El total quedará por cobrar.' : 'Se guardará confirmada y el adelanto quedará registrado como cobro.'}</p>
      <Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Registrar reserva" disabled={availableBlocks.length === 0 || clientBlocked || (!withoutAdvance && paymentMethods.length === 0)} />
    </form>
  )
}

export function PublicNameForm({ reservationId, currentName, blocked, onCancel, onSuccess }: { reservationId: string; currentName?: string | null; blocked?: boolean; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(updateReservationPublicNameAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  return <form action={action} className="space-y-4">
    <input type="hidden" name="reservationId" value={reservationId} />
    <label className="block space-y-1.5 text-sm font-semibold">Nombre visible en el horario<Input name="publicName" defaultValue={currentName ?? ''} maxLength={40} placeholder="Primer nombre del cliente" className={inputClass} /><span className="block text-xs font-normal text-muted-foreground">Vacío muestra el primer nombre del cliente. El nombre y teléfono reales se conservan en el panel.</span><FieldError state={state} field="publicName" /></label>
    {blocked && <p className="rounded-xl bg-warning/10 px-3 py-2 text-xs">El nombre personalizado fue retirado. Si guardas uno nuevo, el cliente podrá volver a editarlo.</p>}
    <Feedback state={state} />
    <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>Volver</Button>
      {currentName && <Button type="submit" name="blockName" value="true" variant="destructive" disabled={pending}>Retirar apodo y bloquear edición</Button>}
      <Button type="submit" disabled={pending}>{pending && <Spinner />}Guardar nombre</Button>
    </div>
  </form>
}

export function ExtendReservationForm({ reservationId, paymentMethods, onCancel, onSuccess }: { reservationId: string; paymentMethods: LocalPaymentMethod[]; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(extendReservationAction, initialAgendaActionState)
  const [chargeStatus, setChargeStatus] = useState('pendiente')
  useAgendaFeedback(state, onSuccess)
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="reservationId" value={reservationId} />
      <div className="rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm">Se añadirá exactamente <span className="font-bold">30 minutos</span> al final de la reserva. Solo se autoriza si el siguiente tramo está libre.</div>
      <label className="block space-y-1.5 text-sm font-semibold">Cobro<FormSelect name="chargeStatus" value={chargeStatus} onValueChange={setChargeStatus} options={[{ value: 'pendiente', label: 'Pendiente' }, { value: 'cobrado', label: 'Cobrado ahora' }]} /></label>
      {chargeStatus === 'cobrado' && <PaymentMethodSelect methods={paymentMethods} state={state} />}
      <label className="block space-y-1.5 text-sm font-semibold">Nota <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="notes" placeholder="Acuerdo con el cliente" className="min-h-20 rounded-xl bg-background" /></label>
      <Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Autorizar +30 min" disabled={chargeStatus === 'cobrado' && paymentMethods.length === 0} />
    </form>
  )
}

function hourLabel(value: string) {
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))
}

export function AddHourReservationForm({ reservationId, currentTotal, paymentMethods, onCancel, onSuccess }: { reservationId: string; currentTotal: number; paymentMethods: LocalPaymentMethod[]; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(addHourToReservationAction, initialAgendaActionState)
  const [quote, setQuote] = useState<HourExtensionQuote | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [chargeNow, setChargeNow] = useState(false)
  useAgendaFeedback(state, onSuccess)
  useEffect(() => {
    let active = true
    quoteHourExtensionAction(reservationId).then((result) => {
      if (!active) return
      setQuote(result.quote ?? null)
      setQuoteError(result.message ?? null)
    }).catch(() => { if (active) setQuoteError('No se pudo cotizar la hora adicional.') })
    return () => { active = false }
  }, [reservationId])
  return <form action={action} className="space-y-4">
    <input type="hidden" name="reservationId" value={reservationId} />
    {quote && <><input type="hidden" name="expectedEnd" value={quote.oldEnd} /><input type="hidden" name="expectedTotal" value={currentTotal} />
      <div className="space-y-2 rounded-xl border bg-muted/45 px-3 py-3 text-sm">
        <p>La reserva terminará a las <strong>{hourLabel(quote.newEnd)}</strong> <span className="text-muted-foreground">(antes {hourLabel(quote.oldEnd)})</span>.</p>
        <div className="flex justify-between gap-3"><span>Esta hora cuesta</span><strong>S/ {quote.addedAmount.toFixed(2)}</strong></div>
        <div className="flex justify-between gap-3 border-t pt-2"><span>Nuevo total</span><strong>S/ {quote.newTotal.toFixed(2)}</strong></div>
        <p className="text-xs text-muted-foreground">Quedará por cobrar: S/ {quote.newOutstanding.toFixed(2)}</p>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chargeNow} onChange={(event) => setChargeNow(event.target.checked)} />Esta hora ya está pagada</label>
      {chargeNow && <PaymentMethodSelect methods={paymentMethods} state={state} />}
      <p className="text-xs text-muted-foreground">Si fue un error, puedes quitarla antes de que empiece, siempre que no haya un cobro por devolver.</p>
    </>}
    {!quote && <p className="text-sm text-muted-foreground">{quoteError ?? 'Calculando la hora adicional…'}</p>}
    <Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Añadir 1 hora" disabled={!quote || Boolean(quoteError) || (chargeNow && paymentMethods.length === 0)} />
  </form>
}

export function RevertHourReservationForm({ extensionId, amount, onCancel, onSuccess }: { extensionId: string; amount: number; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(revertHourExtensionAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  return <form action={action} className="space-y-4">
    <input type="hidden" name="hourExtensionId" value={extensionId} />
    <p className="rounded-xl border bg-muted/45 px-3 py-2.5 text-sm">Se quitará la última hora y se descontarán S/ {amount.toFixed(2)} del total.</p>
    <p className="text-xs text-muted-foreground">Si ya cobraste esa hora, primero resuelve la devolución.</p>
    <Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Quitar hora adicional" />
  </form>
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
  return <form action={action} className="space-y-4"><input type="hidden" name="reservationId" value={reservationId} /><p className="rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-sm">La cancelación queda registrada para auditoría. Si es futura, libera este horario de inmediato.</p><label className="block space-y-1.5 text-sm font-semibold">Responsable<FormSelect name="status" defaultValue={statusOptions[0].value} options={statusOptions} /></label><label className="block space-y-1.5 text-sm font-semibold">Reembolso <span className="font-normal text-muted-foreground">(un reembolso gestionado se descuenta en caja)</span><FormSelect name="refundStatus" defaultValue="no_aplica" options={[{ value: 'no_aplica', label: 'Sin reembolso' }, { value: 'aprobado', label: 'Reembolso gestionado' }, { value: 'rechazado', label: 'No corresponde' }]} /></label><label className="block space-y-1.5 text-sm font-semibold">Motivo <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="reason" maxLength={500} className="min-h-20 rounded-xl bg-background" placeholder="Qué ocurrió" /></label><Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Registrar cancelación" /></form>
}

export function NoShowReservationForm({ reservationId, onCancel, onSuccess }: { reservationId: string; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(markNoShowReservationAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  return <form action={action} className="space-y-4"><input type="hidden" name="reservationId" value={reservationId} /><p className="rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-sm">Solo registra inasistencia si la reserva confirmada ya empezó. Esta acción deja trazabilidad para reportes.</p><label className="block space-y-1.5 text-sm font-semibold">Nota <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="reason" maxLength={500} className="min-h-20 rounded-xl bg-background" placeholder="Ej. El equipo no se presentó" /></label><Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Registrar inasistencia" /></form>
}

export function PaymentMovementForm({ reservationId, outstandingAmount, paymentMethods, onCancel, onSuccess }: { reservationId: string; outstandingAmount?: number; paymentMethods: LocalPaymentMethod[]; onCancel: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(registerPaymentMovementAction, initialAgendaActionState)
  useAgendaFeedback(state, onSuccess)
  return <form action={action} className="space-y-4"><input type="hidden" name="reservationId" value={reservationId} /><p className="rounded-xl border bg-muted/45 px-3 py-2 text-sm">Este cobro se registrará en caja. {typeof outstandingAmount === 'number' && <>Falta por cobrar: <strong>S/ {outstandingAmount.toFixed(2)}</strong>.</>}</p><label className="block space-y-1.5 text-sm font-semibold">Monto<Input name="amount" type="number" min="0.01" max={outstandingAmount} step="0.01" inputMode="decimal" defaultValue={typeof outstandingAmount === 'number' && outstandingAmount > 0 ? outstandingAmount.toFixed(2) : undefined} placeholder="0.00" className={inputClass} /><FieldError state={state} field="amount" /></label><PaymentMethodSelect methods={paymentMethods} state={state} /><label className="block space-y-1.5 text-sm font-semibold">N.º de operación o referencia <span className="font-normal text-muted-foreground">(opcional)</span><Input name="reference" maxLength={80} placeholder="Ej. 004812" className={inputClass} /></label><label className="block space-y-1.5 text-sm font-semibold">Nota <span className="font-normal text-muted-foreground">(opcional)</span><Textarea name="notes" maxLength={300} className="min-h-20 rounded-xl bg-background" /></label><Feedback state={state} /><FormActions pending={pending} onCancel={onCancel} label="Registrar cobro" disabled={paymentMethods.length === 0 || (typeof outstandingAmount === 'number' && outstandingAmount <= 0)} /></form>
}
