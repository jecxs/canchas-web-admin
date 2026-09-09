'use client'

import { useActionState, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Clock01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { saveScheduleSettingsAction } from './actions'
import { useSettingsFormFeedback } from './form-feedback'
import { initialSettingsActionState, type ScheduleRow } from './types'

const days = [
  { short: 'Dom', label: 'Domingo' },
  { short: 'Lun', label: 'Lunes' },
  { short: 'Mar', label: 'Martes' },
  { short: 'Mié', label: 'Miércoles' },
  { short: 'Jue', label: 'Jueves' },
  { short: 'Vie', label: 'Viernes' },
  { short: 'Sáb', label: 'Sábado' },
] as const

const hourSlots = [
  ...Array.from({ length: 17 }, (_, index) => index + 6),
  ...Array.from({ length: 6 }, (_, hour) => hour),
]
const hours = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)
type DayRange = [number, number]
type DragState = { day: number; start: number } | null

function hourFromTime(value: string | undefined, fallback: number) {
  const hour = Number(value?.slice(0, 2))
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : fallback
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

function initialRanges(schedules: ScheduleRow[]) {
  return days.reduce<Record<number, DayRange>>((ranges, _, day) => {
    const schedule = schedules.find((row) => row.dia_semana === day)
    ranges[day] = [
      hourFromTime(schedule?.hora_apertura, 7),
      hourFromTime(schedule?.hora_cierre, 23),
    ]
    return ranges
  }, {})
}

export function ScheduleSettingsForm({ localId, schedules }: { localId: string; schedules: ScheduleRow[] }) {
  const [openDays, setOpenDays] = useState<Set<number>>(() => new Set(schedules.map((row) => row.dia_semana)))
  const [activeDay, setActiveDay] = useState(() => schedules[0]?.dia_semana ?? 1)
  const [ranges, setRanges] = useState<Record<number, DayRange>>(() => initialRanges(schedules))
  const [dragging, setDragging] = useState<DragState>(null)
  const [state, action, pending] = useActionState(saveScheduleSettingsAction, initialSettingsActionState)
  useSettingsFormFeedback(state)

  const activeRange = ranges[activeDay] ?? [7, 23]
  const activeIsOpen = openDays.has(activeDay)
  const activeDayLabel = days[activeDay]?.label ?? 'Día'

  function toggle(day: number) {
    setActiveDay(day)
    setOpenDays((value) => {
      const next = new Set(value)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  function updateOpening(value: string) {
    const opening = Number(value)
    setRanges((current) => ({ ...current, [activeDay]: [opening, current[activeDay][1]] }))
  }

  function updateClosing(value: string) {
    const closing = Number(value)
    setRanges((current) => ({ ...current, [activeDay]: [current[activeDay][0], closing] }))
  }

  function startPainting(event: ReactPointerEvent<HTMLButtonElement>, day: number, hour: number) {
    setActiveDay(day)
    if (event.pointerType === 'touch') return
    event.preventDefault()
    setDragging({ day, start: hour })
  }

  function paintUntil(event: ReactPointerEvent<HTMLButtonElement>, day: number, hour: number) {
    if (!dragging || dragging.day !== day) return
    if (event.buttons === 0) {
      setDragging(null)
      return
    }
    if ((dragging.start < 6) !== (hour < 6)) return

    const opening = Math.min(dragging.start, hour)
    const closing = Math.max(dragging.start, hour) + 1
    setRanges((current) => ({ ...current, [day]: [opening, closing] }))
    setOpenDays((value) => new Set(value).add(day))
  }

  return (
    <Card id="horarios" className="scroll-mt-24 overflow-hidden">
      <CardHeader>
        <CardTitle>Horarios de atención</CardTitle>
        <CardDescription>Compara la semana completa y configura cada jornada por horas punto.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} onReset={(event) => event.preventDefault()} className="space-y-5">
          <input type="hidden" name="localId" value={localId} />
          {days.map((_, day) => {
            const range = ranges[day]
            return (
              <span key={day}>
                {openDays.has(day) ? <input type="hidden" name="openDay" value={day} /> : null}
                <input type="hidden" name={`opening_${day}`} value={formatHour(range[0])} />
                <input type="hidden" name={`closing_${day}`} value={formatHour(range[1])} />
              </span>
            )
          })}

          <div className="overflow-hidden rounded-3xl border bg-muted/15">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5">
              <div>
                <p className="text-sm font-bold">Tablero semanal</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Haz clic en un día para editarlo. En escritorio, arrastra sobre sus horas para dibujar el rango.</p>
              </div>
              <span className="rounded-full bg-[#e8f4c8] px-3 py-1 text-xs font-bold text-[#35520d]">
                {openDays.size} {openDays.size === 1 ? 'día abierto' : 'días abiertos'}
              </span>
            </div>

            <div className="overflow-x-auto p-3 sm:p-4">
              <div className="min-w-[800px] select-none" onPointerLeave={() => setDragging(null)} onPointerUp={() => setDragging(null)}>
                <div className="grid grid-cols-[112px_repeat(23,minmax(18px,1fr))] gap-1 px-1 pb-2">
                  <span className="mr-2 border-r pr-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Día</span>
                  <div className="col-span-23 grid h-6 grid-cols-[repeat(23,minmax(18px,1fr))] gap-1">
                    {hourSlots.map((hour, index) => (
                      <span key={hour} className="relative">
                        {hour % 3 === 0 ? (
                          <span
                            className={cn(
                              'absolute left-0 top-0 text-[9px] font-semibold tabular-nums text-muted-foreground',
                              index === 0 ? 'translate-x-0' : '-translate-x-1/2',
                              hour === 0 && 'border-l border-foreground/20 pl-1.5',
                            )}
                          >
                            {String(hour).padStart(2, '0')}
                          </span>
                        ) : null}
                        {index === hourSlots.length - 1 ? <span className="absolute right-0 top-0 text-[9px] font-semibold tabular-nums text-muted-foreground">06</span> : null}
                        {hour % 3 === 0 ? <span aria-hidden="true" className={cn('absolute bottom-0 left-0 h-1.5 border-l border-border', hour === 0 && 'border-foreground/30')} /> : null}
                        {index === hourSlots.length - 1 ? <span aria-hidden="true" className="absolute bottom-0 right-0 h-1.5 border-r border-border" /> : null}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  {days.map((day, dayIndex) => {
                    const isOpen = openDays.has(dayIndex)
                    const isActive = activeDay === dayIndex
                    const [opening, closing] = ranges[dayIndex]

                    return (
                      <div
                        key={day.label}
                        className={cn(
                          'grid grid-cols-[112px_repeat(23,minmax(18px,1fr))] gap-1 rounded-xl p-1 transition-colors',
                          isActive ? 'bg-foreground/[.06] ring-1 ring-foreground/15' : 'hover:bg-muted/60',
                        )}
                      >
                        <div className="mr-2 flex min-w-0 items-center gap-2 border-r border-border/80 pr-3">
                          <button type="button" onClick={() => setActiveDay(dayIndex)} className="min-w-0 flex-1 rounded-md text-left text-xs font-extrabold outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            {day.short}
                          </button>
                          <label className="shrink-0 cursor-pointer">
                            <span className="sr-only">{isOpen ? `Cerrar ${day.label}` : `Abrir ${day.label}`}</span>
                            <input type="checkbox" checked={isOpen} onChange={() => toggle(dayIndex)} className="peer sr-only" />
                            <span className="block h-4 w-7 rounded-full bg-muted-foreground/25 p-0.5 transition-colors peer-checked:bg-[#86b72b] peer-checked:[&>span]:translate-x-3 peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                              <span className="block size-3 rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-transform" />
                            </span>
                          </label>
                        </div>

                        {hourSlots.map((hour) => {
                          const isInsideRange = isOpen && hour >= opening && hour < closing
                          const isEdge = isInsideRange && (hour === opening || hour === closing - 1)
                          return (
                            <button
                              key={hour}
                              type="button"
                              tabIndex={-1}
                              aria-label={`${day.label}, ${formatHour(hour)} a ${formatHour(hour + 1)}${isInsideRange ? ', abierto' : ', cerrado'}`}
                              title={`${formatHour(hour)}–${formatHour(hour + 1)}`}
                              onClick={() => setActiveDay(dayIndex)}
                              onPointerDown={(event) => startPainting(event, dayIndex, hour)}
                              onPointerEnter={(event) => paintUntil(event, dayIndex, hour)}
                              className={cn(
                                'h-8 rounded-md border border-transparent outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                                isInsideRange
                                  ? 'bg-[#a6d538] hover:bg-[#96c62e]'
                                  : 'bg-muted/70 hover:bg-muted-foreground/20',
                                isEdge && 'ring-1 ring-[#688f18]/35',
                                !isOpen && 'bg-muted/35',
                              )}
                            />
                          )
                        })}
                      </div>
                    )
                  })}
                </div>

              </div>
            </div>
          </div>

          <div className={cn('rounded-2xl border p-4 transition-colors sm:p-5', activeIsOpen ? 'bg-background' : 'border-dashed bg-muted/20')}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={cn('grid size-9 place-items-center rounded-xl', activeIsOpen ? 'bg-[#a6d538] text-[#182600]' : 'bg-muted text-muted-foreground')}>
                  <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4.5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Editando</p>
                  <p className="font-black">{activeDayLabel}</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => toggle(activeDay)}>
                {activeIsOpen ? 'Marcar cerrado' : 'Abrir este día'}
              </Button>
            </div>

            {activeIsOpen ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
                <label className="grid gap-1.5 text-sm font-semibold">
                  <span>Apertura</span>
                  <select value={activeRange[0]} onChange={(event) => updateOpening(event.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-3 focus:ring-ring/40">
                    {hours.slice(0, activeRange[1]).map((hour, index) => <option key={hour} value={index}>{hour}</option>)}
                  </select>
                </label>
                <span className="hidden pb-3 text-xs text-muted-foreground sm:block">hasta</span>
                <label className="grid gap-1.5 text-sm font-semibold">
                  <span>Cierre</span>
                  <select value={activeRange[1]} onChange={(event) => updateClosing(event.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-3 focus:ring-ring/40">
                    {hours.slice(activeRange[0] + 1).map((hour, index) => {
                      const value = activeRange[0] + index + 1
                      return <option key={hour} value={value}>{hour}</option>
                    })}
                  </select>
                </label>
                <span className="rounded-full bg-[#e8f4c8] px-3 py-2 text-center text-xs font-black whitespace-nowrap text-[#35520d]">
                  {activeRange[1] - activeRange[0]} h abiertas
                </span>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Este día no aparecerá como disponible para reservas.</p>
            )}
          </div>

          <FieldError errors={state.fieldErrors?.schedules?.map((message) => ({ message }))} />
          <Button type="submit" disabled={pending}>{pending && <Spinner />}Guardar horarios</Button>
        </form>
      </CardContent>
    </Card>
  )
}
