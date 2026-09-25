'use client'

import { useActionState, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Clock01Icon,
  Delete02Icon,
  DiscountTag01Icon,
  Edit02Icon,
  Maximize02Icon,
  Minimize02Icon,
  Money03Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { notify } from '@/lib/notifications/notify'
import { cn } from '@/lib/utils'
import { SportIcon } from '@/features/courts/sport-icon'
import { deletePricingRuleAction, savePricingRuleAction } from './actions'
import {
  findPricingConflicts,
  formatHour,
  formatMoney,
  formatRuleDays,
  hourNumber,
  pricingDays,
  targetKey,
} from './rule-utils'
import {
  initialPricingActionState,
  type PricingActionState,
  type PricingAdjustmentType,
  type PricingRule,
  type PricingRuleType,
  type PricingSchedule,
  type PricingTarget,
} from './types'

type EditorDefaults = {
  type?: PricingRuleType
  days?: number[]
  startHour?: number
  endHour?: number
  startDate?: string
  endDate?: string
  targets?: PricingTarget[]
}

type BoardMode = 'semanal' | 'promociones'
type BoardView = 'unificado' | 'detalle'

type BoardSelectionRow = {
  rowKey: string
  day: number
  date?: string
}

type BoardSelection = {
  rows: BoardSelectionRow[]
  startHour: number
  endHour: number
}

type BoardRow = {
  key: string
  day: number
  label: string
  short: string
  date?: string
}

const allHours = Array.from({ length: 24 }, (_, hour) => hour)

function todayInLima() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

function daysInDateRange(start: string, end: string) {
  if (!start || !end || start > end) return []
  const cursor = new Date(`${start}T12:00:00Z`)
  const finish = new Date(`${end}T12:00:00Z`)
  const values = new Set<number>()
  for (let count = 0; cursor <= finish && count < 370; count += 1) {
    values.add(cursor.getUTCDay())
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return [...values].sort((a, b) => a - b)
}

function effectiveScheduleRange(day: number, startHour: number, endHour: number, schedules: PricingSchedule[]) {
  const schedule = schedules.find((item) => item.day === day)
  if (!schedule) return null
  const effectiveStart = Math.max(startHour, hourNumber(schedule.openingTime))
  const effectiveEnd = Math.min(endHour, Number(schedule.closingTime.slice(0, 2)) || 24)
  return effectiveStart < effectiveEnd ? { startHour: effectiveStart, endHour: effectiveEnd } : null
}

function ActionFeedback({ state, onSuccess }: { state: PricingActionState; onSuccess?: () => void }) {
  useEffect(() => {
    if (!state.message) return
    if (state.success) {
      notify.success({ title: state.message })
      onSuccess?.()
    } else if (state.message === 'Revisa los campos indicados') {
      notify.warning({ title: state.message })
    } else {
      notify.error({ title: state.message })
    }
  }, [state, onSuccess])
  return null
}

function RuleEditor({
  localId,
  rule,
  defaults,
  targets,
  schedules,
  rules,
  onSaved,
}: {
  localId: string
  rule: PricingRule | null
  defaults: EditorDefaults
  targets: PricingTarget[]
  schedules: PricingSchedule[]
  rules: PricingRule[]
  onSaved: () => void
}) {
  const initialTargetKeys = rule?.targets.map(targetKey)
    ?? defaults.targets?.map(targetKey)
    ?? []
  const initialStart = rule ? hourNumber(rule.startTime) : (defaults.startHour ?? 18)
  const initialEnd = rule ? Number(rule.endTime.slice(0, 2)) || 24 : (defaults.endHour ?? Math.min(initialStart + 2, 24))
  const [state, action, pending] = useActionState(savePricingRuleAction, initialPricingActionState)
  const [type, setType] = useState<PricingRuleType>(rule?.type ?? defaults.type ?? 'recurrente')
  const [name, setName] = useState(rule?.name ?? '')
  const [days, setDays] = useState<number[]>(rule?.days ?? defaults.days ?? [1, 2, 3, 4, 5])
  const [startHour, setStartHour] = useState(initialStart)
  const [endHour, setEndHour] = useState(initialEnd)
  const [dragAnchor, setDragAnchor] = useState<number | null>(null)
  const [selectedTargets, setSelectedTargets] = useState<string[]>(initialTargetKeys)
  const [startDate, setStartDate] = useState(rule?.startDate ?? defaults.startDate ?? todayInLima())
  const [endDate, setEndDate] = useState(rule?.endDate ?? defaults.endDate ?? todayInLima())
  const [adjustmentType, setAdjustmentType] = useState<PricingAdjustmentType>(rule?.adjustmentType ?? 'precio_fijo')
  const [hourlyPrice, setHourlyPrice] = useState(rule?.hourlyPrice?.toString() ?? '')
  const [discount, setDiscount] = useState(rule?.discountPercentage?.toString() ?? '')
  const [active, setActive] = useState(rule?.active ?? true)
  const incomingSelectionKey = rule ? '' : [
    defaults.type ?? '',
    defaults.days?.join(',') ?? '',
    defaults.startHour ?? '',
    defaults.endHour ?? '',
    defaults.startDate ?? '',
    defaults.endDate ?? '',
  ].join('|')
  const [appliedSelectionKey, setAppliedSelectionKey] = useState(incomingSelectionKey)

  if (!rule && incomingSelectionKey !== appliedSelectionKey) {
    setAppliedSelectionKey(incomingSelectionKey)
    if (defaults.type) setType(defaults.type)
    if (defaults.days) setDays(defaults.days)
    if (defaults.startHour != null) setStartHour(defaults.startHour)
    if (defaults.endHour != null) setEndHour(defaults.endHour)
    if (defaults.startDate) setStartDate(defaults.startDate)
    if (defaults.endDate) setEndDate(defaults.endDate)
  }

  const selectedTargetObjects = targets.filter((target) => selectedTargets.includes(targetKey(target)))
  const conflicts = findPricingConflicts({
    id: rule?.id,
    type,
    days,
    startTime: formatHour(startHour),
    endTime: endHour === 24 ? '24:00' : formatHour(endHour),
    startDate: type === 'promocion' ? startDate : null,
    endDate: type === 'promocion' ? endDate : null,
    targets: selectedTargetObjects,
    active,
  }, rules)

  const effectiveDayRanges = days.map((day) => ({
    day,
    range: effectiveScheduleRange(day, startHour, endHour, schedules),
  }))
  const scheduleAdjusted = effectiveDayRanges.some(({ range }) => (
    !range || range.startHour !== startHour || range.endHour !== endHour
  ))

  function toggleDay(day: number) {
    setDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort())
  }

  function toggleTarget(key: string) {
    setSelectedTargets((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  function selectHour(hour: number, anchor = hour) {
    setStartHour(Math.min(anchor, hour))
    setEndHour(Math.max(anchor, hour) + 1)
  }

  function startPainting(event: ReactPointerEvent<HTMLButtonElement>, hour: number) {
    event.preventDefault()
    setDragAnchor(hour)
    selectHour(hour)
  }

  useEffect(() => {
    if (dragAnchor == null) return
    function move(event: PointerEvent) {
      const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-editor-hour]')
      const hour = Number(element?.dataset.editorHour)
      if (Number.isInteger(hour)) selectHour(hour, dragAnchor!)
    }
    function stop() { setDragAnchor(null) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop, { once: true })
    window.addEventListener('pointercancel', stop, { once: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [dragAnchor])

  function updateDateRange(nextStart: string, nextEnd: string) {
    setStartDate(nextStart)
    setEndDate(nextEnd)
    const inferredDays = daysInDateRange(nextStart, nextEnd)
    if (inferredDays.length) setDays(inferredDays)
  }

  const groupedTargets = useMemo(() => {
    const groups = new Map<string, PricingTarget[]>()
    targets.forEach((target) => groups.set(target.courtId, [...(groups.get(target.courtId) ?? []), target]))
    return [...groups.values()]
  }, [targets])

  return (
    <form action={action} className="space-y-6">
      <ActionFeedback state={state} onSuccess={onSaved} />
      <input type="hidden" name="localId" value={localId} />
      <input type="hidden" name="ruleId" value={rule?.id ?? ''} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="startTime" value={formatHour(startHour)} />
      <input type="hidden" name="endTime" value={endHour === 24 ? '24:00' : formatHour(endHour)} />
      <input type="hidden" name="adjustmentType" value={type === 'recurrente' ? 'precio_fijo' : adjustmentType} />
      <input type="hidden" name="active" value={String(active)} />
      {days.map((day) => <input key={day} type="hidden" name="day" value={day} />)}
      {selectedTargets.map((target) => <input key={target} type="hidden" name="objective" value={target} />)}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(290px,.75fr)]">
        <div className="space-y-6">
          <section>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-muted-foreground">Tipo de regla</p>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1.5">
              {([
                ['recurrente', 'Semanal', 'Se repite cada semana'],
                ['promocion', 'Por fechas', 'Tiene inicio y fin'],
              ] as const).map(([value, label, description]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={cn(
                    'rounded-xl px-4 py-3 text-left transition-all',
                    type === value ? 'bg-sidebar text-sidebar-foreground shadow-sm' : 'hover:bg-background/80',
                  )}
                >
                  <span className="block text-sm font-extrabold">{label}</span>
                  <span className={cn('mt-0.5 block text-[11px]', type === value ? 'text-sidebar-foreground/65' : 'text-muted-foreground')}>{description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-bold sm:col-span-2">
              Nombre
              <Input name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder={type === 'recurrente' ? 'Ej. Tarifa nocturna' : 'Ej. Navidad 2026'} />
              <FieldError errors={state.fieldErrors?.name?.map((message) => ({ message }))} />
            </label>
            {type === 'promocion' ? (
              <>
                <label className="grid gap-1.5 text-sm font-bold">Desde<Input name="startDate" type="date" value={startDate} onChange={(event) => updateDateRange(event.target.value, endDate)} /></label>
                <label className="grid gap-1.5 text-sm font-bold">Hasta<Input name="endDate" type="date" min={startDate} value={endDate} onChange={(event) => updateDateRange(startDate, event.target.value)} /></label>
              </>
            ) : (
              <><input type="hidden" name="startDate" value="" /><input type="hidden" name="endDate" value="" /></>
            )}
          </section>

          <section>
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-sm font-extrabold">Días aplicables</p><p className="text-xs text-muted-foreground">La misma franja se aplicará en todos los días elegidos.</p></div>
              <span className="text-xs font-bold text-muted-foreground">{days.length}/7</span>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {pricingDays.map((day) => {
                const selected = days.includes(day.value)
                return <button key={day.value} type="button" aria-pressed={selected} onClick={() => toggleDay(day.value)} className={cn('h-11 rounded-xl border text-xs font-extrabold transition-all', selected ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'bg-background hover:border-primary/50 hover:bg-primary/5')}>{day.short}</button>
              })}
            </div>
            <FieldError className="mt-2" errors={state.fieldErrors?.days?.map((message) => ({ message }))} />
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-sm font-extrabold">Franja horaria</p><p className="text-xs text-muted-foreground">Arrastra para pintar horas consecutivas.</p></div>
              <span className="rounded-full bg-[#e8f4c8] px-3 py-1.5 text-xs font-black text-[#35520d]">{formatHour(startHour)}–{endHour === 24 ? '24:00' : formatHour(endHour)}</span>
            </div>
            <div className="mt-3 overflow-x-auto rounded-2xl border bg-muted/20 p-3">
              <div className="grid min-w-[980px] grid-cols-24 gap-1 touch-none select-none">
                {allHours.map((hour) => {
                  const selected = hour >= startHour && hour < endHour
                  return (
                    <button
                      key={hour}
                      type="button"
                      data-editor-hour={hour}
                      aria-label={`${formatHour(hour)} a ${hour === 23 ? '24:00' : formatHour(hour + 1)}`}
                      onPointerDown={(event) => startPainting(event, hour)}
                      className={cn('group relative h-14 rounded-lg border transition-colors', selected ? 'border-primary bg-primary' : 'border-transparent bg-background hover:border-primary/35')}
                    >
                      <span className={cn('absolute inset-x-0 bottom-1 text-center text-[8px] font-bold tabular-nums', selected ? 'text-primary-foreground' : 'text-muted-foreground')}>{String(hour).padStart(2, '0')}–{String(hour + 1).padStart(2, '0')}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            {scheduleAdjusted ? (
              <div className="mt-2 rounded-xl bg-muted/45 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4" /> La tarifa solo tendrá efecto en los bloques atendidos de cada día.</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {effectiveDayRanges.map(({ day, range }) => (
                    <span key={day} className={cn('rounded-full px-2 py-1 text-[10px] font-bold tabular-nums', range ? 'bg-background text-foreground shadow-xs' : 'bg-muted text-muted-foreground')}>
                      {pricingDays.find((item) => item.value === day)?.short} · {range ? `${formatHour(range.startHour)}–${range.endHour === 24 ? '24:00' : formatHour(range.endHour)}` : 'sin bloques'}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <FieldError className="mt-2" errors={state.fieldErrors?.endTime?.map((message) => ({ message }))} />
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-3xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-extrabold">Canchas y deportes</p><p className="text-xs text-muted-foreground">Aplica el mismo cambio de una sola vez.</p></div><Badge variant="neutral">{selectedTargets.length}</Badge></div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTargets(targets.filter((target) => target.courtActive).map(targetKey))}>Todas</Button>
              {[...new Map(targets.map((target) => [target.sportId, target.sportName])).entries()].map(([sportId, sportName]) => (
                <Button key={sportId} type="button" variant="outline" size="sm" onClick={() => setSelectedTargets(targets.filter((target) => target.courtActive && target.sportId === sportId).map(targetKey))}>Todo {sportName}</Button>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedTargets([])}>Limpiar</Button>
            </div>
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {groupedTargets.map((group) => (
                <div key={group[0].courtId} className="rounded-2xl border bg-background p-3">
                  <div className="flex items-center justify-between gap-2"><p className="text-sm font-black">{group[0].courtName}</p>{!group[0].courtActive ? <Badge variant="neutral">Inactiva</Badge> : null}</div>
                  <div className="mt-2 space-y-1.5">
                    {group.map((target) => {
                      const key = targetKey(target)
                      const selected = selectedTargets.includes(key)
                      return (
                        <button key={key} type="button" disabled={!target.courtActive && !selected} aria-pressed={selected} onClick={() => toggleTarget(key)} className={cn('flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-all disabled:opacity-45', selected ? 'border-primary bg-primary/12' : 'border-transparent bg-muted/45 hover:border-primary/30')}>
                          <span className="flex items-center gap-2 text-xs font-bold"><span className={cn('grid size-5 place-items-center rounded-full border', selected && 'border-primary bg-primary text-primary-foreground')}><HugeiconsIcon icon={Tick02Icon} strokeWidth={2.4} className={cn('size-3', !selected && 'opacity-0')} /></span>{target.sportName}</span>
                          <span className="text-[11px] font-black tabular-nums">Base {formatMoney(target.basePrice)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <FieldError className="mt-2" errors={state.fieldErrors?.objectives?.map((message) => ({ message }))} />
          </section>

          <section className="rounded-3xl bg-sidebar p-5 text-sidebar-foreground">
            <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><HugeiconsIcon icon={type === 'promocion' ? DiscountTag01Icon : Money03Icon} strokeWidth={2} className="size-4.5" /></span><div><p className="text-xs font-semibold text-sidebar-foreground/55">Nuevo precio</p><p className="font-black">{type === 'recurrente' ? 'Precio fijo semanal' : 'Ajuste promocional'}</p></div></div>
            {type === 'promocion' ? (
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-sidebar-foreground/[.06] p-1.5">
                <button type="button" onClick={() => setAdjustmentType('precio_fijo')} className={cn('rounded-xl px-3 py-2 text-xs font-bold', adjustmentType === 'precio_fijo' && 'bg-primary text-primary-foreground')}>Precio fijo</button>
                <button type="button" onClick={() => setAdjustmentType('descuento_porcentaje')} className={cn('rounded-xl px-3 py-2 text-xs font-bold', adjustmentType === 'descuento_porcentaje' && 'bg-primary text-primary-foreground')}>Descuento %</button>
              </div>
            ) : null}
            <div className="mt-4">
              {adjustmentType === 'precio_fijo' || type === 'recurrente' ? (
                <label className="grid gap-1.5 text-xs font-bold">Precio por hora (S/)<Input name="hourlyPrice" type="number" min="0.01" max="10000" step="0.01" value={hourlyPrice} onChange={(event) => setHourlyPrice(event.target.value)} className="border-sidebar-foreground/15 bg-sidebar-foreground/10 text-xl font-black text-sidebar-foreground placeholder:text-sidebar-foreground/25" placeholder="60.00" /></label>
              ) : (
                <><input type="hidden" name="hourlyPrice" value="" /><label className="grid gap-1.5 text-xs font-bold">Descuento porcentual<Input name="discountPercentage" type="number" min="0.01" max="99.99" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} className="border-sidebar-foreground/15 bg-sidebar-foreground/10 text-xl font-black text-sidebar-foreground placeholder:text-sidebar-foreground/25" placeholder="15" /></label></>
              )}
              {(adjustmentType === 'precio_fijo' || type === 'recurrente') ? <input type="hidden" name="discountPercentage" value="" /> : null}
              <FieldError className="mt-2 text-red-300" errors={(state.fieldErrors?.hourlyPrice ?? state.fieldErrors?.discountPercentage)?.map((message) => ({ message }))} />
            </div>
            <button type="button" aria-pressed={active} onClick={() => setActive((value) => !value)} className="mt-4 flex w-full items-center justify-between rounded-xl border border-sidebar-foreground/12 bg-sidebar-foreground/[.05] px-3 py-2.5 text-left">
              <span><span className="block text-xs font-bold">Regla activa</span><span className="block text-[10px] text-sidebar-foreground/55">Solo las activas afectan nuevas reservas.</span></span>
              <span className={cn('h-5 w-9 rounded-full p-0.5 transition-colors', active ? 'bg-primary' : 'bg-sidebar-foreground/20')}><span className={cn('block size-4 rounded-full bg-white transition-transform', active && 'translate-x-4')} /></span>
            </button>
          </section>
        </div>
      </div>

      {conflicts.length ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/7 p-4 text-sm"><p className="font-extrabold text-destructive">Esta franja se cruza con {conflicts.length === 1 ? conflicts[0].name : `${conflicts.length} reglas existentes`}.</p><p className="mt-1 text-xs text-muted-foreground">Cambia días, horas u objetivos. Una promoción sí puede coincidir con una tarifa semanal, pero no con otra promoción.</p></div>
      ) : null}
      {state.message && !state.success && state.message !== 'Revisa los campos indicados' ? <p className="rounded-2xl bg-destructive/8 px-4 py-3 text-sm font-semibold text-destructive">{state.message}</p> : null}
      <DialogFooter>
        <Button type="submit" disabled={pending || conflicts.length > 0 || days.length === 0 || selectedTargets.length === 0}>
          {pending ? <Spinner /> : <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />}
          {rule ? 'Guardar cambios' : 'Crear regla'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function DeleteRuleDialog({ localId, rule }: { localId: string; rule: PricingRule }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(deletePricingRuleAction, initialPricingActionState)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Eliminar ${rule.name}`} onClick={() => setOpen(true)}><HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /></Button>
      <DialogContent>
        <DialogHeader><DialogTitle>Eliminar {rule.name}</DialogTitle><DialogDescription>Las reservas existentes conservarán el precio histórico aplicado. Esta acción solo elimina la regla para reservas futuras.</DialogDescription></DialogHeader>
        <form action={action}>
          <ActionFeedback state={state} onSuccess={() => { setOpen(false); router.refresh() }} />
          <input type="hidden" name="localId" value={localId} /><input type="hidden" name="ruleId" value={rule.id} />
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Volver</Button><Button type="submit" variant="destructive" disabled={pending}>{pending && <Spinner />}Eliminar regla</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RuleCard({ localId, rule, onEdit }: { localId: string; rule: PricingRule; onEdit: (rule: PricingRule) => void }) {
  const isPromotion = rule.type === 'promocion'
  return (
    <article className={cn('group rounded-3xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md', !rule.active && 'opacity-65')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-2xl', isPromotion ? 'bg-amber-100 text-amber-800' : 'bg-sidebar text-sidebar-foreground')}><HugeiconsIcon icon={isPromotion ? DiscountTag01Icon : Clock01Icon} strokeWidth={2} className="size-4.5" /></span>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black">{rule.name}</h3><Badge variant={rule.active ? 'success' : 'neutral'}>{rule.active ? 'Activa' : 'Inactiva'}</Badge></div><p className="mt-1 text-xs font-semibold text-muted-foreground">{formatRuleDays(rule.days)} · {rule.startTime}–{rule.endTime}</p></div>
        </div>
        <div className="flex shrink-0"><Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar ${rule.name}`} onClick={() => onEdit(rule)}><HugeiconsIcon icon={Edit02Icon} strokeWidth={2} /></Button><DeleteRuleDialog localId={localId} rule={rule} /></div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3 border-t pt-4">
        <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">{isPromotion ? `${rule.startDate} → ${rule.endDate}` : 'Se repite semanalmente'}</p><p className="mt-1 truncate text-xs font-bold">{rule.targets.map((target) => `${target.courtName} · ${target.sportName}`).join(', ')}</p></div>
        <p className="shrink-0 text-lg font-black tracking-[-.04em]">{rule.adjustmentType === 'descuento_porcentaje' ? `−${rule.discountPercentage}%` : rule.hourlyPrice != null ? formatMoney(rule.hourlyPrice) : '—'}<span className="ml-0.5 text-[10px] font-bold text-muted-foreground">{rule.adjustmentType === 'precio_fijo' ? '/h' : ''}</span></p>
      </div>
    </article>
  )
}

export function LegacyPricingDashboard({
  localId,
  targets,
  rules,
  schedules,
}: {
  localId: string
  targets: PricingTarget[]
  rules: PricingRule[]
  schedules: PricingSchedule[]
}) {
  const router = useRouter()
  const activeTargets = targets.filter((target) => target.courtActive)
  const [selectedTargetKey, setSelectedTargetKey] = useState(() => activeTargets[0] ? targetKey(activeTargets[0]) : '')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [editorDefaults, setEditorDefaults] = useState<EditorDefaults>({})
  const [editorKey, setEditorKey] = useState(0)
  const [listFilter, setListFilter] = useState<'todas' | PricingRuleType>('todas')
  const selectedTarget = activeTargets.find((target) => targetKey(target) === selectedTargetKey) ?? activeTargets[0]
  const activeRecurring = rules.filter((rule) => rule.active && rule.type === 'recurrente')
  const activePromotions = rules.filter((rule) => rule.active && rule.type === 'promocion')

  const boardHours = useMemo(() => {
    if (!schedules.length) return Array.from({ length: 17 }, (_, index) => index + 6)
    const opening = Math.max(0, Math.min(...schedules.map((item) => hourNumber(item.openingTime))))
    const closing = Math.min(24, Math.max(...schedules.map((item) => Number(item.closingTime.slice(0, 2)) || 24)))
    return Array.from({ length: Math.max(1, closing - opening) }, (_, index) => opening + index)
  }, [schedules])

  function openEditor(rule: PricingRule | null, defaults: EditorDefaults = {}) {
    setEditingRule(rule)
    setEditorDefaults(defaults)
    setEditorKey((value) => value + 1)
    setEditorOpen(true)
  }

  function recurringRuleAt(day: number, hour: number) {
    if (!selectedTarget) return undefined
    const key = targetKey(selectedTarget)
    return activeRecurring.find((rule) => rule.days.includes(day) && hour >= hourNumber(rule.startTime) && hour < (Number(rule.endTime.slice(0, 2)) || 24) && rule.targets.some((target) => targetKey(target) === key))
  }

  const filteredRules = rules.filter((rule) => listFilter === 'todas' || rule.type === listFilter)

  if (!targets.length) {
    return <Card className="grid min-h-96 place-items-center p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><HugeiconsIcon icon={Money03Icon} strokeWidth={2} /></span><h2 className="mt-5 text-2xl font-black">Primero configura una tarifa base</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Cada regla necesita una cancha, un deporte y su precio por hora base.</p><Button asChild className="mt-5"><Link href="/panel/canchas">Ir a Canchas</Link></Button></div></Card>
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden border-0 bg-sidebar p-5 text-sidebar-foreground"><div className="absolute -right-8 -top-8 size-28 rounded-full bg-primary/20 blur-2xl" /><p className="text-xs font-bold text-sidebar-foreground/55">Combinaciones con tarifa base</p><div className="mt-5 flex items-end justify-between"><p className="text-4xl font-black tracking-[-.06em]">{activeTargets.length}</p><span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><HugeiconsIcon icon={Money03Icon} strokeWidth={2} /></span></div></Card>
        <Card className="border-0 bg-primary p-5 text-primary-foreground"><p className="text-xs font-bold text-primary-foreground/65">Tarifas semanales activas</p><div className="mt-5 flex items-end justify-between"><p className="text-4xl font-black tracking-[-.06em]">{activeRecurring.length}</p><HugeiconsIcon icon={Clock01Icon} strokeWidth={1.8} className="size-10 opacity-70" /></div></Card>
        <Card className="border-0 bg-[#fff0c7] p-5 text-[#493500]"><p className="text-xs font-bold text-[#735700]">Promociones activas</p><div className="mt-5 flex items-end justify-between"><p className="text-4xl font-black tracking-[-.06em]">{activePromotions.length}</p><HugeiconsIcon icon={DiscountTag01Icon} strokeWidth={1.8} className="size-10 opacity-70" /></div></Card>
      </div>

      <Card className="mt-5 overflow-hidden p-0 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4">
          <div><p className="text-base font-black">Mapa semanal de precios</p><p className="mt-0.5 text-xs text-muted-foreground">Cada celda muestra el precio efectivo recurrente. Haz clic en una hora para configurarla.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedTarget ? targetKey(selectedTarget) : ''} onValueChange={setSelectedTargetKey}>
              <SelectTrigger className="min-w-56"><SelectValue placeholder="Cancha y deporte" /></SelectTrigger>
              <SelectContent position="popper" align="end">{activeTargets.map((target) => <SelectItem key={targetKey(target)} value={targetKey(target)}>{target.courtName} · {target.sportName}</SelectItem>)}</SelectContent>
            </Select>
            <Button type="button" onClick={() => openEditor(null, { type: 'recurrente', targets: selectedTarget ? [selectedTarget] : [] })}><HugeiconsIcon icon={Add01Icon} strokeWidth={2} />Nueva tarifa</Button>
          </div>
        </div>
        {selectedTarget ? (
          <div className="overflow-x-auto p-4 sm:p-5">
            <div className="min-w-[920px]">
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `82px repeat(${boardHours.length}, minmax(46px,1fr))` }}>
                <span className="self-end pb-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Día</span>
                {boardHours.map((hour) => <span key={hour} className="pb-2 text-center text-[9px] font-bold tabular-nums text-muted-foreground">{String(hour).padStart(2, '0')}</span>)}
                {pricingDays.map((day) => {
                  const schedule = schedules.find((item) => item.day === day.value)
                  return [
                    <div key={`${day.value}-label`} className="flex items-center pr-2 text-xs font-black">{day.short}</div>,
                    ...boardHours.map((hour) => {
                      const withinSchedule = Boolean(schedule && hour >= hourNumber(schedule.openingTime) && hour < (Number(schedule.closingTime.slice(0, 2)) || 24))
                      const rule = recurringRuleAt(day.value, hour)
                      return (
                        <button
                          key={`${day.value}-${hour}`}
                          type="button"
                          disabled={!withinSchedule}
                          onClick={() => rule ? openEditor(rule) : openEditor(null, { type: 'recurrente', days: [day.value], startHour: hour, targets: selectedTarget ? [selectedTarget] : [] })}
                          title={rule ? `${rule.name}: ${formatMoney(rule.hourlyPrice ?? selectedTarget.basePrice)}` : withinSchedule ? `Tarifa base ${formatMoney(selectedTarget.basePrice)}` : 'Fuera del horario de atención'}
                          className={cn(
                            'group relative h-12 rounded-lg border text-center text-[10px] font-black tabular-nums transition-all',
                            !withinSchedule && 'cursor-not-allowed border-transparent bg-muted/30 text-muted-foreground/35',
                            withinSchedule && !rule && 'border-border bg-background text-muted-foreground hover:border-primary hover:bg-primary/8 hover:text-foreground',
                            rule && 'border-sidebar bg-sidebar text-sidebar-foreground hover:-translate-y-0.5 hover:bg-sidebar/90 hover:shadow-md',
                          )}
                        >
                          {withinSchedule ? formatMoney(rule?.hourlyPrice ?? selectedTarget.basePrice).replace('PEN', 'S/').replace(/\.00$/, '') : '—'}
                          {rule ? <span className="absolute inset-x-1 bottom-0.5 truncate text-[7px] font-semibold text-sidebar-foreground/50">{rule.name}</span> : null}
                        </button>
                      )
                    }),
                  ]
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-[11px] font-semibold text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border bg-background" />Tarifa base {formatMoney(selectedTarget.basePrice)}</span><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-sidebar" />Tarifa recurrente</span><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-muted" />Fuera de atención</span></div>
            </div>
          </div>
        ) : <div className="px-6 py-14 text-center text-sm text-muted-foreground">Activa una cancha para visualizar sus precios.</div>}
      </Card>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Reglas configuradas</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Tarifas y promociones</h2><p className="mt-1 text-sm text-muted-foreground">Las promociones por fecha prevalecen sobre el precio semanal.</p></div>
          <div className="flex items-center gap-2 rounded-2xl border bg-card p-1">
            {([['todas', 'Todas'], ['recurrente', 'Semanales'], ['promocion', 'Promociones']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setListFilter(value)} className={cn('rounded-xl px-3 py-2 text-xs font-bold transition-colors', listFilter === value ? 'bg-sidebar text-sidebar-foreground' : 'hover:bg-muted')}>{label}</button>)}
          </div>
        </div>
        {filteredRules.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{filteredRules.map((rule) => <RuleCard key={rule.id} localId={localId} rule={rule} onEdit={(item) => openEditor(item)} />)}</div> : <div className="mt-4 rounded-3xl border border-dashed p-10 text-center"><p className="font-black">Aún no hay reglas en esta categoría</p><p className="mt-1 text-sm text-muted-foreground">La tarifa base seguirá aplicándose mientras no agregues una.</p></div>}
      </section>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader><DialogTitle>{editingRule ? `Editar ${editingRule.name}` : 'Nueva regla de precio'}</DialogTitle><DialogDescription>Configura cuándo y dónde cambia la tarifa. Supabase calculará el importe final de cada reserva.</DialogDescription></DialogHeader>
          <RuleEditor key={editorKey} localId={localId} rule={editingRule} defaults={editorDefaults} targets={targets} schedules={schedules} rules={rules} onSaved={() => { setEditorOpen(false); router.refresh() }} />
        </DialogContent>
      </Dialog>
    </>
  )
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function dateAtNoon(value: string) {
  return new Date(`${value}T12:00:00Z`)
}

function mondayOf(value: string) {
  const date = dateAtNoon(value)
  const distance = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - distance)
  return isoDate(date)
}

function moveDate(value: string, days: number) {
  const date = dateAtNoon(value)
  date.setUTCDate(date.getUTCDate() + days)
  return isoDate(date)
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(dateAtNoon(value)).replace('.', '')
}

function weekRangeLabel(start: string) {
  const end = moveDate(start, 6)
  const startDate = dateAtNoon(start)
  const endDate = dateAtNoon(end)
  const month = new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: 'UTC' })
  if (startDate.getUTCMonth() === endDate.getUTCMonth()) {
    return `${startDate.getUTCDate()}–${endDate.getUTCDate()} de ${month.format(startDate)}`
  }
  return `${shortDate(start)} – ${shortDate(end)}`
}

function effectivePricing(
  target: PricingTarget,
  day: number,
  hour: number,
  date: string | undefined,
  recurring: PricingRule[],
  promotions: PricingRule[],
) {
  const key = targetKey(target)
  const matches = (rule: PricingRule) => rule.active
    && rule.days.includes(day)
    && hour >= hourNumber(rule.startTime)
    && hour < (Number(rule.endTime.slice(0, 2)) || 24)
    && rule.targets.some((item) => targetKey(item) === key)
  const recurringRule = recurring.find(matches)
  const recurringPrice = recurringRule?.hourlyPrice ?? target.basePrice
  const promotion = date
    ? promotions.find((rule) => matches(rule) && Boolean(rule.startDate && rule.endDate && rule.startDate <= date && date <= rule.endDate))
    : undefined
  const price = promotion
    ? promotion.adjustmentType === 'descuento_porcentaje'
      ? recurringPrice * (1 - (promotion.discountPercentage ?? 0) / 100)
      : (promotion.hourlyPrice ?? recurringPrice)
    : recurringPrice
  return { price, rule: promotion ?? recurringRule, source: promotion ? 'promocion' : recurringRule ? 'recurrente' : 'base' }
}

export function PricingDashboard({
  localId,
  targets,
  rules,
  schedules,
}: {
  localId: string
  targets: PricingTarget[]
  rules: PricingRule[]
  schedules: PricingSchedule[]
}) {
  const router = useRouter()
  const activeTargets = useMemo(() => targets.filter((target) => target.courtActive), [targets])
  const recurring = useMemo(() => rules.filter((rule) => rule.active && rule.type === 'recurrente'), [rules])
  const promotions = useMemo(() => rules.filter((rule) => rule.active && rule.type === 'promocion'), [rules])
  const [boardMode, setBoardMode] = useState<BoardMode>('semanal')
  const [boardView, setBoardView] = useState<BoardView>('unificado')
  const [selectedTargetKey, setSelectedTargetKey] = useState(() => activeTargets[0] ? targetKey(activeTargets[0]) : '')
  const [weekStart, setWeekStart] = useState(() => mondayOf(todayInLima()))
  const [weekDirection, setWeekDirection] = useState<-1 | 1>(1)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMinimized, setEditorMinimized] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [editorDefaults, setEditorDefaults] = useState<EditorDefaults>({})
  const [editorKey, setEditorKey] = useState(0)
  const [listFilter, setListFilter] = useState<'todas' | PricingRuleType>('todas')
  const [selection, setSelection] = useState<BoardSelection | null>(null)
  const selectionRef = useRef<BoardSelection | null>(null)
  const anchorHourRef = useRef<number | null>(null)
  const dragRowKeyRef = useRef<string | null>(null)
  const additiveRangeRef = useRef<Pick<BoardSelection, 'startHour' | 'endHour'> | null>(null)
  const clickedRuleRef = useRef<PricingRule | null>(null)
  const draggingRef = useRef(false)
  const selectedTarget = activeTargets.find((target) => targetKey(target) === selectedTargetKey) ?? activeTargets[0]
  const groupedActiveTargets = useMemo(() => {
    const groups = new Map<string, PricingTarget[]>()
    activeTargets.forEach((target) => groups.set(target.courtId, [...(groups.get(target.courtId) ?? []), target]))
    return [...groups.values()]
  }, [activeTargets])

  const boardHours = useMemo(() => {
    if (!schedules.length) return Array.from({ length: 17 }, (_, index) => index + 6)
    const opening = Math.max(0, Math.min(...schedules.map((item) => hourNumber(item.openingTime))))
    const closing = Math.min(24, Math.max(...schedules.map((item) => Number(item.closingTime.slice(0, 2)) || 24)))
    return Array.from({ length: Math.max(1, closing - opening) }, (_, index) => opening + index)
  }, [schedules])

  const rows = useMemo<BoardRow[]>(() => {
    if (boardMode === 'semanal') {
      return [1, 2, 3, 4, 5, 6, 0].map((day) => ({
        key: `weekly-${day}`,
        day,
        label: pricingDays.find((item) => item.value === day)?.label ?? '',
        short: pricingDays.find((item) => item.value === day)?.short ?? '',
      }))
    }
    return Array.from({ length: 7 }, (_, index) => {
      const date = moveDate(weekStart, index)
      const day = dateAtNoon(date).getUTCDay()
      return {
        key: date,
        day,
        date,
        label: pricingDays.find((item) => item.value === day)?.label ?? '',
        short: pricingDays.find((item) => item.value === day)?.short ?? '',
      }
    })
  }, [boardMode, weekStart])

  const openEditor = useCallback((rule: PricingRule | null, defaults: EditorDefaults = {}, preserveBoardSelection = false) => {
    if (!preserveBoardSelection) setSelection(null)
    setEditingRule(rule)
    setEditorDefaults(defaults)
    setEditorKey((value) => value + 1)
    setEditorMinimized(false)
    setEditorOpen(true)
  }, [])

  function closeEditor() {
    setEditorOpen(false)
    setEditorMinimized(false)
    setSelection(null)
  }

  const finishSelection = useCallback(() => {
    const current = selectionRef.current
    if (!current) return
    const clickedRule = clickedRuleRef.current
    selectionRef.current = null
    anchorHourRef.current = null
    dragRowKeyRef.current = null
    additiveRangeRef.current = null
    clickedRuleRef.current = null
    draggingRef.current = false
    if (clickedRule && current.rows.length === 1 && current.endHour - current.startHour === 1 && boardView === 'detalle') {
      openEditor(clickedRule, {}, true)
      return
    }
    const editorTargets = boardView === 'unificado' ? activeTargets : selectedTarget ? [selectedTarget] : []
    const dates = current.rows.flatMap((row) => row.date ? [row.date] : []).sort()
    const nextDefaults: EditorDefaults = {
      type: boardMode === 'semanal' ? 'recurrente' : 'promocion',
      days: [...new Set(current.rows.map((row) => row.day))].sort((a, b) => a - b),
      startHour: current.startHour,
      endHour: current.endHour,
      startDate: dates[0],
      endDate: dates.at(-1),
      targets: editorTargets,
    }
    if (editorOpen && !editingRule) {
      setEditorDefaults((defaults) => ({ ...defaults, ...nextDefaults }))
      return
    }
    openEditor(null, nextDefaults, true)
  }, [activeTargets, boardMode, boardView, editingRule, editorOpen, openEditor, selectedTarget])

  useEffect(() => {
    function stop() { if (draggingRef.current) finishSelection() }
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [finishSelection])

  function startSelection(event: ReactPointerEvent<HTMLButtonElement>, row: (typeof rows)[number], hour: number, clickedRule: PricingRule | null) {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    event.preventDefault()
    const additive = event.ctrlKey || event.metaKey
    const nextRow = { rowKey: row.key, day: row.day, date: row.date }
    const selectedRows = additive
      ? [...(selection?.rows.filter((item) => item.rowKey !== row.key) ?? []), nextRow]
      : [nextRow]
    additiveRangeRef.current = additive && selection
      ? { startHour: selection.startHour, endHour: selection.endHour }
      : null
    const next = {
      rows: selectedRows,
      startHour: Math.min(additiveRangeRef.current?.startHour ?? hour, hour),
      endHour: Math.max(additiveRangeRef.current?.endHour ?? hour + 1, hour + 1),
    }
    anchorHourRef.current = hour
    dragRowKeyRef.current = row.key
    selectionRef.current = next
    clickedRuleRef.current = additive ? null : clickedRule
    draggingRef.current = true
    setSelection(next)
  }

  function paintSelection(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || !selectionRef.current || anchorHourRef.current == null) return
    const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-pricing-cell]')
    if (!cell || cell.dataset.rowKey !== dragRowKeyRef.current) return
    const hour = Number(cell.dataset.hour)
    if (!Number.isInteger(hour)) return
    const dragStart = Math.min(anchorHourRef.current, hour)
    const dragEnd = Math.max(anchorHourRef.current, hour) + 1
    const next = {
      ...selectionRef.current,
      startHour: Math.min(additiveRangeRef.current?.startHour ?? dragStart, dragStart),
      endHour: Math.max(additiveRangeRef.current?.endHour ?? dragEnd, dragEnd),
    }
    if (next.startHour !== selectionRef.current.startHour || next.endHour !== selectionRef.current.endHour) clickedRuleRef.current = null
    selectionRef.current = next
    setSelection(next)
  }

  function isSelected(row: BoardRow, hour: number) {
    if (!selection?.rows.some((item) => item.rowKey === row.key)) return false
    const range = effectiveScheduleRange(row.day, selection.startHour, selection.endHour, schedules)
    return Boolean(range && hour >= range.startHour && hour < range.endHour)
  }

  function changeWeek(offset: number) {
    setWeekDirection(offset < 0 ? -1 : 1)
    setWeekStart((value) => moveDate(value, offset))
  }

  const filteredRules = rules.filter((rule) => listFilter === 'todas' || rule.type === listFilter)

  if (!targets.length) {
    return <Card className="grid min-h-96 place-items-center p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><HugeiconsIcon icon={Money03Icon} strokeWidth={2} /></span><h2 className="mt-5 text-2xl font-black">Primero configura una tarifa base</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Cada regla necesita una cancha, un deporte y su precio por hora base.</p><Button asChild className="mt-5"><Link href="/panel/canchas">Ir a Canchas</Link></Button></div></Card>
  }

  return (
    <>
      <Card className="overflow-hidden p-0 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <div>
            <p className="font-black">Mapa de precios</p>
            <p className="text-xs text-muted-foreground">Arrastra sobre horas consecutivas. Mantén Ctrl para sumar otra fila.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border bg-muted/40 p-1">
              {([['unificado', 'Unificado'], ['detalle', 'Por cancha']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setBoardView(value)} className={cn('rounded-lg px-3 py-1.5 text-xs font-bold transition-colors', boardView === value ? 'bg-sidebar text-sidebar-foreground shadow-sm' : 'hover:bg-background')}>{label}</button>)}
            </div>
            <div className="flex rounded-xl border bg-muted/40 p-1">
              {([['semanal', 'Semanal'], ['promociones', 'Promociones']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setBoardMode(value)} className={cn('rounded-lg px-3 py-1.5 text-xs font-bold transition-colors', boardMode === value ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-background')}>{label}</button>)}
            </div>
            {boardView === 'detalle' ? (
              <Select value={selectedTarget ? targetKey(selectedTarget) : ''} onValueChange={setSelectedTargetKey}>
                <SelectTrigger className="h-auto min-w-64 py-1.5">
                  <SelectValue placeholder="Cancha y deporte">
                    {selectedTarget ? (
                      <div className="flex min-w-0 items-center gap-2.5 text-left">
                        <SportIcon name={selectedTarget.sportName} size="sm" />
                        <span className="min-w-0"><span className="block truncate text-xs font-black">{selectedTarget.courtName}</span><span className="block truncate text-[10px] font-semibold capitalize text-muted-foreground">{selectedTarget.sportName} · {formatMoney(selectedTarget.basePrice)}/h</span></span>
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent position="popper" align="end" className="min-w-72 p-1.5">
                  {groupedActiveTargets.map((group, groupIndex) => (
                    <SelectGroup key={group[0].courtId}>
                      <SelectLabel className={cn('px-2.5 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground', groupIndex > 0 && 'mt-1 border-t pt-3')}>{group[0].courtName}</SelectLabel>
                      {group.map((target) => (
                        <SelectItem key={targetKey(target)} value={targetKey(target)} className="py-2.5">
                          <SportIcon name={target.sportName} size="sm" />
                          <span className="flex min-w-0 flex-1 items-center justify-between gap-4"><span className="font-bold capitalize">{target.sportName}</span><span className="shrink-0 text-[11px] font-black tabular-nums opacity-70">{formatMoney(target.basePrice)}/h</span></span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button type="button" onClick={() => {
              const today = todayInLima()
              openEditor(null, {
                type: boardMode === 'semanal' ? 'recurrente' : 'promocion',
                days: boardMode === 'promociones' ? [dateAtNoon(today).getUTCDay()] : undefined,
                startDate: boardMode === 'promociones' ? today : undefined,
                endDate: boardMode === 'promociones' ? today : undefined,
                targets: boardView === 'unificado' ? activeTargets : selectedTarget ? [selectedTarget] : [],
              })
            }}><HugeiconsIcon icon={Add01Icon} strokeWidth={2} />Nueva tarifa</Button>
          </div>
        </div>

        {boardMode === 'promociones' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3 rounded-2xl border bg-background px-3 py-2 shadow-xs">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4.5" /></span>
              <div aria-live="polite"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Semana de promociones</p><p className="mt-0.5 text-sm font-black capitalize">{weekRangeLabel(weekStart)}</p></div>
            </div>
            <div className="flex items-center gap-1 rounded-2xl border bg-background p-1 shadow-xs">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => changeWeek(-7)} aria-label="Semana anterior"><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                const current = mondayOf(todayInLima())
                setWeekDirection(current < weekStart ? -1 : 1)
                setWeekStart(current)
              }}>Hoy</Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => changeWeek(7)} aria-label="Semana siguiente"><HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} /></Button>
            </div>
          </div>
        ) : null}

        {activeTargets.length ? (
          <TooltipProvider delayDuration={180}>
            <div className="overflow-x-auto p-4 sm:p-5">
              <div
                key={`${boardMode}-${weekStart}`}
                className={cn(
                  'min-w-[1040px] touch-none select-none',
                  boardMode === 'promociones' && 'animate-in fade-in-0 duration-300',
                  boardMode === 'promociones' && weekDirection === 1 && 'slide-in-from-right-3',
                  boardMode === 'promociones' && weekDirection === -1 && 'slide-in-from-left-3',
                )}
                onPointerMove={paintSelection}
              >
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `${boardMode === 'semanal' ? '64px' : '112px'} repeat(${boardHours.length}, minmax(52px,1fr))` }}>
                  <span className="self-end pb-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">{boardMode === 'semanal' ? 'Día' : 'Fecha'}</span>
                  {boardHours.map((hour) => <span key={hour} className="pb-2 text-center text-[9px] font-bold tabular-nums text-muted-foreground">{String(hour).padStart(2, '0')}:00<br /><span className="opacity-60">–{String(hour + 1).padStart(2, '0')}:00</span></span>)}
                  {/* The refs below are only read by pointer handlers; the mapper itself is render-only. */}
                  {/* eslint-disable-next-line react-hooks/refs */}
                  {rows.flatMap((row) => {
                    const schedule = schedules.find((item) => item.day === row.day)
                    return [
                      <div key={`${row.key}-label`} className="flex items-center justify-between gap-2 pr-2">
                        <span className="text-xs font-black">{row.short}</span>
                        {row.date ? <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold tabular-nums">{shortDate(row.date)}</span> : null}
                      </div>,
                      ...boardHours.map((hour) => {
                        const withinSchedule = Boolean(schedule && hour >= hourNumber(schedule.openingTime) && hour < (Number(schedule.closingTime.slice(0, 2)) || 24))
                        const cellTargets = boardView === 'unificado' ? activeTargets : selectedTarget ? [selectedTarget] : []
                        const values = cellTargets.map((target) => ({ target, ...effectivePricing(target, row.day, hour, row.date, recurring, promotions) }))
                        const valuesByCourt = new Map<string, typeof values>()
                        values.forEach((value) => valuesByCourt.set(value.target.courtId, [...(valuesByCourt.get(value.target.courtId) ?? []), value]))
                        const groups = new Map<string, typeof values>()
                        values.forEach((value) => {
                          const key = value.rule ? `${value.source}:${value.rule.id}` : 'base'
                          groups.set(key, [...(groups.get(key) ?? []), value])
                        })
                        const sortedGroups = [...groups.values()].sort((a, b) => b.length - a.length)
                        const majority = sortedGroups[0]
                        const unified = groups.size <= 1
                        const detailRule = boardView === 'detalle' ? values[0]?.rule ?? null : null
                        const source = unified ? majority?.[0]?.source : 'mixto'
                        const selected = isSelected(row, hour)
                        const button = (
                          <button
                            type="button"
                            data-pricing-cell
                            data-row-key={row.key}
                            data-hour={hour}
                            disabled={!withinSchedule}
                            onPointerDown={(event) => startSelection(event, row, hour, detailRule)}
                            onKeyDown={(event) => {
                              if ((event.key === 'Enter' || event.key === ' ') && withinSchedule) {
                                event.preventDefault()
                                if (detailRule) openEditor(detailRule)
                                else openEditor(null, { type: boardMode === 'semanal' ? 'recurrente' : 'promocion', days: [row.day], startHour: hour, endHour: hour + 1, startDate: row.date, endDate: row.date, targets: cellTargets })
                              }
                            }}
                            className={cn(
                              'relative h-13 rounded-lg border px-1 text-center text-[10px] font-black tabular-nums transition-[background-color,border-color,transform,box-shadow] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                              !withinSchedule && 'cursor-not-allowed border-transparent bg-muted/30 text-muted-foreground/30',
                              withinSchedule && source === 'base' && 'bg-background text-muted-foreground hover:border-primary/60 hover:bg-primary/8 hover:text-foreground',
                              withinSchedule && source === 'recurrente' && 'border-sidebar bg-sidebar text-sidebar-foreground hover:-translate-y-0.5 hover:shadow-md',
                              withinSchedule && source === 'promocion' && 'border-amber-300 bg-amber-100 text-amber-950 hover:-translate-y-0.5 hover:shadow-md',
                              withinSchedule && source === 'mixto' && 'border-[#8bb43a] bg-[#e8f4c8] text-[#29420a] hover:-translate-y-0.5 hover:shadow-md',
                              selected && 'z-10 border-primary bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1',
                            )}
                          >
                            {withinSchedule ? unified
                              ? new Set(values.map((value) => value.price.toFixed(2))).size === 1
                                ? formatMoney(majority?.[0]?.price ?? 0).replace('PEN', 'S/').replace(/\.00$/, '')
                                : majority?.[0]?.rule?.name ?? 'Base'
                              : `${groups.size} variantes`
                              : '—'}
                            {withinSchedule && boardView === 'unificado' ? <span className={cn('absolute inset-x-1 bottom-0.5 truncate text-[7px] font-semibold opacity-55', selected && 'opacity-75')}>{unified ? `${majority?.length ?? 0}/${cellTargets.length}` : `mayoría ${majority?.length ?? 0}/${cellTargets.length}`}</span> : null}
                            {withinSchedule && boardView === 'detalle' && detailRule ? <span className="absolute inset-x-1 bottom-0.5 truncate text-[7px] font-semibold opacity-55">{detailRule.name}</span> : null}
                          </button>
                        )
                        return withinSchedule ? (
                          <Tooltip key={`${row.key}-${hour}`}>
                            <TooltipTrigger asChild>{button}</TooltipTrigger>
                            <TooltipContent side="top" sideOffset={7} className="w-64 overflow-hidden rounded-xl bg-[#262725] p-0 text-left text-white shadow-lg">
                              <div className="border-b border-white/10 bg-white/[.035] px-3 py-2">
                                <p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-white/45">Detalle de tarifas</p>
                                <p className="mt-0.5 text-xs font-black text-white">{row.date ? `${row.label}, ${shortDate(row.date)}` : row.label} · {formatHour(hour)}–{hour === 23 ? '24:00' : formatHour(hour + 1)}</p>
                              </div>
                              <div className="space-y-1.5 p-2">
                                {[...valuesByCourt.values()].map((courtValues) => (
                                  <section key={courtValues[0].target.courtId} className="rounded-lg border border-white/8 bg-white/[.025] p-1.5">
                                    <div className="flex items-center justify-between gap-2 px-0.5 pb-1">
                                      <p className="text-[8px] font-extrabold uppercase tracking-[.1em] text-white/55">{courtValues[0].target.courtName}</p>
                                      <span className="text-[8px] font-semibold text-white/30">{courtValues.length} {courtValues.length === 1 ? 'deporte' : 'deportes'}</span>
                                    </div>
                                    <div className="space-y-0.5">
                                      {courtValues.map((value) => (
                                        <div key={targetKey(value.target)} className="flex items-center justify-between gap-2 rounded-md bg-white/[.045] px-1.5 py-1">
                                          <span className="flex min-w-0 items-center gap-1.5"><SportIcon name={value.target.sportName} size="xs" contrast /><span className="truncate text-[10px] font-bold capitalize text-white/80">{value.target.sportName}</span></span>
                                          <span className="shrink-0 text-[10px] font-black tabular-nums text-white">{formatMoney(value.price)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </section>
                                ))}
                              </div>
                              <p className="border-t border-white/10 px-3 py-1.5 text-[8px] text-white/40">Arrastra para seleccionar varias horas.</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : <div key={`${row.key}-${hour}`}>{button}</div>
                      }),
                    ]
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-[11px] font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border bg-background" />Tarifa base</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-sidebar" />Semanal</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-amber-300 bg-amber-100" />Promoción</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-[#8bb43a] bg-[#e8f4c8]" />Precios distintos</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-muted" />Fuera de atención</span>
                </div>
              </div>
            </div>
          </TooltipProvider>
        ) : <div className="px-6 py-14 text-center text-sm text-muted-foreground">Activa una cancha para visualizar sus precios.</div>}
      </Card>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-xl font-black tracking-[-.03em]">Reglas configuradas</h2><p className="mt-1 text-sm text-muted-foreground">Las promociones por fecha prevalecen sobre el precio semanal.</p></div>
          <div className="flex items-center gap-2 rounded-2xl border bg-card p-1">
            {([['todas', 'Todas'], ['recurrente', 'Semanales'], ['promocion', 'Promociones']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setListFilter(value)} className={cn('rounded-xl px-3 py-2 text-xs font-bold transition-colors', listFilter === value ? 'bg-sidebar text-sidebar-foreground' : 'hover:bg-muted')}>{label}</button>)}
          </div>
        </div>
        {filteredRules.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{filteredRules.map((rule) => <RuleCard key={rule.id} localId={localId} rule={rule} onEdit={(item) => openEditor(item)} />)}</div> : <div className="mt-4 rounded-3xl border border-dashed p-10 text-center"><p className="font-black">Aún no hay reglas en esta categoría</p><p className="mt-1 text-sm text-muted-foreground">La tarifa base seguirá aplicándose mientras no agregues una.</p></div>}
      </section>

      <Sheet modal={false} open={editorOpen} onOpenChange={(open) => open ? setEditorOpen(true) : closeEditor()}>
        <SheetContent
          side="right"
          floating
          showOverlay={false}
          showCloseButton={false}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className={cn(
            'transition-[width,max-height,transform] duration-300',
            editorMinimized
              ? 'top-auto! right-4! bottom-4! max-h-none! w-[min(20rem,calc(100vw-2rem))]! sm:top-auto! sm:right-6! sm:bottom-6! sm:w-80!'
              : 'w-[min(46rem,calc(100vw-2rem))]! sm:w-[46rem]!',
          )}
        >
          <div className={cn('items-center gap-3 p-3', editorMinimized ? 'flex' : 'hidden')}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><HugeiconsIcon icon={Money03Icon} strokeWidth={2} className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black">{editingRule ? `Editando ${editingRule.name}` : 'Nueva regla de precio'}</p>
              <p className="mt-0.5 truncate text-[10px] font-semibold text-muted-foreground">{selection ? `${selection.rows.length === 1 ? pricingDays.find((day) => day.value === selection.rows[0].day)?.label : `${selection.rows.length} días`} · ${formatHour(selection.startHour)}–${selection.endHour === 24 ? '24:00' : formatHour(selection.endHour)}` : 'Edición en curso'}</p>
            </div>
            <Button type="button" size="sm" onClick={() => setEditorMinimized(false)}><HugeiconsIcon icon={Maximize02Icon} strokeWidth={2} />Continuar</Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Cerrar editor" onClick={closeEditor}><HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} /></Button>
          </div>

          <SheetHeader className={cn('border-b px-6 py-5', editorMinimized && 'hidden')}>
            <SheetTitle className="pr-20 text-lg font-black">{editingRule ? `Editar ${editingRule.name}` : 'Nueva regla de precio'}</SheetTitle>
            <SheetDescription>El tablero permanece visible para conservar el contexto de días y horas.</SheetDescription>
            <div className="absolute right-4 top-4 flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Minimizar editor" title="Minimizar" onClick={() => setEditorMinimized(true)}><HugeiconsIcon icon={Minimize02Icon} strokeWidth={2} /></Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Cerrar editor" title="Cerrar" onClick={closeEditor}><HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} /></Button>
            </div>
          </SheetHeader>
          <div className={cn('overflow-y-auto px-6 py-5', editorMinimized && 'hidden')}>
            <RuleEditor key={editorKey} localId={localId} rule={editingRule} defaults={editorDefaults} targets={targets} schedules={schedules} rules={rules} onSaved={() => { closeEditor(); router.refresh() }} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
