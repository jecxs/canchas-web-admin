'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type DragEvent, type MouseEvent } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Calendar03Icon, CheckmarkCircle01Icon, Clock01Icon, FilterHorizontalIcon, MoreHorizontalIcon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverAnchor, PopoverContent, PopoverDescription, PopoverTitle } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { notify } from '@/lib/notifications/notify'
import { createClient } from '@/utils/supabase/client'
import { formatAgendaDate, getLocalMinutes, getTodayInLima, getWeekStart, isoToLocalTime, localDateTimeToIso, minutesToTime, shiftAgendaDate, timeToMinutes } from './date-utils'
import { CancelReservationForm, ConfirmReservationForm, EncasedBookingForm, ExtendReservationForm, MaintenanceForm, ManualBookingForm, NoShowReservationForm, PaymentMovementForm, RejectReservationForm, RescheduleReservationForm } from './operation-forms'
import type { AgendaCourt, AgendaData, AgendaOccupation } from './types'

type Slot = { start: number; end: number; label: string }
type SelectedCell = { date: string; courtId: string; courtName: string; slot: Slot; occupation?: AgendaOccupation; blocks?: number }
type ContextMenuState = { x: number; y: number; cell: SelectedCell }
type Operation = 'summary' | 'manual' | 'maintenance' | 'encajada' | 'extend' | 'confirm' | 'reject' | 'move' | 'cancel' | 'no-show' | 'payment'
type ReservationRealtimeRecord = { id?: unknown; cancha_id?: unknown; estado?: unknown }
type DragPreview = { date: string; courtId: string; start: number; end: number; allowed: boolean }

function asReservationRealtimeRecord(value: unknown): ReservationRealtimeRecord {
  return value && typeof value === 'object' ? value as ReservationRealtimeRecord : {}
}

function isWithinSelectedRange(selection: SelectedCell | null, day: AgendaData, court: AgendaCourt, slot: Slot) {
  if (!selection || selection.date !== day.date || selection.courtId !== court.id) return false
  const blocks = selection.blocks ?? 1
  return slot.start >= selection.slot.start && slot.start < selection.slot.start + blocks * 60
}

function buildSlots(openingTime: string | null, closingTime: string | null) {
  if (!openingTime || !closingTime) return []
  const opening = timeToMinutes(openingTime)
  let closing = timeToMinutes(closingTime)
  if (closing <= opening) closing += 24 * 60
  const slots: Slot[] = []
  for (let start = opening; start < closing; start += 60) {
    const end = Math.min(start + 60, closing)
    slots.push({ start, end, label: minutesToTime(start) })
  }
  return slots
}

function getOccupationSegment(occupations: AgendaOccupation[], courtId: string, slot: Slot) {
  const match = occupations.find((occupation) => {
    if (occupation.courtId !== courtId) return false
    const start = getLocalMinutes(occupation.start)
    let end = getLocalMinutes(occupation.end)
    if (end <= start) end += 24 * 60
    return end > slot.start && start < slot.end
  })
  if (!match) return undefined
  const occupationStart = getLocalMinutes(match.start)
  let occupationEnd = getLocalMinutes(match.end)
  if (occupationEnd <= occupationStart) occupationEnd += 24 * 60
  const overlapStart = Math.max(slot.start, occupationStart)
  return {
    occupation: match,
    top: ((overlapStart - slot.start) / 60) * 100,
    // Solo la celda donde empieza la ocupación dibuja la tarjeta. Su altura
    // cruza las siguientes filas para comunicar una única reserva continua.
    isAnchor: occupationStart >= slot.start && occupationStart < slot.end,
    durationMinutes: occupationEnd - occupationStart,
  }
}

function occupationLabel(occupation?: AgendaOccupation) {
  if (!occupation) return 'Bloque libre'
  if (occupation.type === 'mantenimiento') return 'Mantenimiento'
  return occupation.isException ? 'Extensión autorizada' : 'Reserva registrada'
}

function reservationStatusLabel(status?: string) {
  switch (status) {
    case 'pendiente_validacion': return 'Por validar'
    case 'pendiente_pago': return 'Pendiente de pago'
    case 'confirmada': return 'Confirmada'
    case 'completada': return 'Completada'
    default: return 'Reserva'
  }
}

function reservationTone(status?: string) {
  switch (status) {
    case 'pendiente_validacion': return 'border-warning bg-warning text-warning-foreground'
    case 'pendiente_pago': return 'border-info bg-info text-info-foreground'
    case 'completada': return 'border-success bg-success text-success-foreground'
    case 'confirmada': return 'border-primary bg-primary text-primary-foreground'
    default: return 'border-secondary bg-secondary text-secondary-foreground'
  }
}

function statusDot(status?: string) {
  switch (status) {
    case 'pendiente_validacion': return 'bg-warning'
    case 'pendiente_pago': return 'bg-info'
    case 'completada': return 'bg-success'
    case 'confirmada': return 'bg-primary'
    default: return 'bg-secondary'
  }
}

function reservationStatusBadgeTone(status?: string) {
  switch (status) {
    case 'pendiente_validacion': return 'bg-warning text-warning-foreground'
    case 'pendiente_pago': return 'bg-info text-info-foreground'
    case 'completada': return 'bg-success text-success-foreground'
    case 'confirmada': return 'bg-primary text-primary-foreground'
    default: return 'bg-secondary text-secondary-foreground'
  }
}

function isImageProof(path?: string | null) {
  return Boolean(path && /\.(png|jpe?g|webp|gif)$/i.test(path))
}

function formatAmount(amount?: number) {
  return typeof amount === 'number' ? `S/ ${amount.toFixed(2)}` : null
}

function buildAgendaUrl(pathname: string, date: string, sportId: string, view: 'day' | 'week', courtId?: string) {
  const params = new URLSearchParams({ date, view })
  if (sportId) params.set('sport', sportId)
  if (view === 'week' && courtId) params.set('court', courtId)
  return `${pathname}?${params.toString()}`
}

function weekSlots(weekData: AgendaData[]) {
  const values = new Set<number>()
  weekData.forEach((day) => buildSlots(day.openingTime, day.closingTime).forEach((slot) => values.add(slot.start)))
  return Array.from(values).sort((a, b) => a - b).map((start) => ({ start, end: start + 60, label: minutesToTime(start) }))
}

export function AgendaBoard({ data, selectedSportId = '', view = 'day', weekData, selectedCourtId = '', highlightReservationId = '' }: { data: AgendaData; selectedSportId?: string; view?: 'day' | 'week'; weekData?: AgendaData[]; selectedCourtId?: string; highlightReservationId?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([])
  const [selectionPopoverPosition, setSelectionPopoverPosition] = useState({ x: 0, y: 0 })
  const [operation, setOperation] = useState<Operation>('summary')
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const openingLightbox = useRef(false)
  const [draggedReservation, setDraggedReservation] = useState<AgendaOccupation | null>(null)
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const [nowMs, setNowMs] = useState(0)
  const announcedPaymentHolds = useRef(new Set<string>())
  const isWeek = view === 'week' && Boolean(weekData?.length)
  const days = useMemo(() => isWeek ? weekData! : [data], [isWeek, weekData, data])
  const selectedCourt = data.courts.find((court) => court.id === selectedCourtId) ?? data.courts[0]
  const dailySlots = useMemo(() => buildSlots(data.openingTime, data.closingTime), [data.openingTime, data.closingTime])
  const weeklySlots = useMemo(() => weekSlots(days), [days])
  const occupiedCourts = new Set(data.occupations.map((occupation) => occupation.courtId)).size
  const selectedOccupation = selectedCell?.occupation
  const selectionStart = selectedCells[0]
  const selectionBlocks = selectedCells.length || 1
  const selectionEndTime = selectionStart ? minutesToTime(selectionStart.slot.start + selectionBlocks * 60) : '01:00'
  const selectedStartTime = selectedCell ? minutesToTime(selectedCell.slot.start) : '00:00'
  const selectedBlocks = selectedCell?.blocks ?? 1
  const selectedEndTime = selectedCell ? minutesToTime(selectedCell.slot.start + selectedBlocks * 60) : '01:00'
  const encasedStartTime = selectedOccupation ? isoToLocalTime(selectedOccupation.end) : '00:30'

  useEffect(() => {
    const refresh = () => setNowMs(Date.now())
    refresh()
    const interval = window.setInterval(refresh, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!highlightReservationId) return
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-reservation-id="${highlightReservationId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [highlightReservationId, data.date, view])

  useEffect(() => {
    const courtsById = new Map(data.courts.map((court) => [court.id, court.name]))
    const supabase = createClient()
    const channel = supabase
      .channel(`owner-agenda-reservations:${data.localId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, (payload) => {
        const current = asReservationRealtimeRecord(payload.new)
        const previous = asReservationRealtimeRecord(payload.old)
        const courtId = typeof current.cancha_id === 'string' ? current.cancha_id : previous.cancha_id
        if (typeof courtId !== 'string' || !courtsById.has(courtId)) return

        // Un apartado es útil en la Agenda, pero no merece una fila persistente
        // en la campana: normalmente desaparecerá si el cliente no paga.
        if (payload.eventType === 'INSERT' && current.estado === 'pendiente_pago' && typeof current.id === 'string' && !announcedPaymentHolds.current.has(current.id)) {
          announcedPaymentHolds.current.add(current.id)
          notify.info({
            title: 'Horario apartado temporalmente',
            description: `${courtsById.get(courtId)} está en proceso de pago. El bloque se liberará si no se envía comprobante.`,
            icon: <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2.25} className="size-4 text-primary" />,
            duration: 8_000,
            roundness: 18,
            autopilot: { expand: 0, collapse: 6_000 },
            styles: {
              title: 'font-sans font-extrabold text-sidebar-foreground!',
              description: 'font-sans text-sidebar-foreground/80!',
            },
          })
        }

        // Insert, comprobante enviado, expiración o liberación: todos cambian la
        // ocupación que el dueño ve en la Agenda.
        router.refresh()
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') router.refresh()
      })

    return () => { void supabase.removeChannel(channel) }
  }, [data.courts, data.localId, router])

  useEffect(() => {
    // Respaldo para una pestaña suspendida o una reconexión silenciosa. El canal
    // Realtime es inmediato; esta consulta solo corrige una posible pérdida.
    const reconcile = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const interval = window.setInterval(reconcile, 30_000)
    window.addEventListener('online', reconcile)
    document.addEventListener('visibilitychange', reconcile)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('online', reconcile)
      document.removeEventListener('visibilitychange', reconcile)
    }
  }, [router])

  function navigate(date: string) {
    startTransition(() => router.push(buildAgendaUrl(pathname, date, selectedSportId, view, selectedCourt?.id)))
  }

  function closeDialog() {
    setSelectedCell(null)
    setSelectedCells([])
    setOperation('summary')
    openingLightbox.current = false
    setLightboxOpen(false)
  }

  function openProofLightbox() {
    // The proof viewer is portalled above the non-modal Sheet. Keep the Sheet
    // from interpreting that new focus target as an outside interaction.
    openingLightbox.current = true
    setLightboxOpen(true)
  }

  function onProofLightboxChange(open: boolean) {
    setLightboxOpen(open)
    if (!open) openingLightbox.current = false
  }

  function openCell(day: AgendaData, court: AgendaCourt, slot: Slot, event: MouseEvent<HTMLButtonElement>) {
    const segment = getOccupationSegment(day.occupations, court.id, slot)
    const cell = { date: day.date, courtId: court.id, courtName: court.name, slot, occupation: segment?.occupation }
    if (event.ctrlKey || event.metaKey) {
      if (segment) return
      const current = selectedCells
      const alreadySelected = current.some((item) => item.date === cell.date && item.courtId === cell.courtId && item.slot.start === cell.slot.start)
      if (alreadySelected) {
        const next = current.filter((item) => !(item.date === cell.date && item.courtId === cell.courtId && item.slot.start === cell.slot.start))
        const remainsContiguous = next.every((item, index) => index === 0 || item.slot.start - next[index - 1].slot.start === 60)
        setSelectedCells(remainsContiguous ? next : [])
        return
      }
      const next = [...current, cell].sort((a, b) => a.slot.start - b.slot.start)
      if (next.length > 4) {
        notify.warning({ description: 'Puedes seleccionar hasta 4 horas en una reserva manual.' })
        return
      }
      const sameLane = next.every((item) => item.date === cell.date && item.courtId === cell.courtId)
      const contiguous = next.every((item, index) => index === 0 || item.slot.start - next[index - 1].slot.start === 60)
      if (!sameLane || !contiguous) {
        notify.warning({ description: 'Selecciona bloques consecutivos de la misma cancha y fecha.' })
        return
      }
      setSelectedCells(next)
      setSelectionPopoverPosition({ x: event.clientX, y: event.clientY })
      setContextMenu(null)
      return
    }
    if (!segment && isPastSlot(day, slot)) {
      notify.warning({ description: 'Esta hora ya pasó y no admite nuevas operaciones.' })
      return
    }
    if (!segment) {
      setSelectedCells([cell])
      setSelectionPopoverPosition({ x: event.clientX, y: event.clientY })
      setContextMenu(null)
      return
    }
    setSelectedCell(cell)
    setSelectedCells([])
    setOperation('summary')
    setContextMenu(null)
  }

  function openSelectionOperation(nextOperation: 'manual' | 'maintenance') {
    if (!selectionStart) return
    setSelectedCell({ ...selectionStart, blocks: selectionBlocks })
    setSelectedCells([])
    setOperation(nextOperation)
  }

  function openFirstFree(operationToOpen: Operation) {
    for (const day of days) {
      const courtList = isWeek && selectedCourt ? [selectedCourt] : data.courts
      for (const slot of buildSlots(day.openingTime, day.closingTime)) {
        for (const court of courtList) {
          if (!getOccupationSegment(day.occupations, court.id, slot) && !isPastSlot(day, slot)) {
            setSelectedCell({ date: day.date, courtId: court.id, courtName: court.name, slot })
            setOperation(operationToOpen)
            return
          }
        }
      }
    }
  }

  function changeView(nextView: 'day' | 'week') {
    const nextDate = nextView === 'week' ? getWeekStart(data.date) : data.date
    startTransition(() => router.push(buildAgendaUrl(pathname, nextDate, selectedSportId, nextView, selectedCourt?.id)))
  }

  function isPastSlot(day: AgendaData, slot: Slot) {
    const instant = localDateTimeToIso(day.date, minutesToTime(slot.start))
    return !instant || new Date(instant).getTime() <= nowMs
  }

  function canMove(occupation?: AgendaOccupation) {
    return Boolean(occupation?.type === 'reserva' && occupation.reservationId && !occupation.isException && ['pendiente_validacion', 'confirmada'].includes(occupation.reservationStatus ?? '') && new Date(occupation.start).getTime() > nowMs)
  }

  function canDropReservation(reservation: AgendaOccupation, day: AgendaData, court: AgendaCourt, slot: Slot) {
    if (!canMove(reservation) || isPastSlot(day, slot) || !reservation.sportId || !court.sports.some((sport) => sport.id === reservation.sportId)) return false
    const durationMinutes = Math.round((new Date(reservation.end).getTime() - new Date(reservation.start).getTime()) / 60000)
    // Una reserva normal ocupa horas completas. La única duración que puede
    // terminar en :30 es una reserva existente con extensión autorizada; el
    // RPC vuelve a comprobar la auditoría antes de guardar el movimiento.
    if (durationMinutes < 60 || (durationMinutes % 60 !== 0 && durationMinutes % 60 !== 30)) return false
    const targetEnd = slot.start + durationMinutes
    const openingSlots = buildSlots(day.openingTime, day.closingTime)
    if (!openingSlots.some((candidate) => candidate.start === slot.start) || targetEnd > (openingSlots.at(-1)?.end ?? 0)) return false
    for (let minute = slot.start; minute < targetEnd; minute += 60) {
      const targetSlot = openingSlots.find((candidate) => candidate.start === minute)
      if (!targetSlot) return false
      const existing = getOccupationSegment(day.occupations, court.id, targetSlot)?.occupation
      if (existing && existing.reservationId !== reservation.reservationId) return false
    }
    return true
  }

  function onReservationDragStart(event: DragEvent<HTMLButtonElement>, occupation: AgendaOccupation) {
    if (!canMove(occupation)) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', occupation.reservationId ?? '')
    setDraggedReservation(occupation)
  }

  function onReservationDrop(event: DragEvent<HTMLButtonElement>, day: AgendaData, court: AgendaCourt, slot: Slot) {
    event.preventDefault()
    const reservation = draggedReservation
    setDragPreview(null)
    setDraggedReservation(null)
    if (!reservation) return
    if (!canDropReservation(reservation, day, court, slot)) {
      notify.warning({ description: 'No se puede soltar ahí: revisa cancha, horario, duración o un cruce existente.' })
      return
    }
    setSelectedCell({ date: day.date, courtId: court.id, courtName: court.name, slot, occupation: reservation })
    setOperation('move')
  }

  function renderCell(day: AgendaData, court: AgendaCourt, slot: Slot) {
    const segment = getOccupationSegment(day.occupations, court.id, slot)
    // selectedCell conserva blocks al abrir el formulario; así el rango sigue
    // visible y no aparenta reducirse al primer bloque seleccionado.
    const selected = isWithinSelectedRange(selectedCell, day, court, slot)
    const selectedByCtrl = selectedCells.some((item) => item.date === day.date && item.courtId === court.id && item.slot.start === slot.start)
    const past = !segment && isPastSlot(day, slot)
    const dragKey = `${day.date}-${court.id}-${slot.start}`
    const dropAllowed = Boolean(draggedReservation && canDropReservation(draggedReservation, day, court, slot))
    const isDragPreview = Boolean(dragPreview && dragPreview.date === day.date && dragPreview.courtId === court.id && slot.start >= dragPreview.start && slot.start < dragPreview.end)
    const dragPreviewAllowed = dragPreview?.allowed ?? false
    const isHighlighted = segment?.occupation.reservationId === highlightReservationId
    const isDraggable = Boolean(segment?.occupation && canMove(segment.occupation))
    // El botón de la celda vuelve a ser la fuente del arrastre: los navegadores
    // no inician un drag HTML5 desde un hijo de <button>. La tarjeta unida es
    // pointer-events-none para que dragover/drop resuelvan la celda real bajo
    // el cursor, aunque la tarjeta visualmente cubra las filas siguientes.
    return <button key={dragKey} type="button" disabled={past} draggable={isDraggable} onDragStart={(event) => { if (segment?.occupation) onReservationDragStart(event, segment.occupation) }} onDragEnd={() => { setDraggedReservation(null); setDragPreview(null) }} className={`group relative min-h-16 overflow-visible border-r border-b p-1.5 text-left outline-none transition-colors duration-300 last:border-r-0 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${past ? 'cursor-not-allowed bg-muted/55 text-muted-foreground' : 'hover:bg-primary/8 focus-visible:bg-primary/10'} ${selected || selectedByCtrl ? 'bg-primary/18' : 'bg-background'} ${isDragPreview ? (dragPreviewAllowed ? 'bg-primary/15' : 'bg-destructive/10') : ''}`} onDragOver={(event) => { if (!draggedReservation) return; event.preventDefault(); const durationMinutes = Math.round((new Date(draggedReservation.end).getTime() - new Date(draggedReservation.start).getTime()) / 60000); setDragPreview({ date: day.date, courtId: court.id, start: slot.start, end: slot.start + durationMinutes, allowed: dropAllowed }); event.dataTransfer.dropEffect = dropAllowed ? 'move' : 'none' }} onDrop={(event) => onReservationDrop(event, day, court, slot)} onClick={(event) => openCell(day, court, slot, event)} onContextMenu={(event) => { if (past) return; event.preventDefault(); setSelectedCells([]); setContextMenu({ x: Math.min(event.clientX, window.innerWidth - 240), y: Math.min(event.clientY, window.innerHeight - 220), cell: { date: day.date, courtId: court.id, courtName: court.name, slot, occupation: segment?.occupation } }) }}><span className={`pointer-events-none absolute inset-1 rounded-lg border transition-colors duration-300 ${isDragPreview ? (dragPreviewAllowed ? 'border-primary' : 'border-destructive') : selected || selectedByCtrl ? 'border-primary/75 bg-primary/8' : 'border-transparent group-hover:border-primary/30'}`} />{segment?.isAnchor ? <span data-reservation-id={segment.occupation.reservationId} className={`pointer-events-none absolute z-10 inset-x-1 overflow-hidden rounded-lg border px-2 py-1.5 text-[11px] font-bold leading-tight shadow-sm transition-colors duration-300 ${isHighlighted ? 'animate-[pulse_1.1s_ease-in-out_5] ring-4 ring-primary/50 ring-offset-2 ring-offset-background' : ''} ${segment.occupation.type === 'mantenimiento' ? 'border-secondary bg-secondary text-secondary-foreground' : reservationTone(segment.occupation.reservationStatus)}`} style={{ top: `calc(${segment.top}% + 0.375rem)`, height: `calc(${segment.durationMinutes / 15}rem - 0.75rem)` }}><span className="block truncate">{segment.occupation.type === 'mantenimiento' ? occupationLabel(segment.occupation) : reservationStatusLabel(segment.occupation.reservationStatus)}</span>{segment.durationMinutes > 60 && <span className="mt-0.5 block truncate text-[10px] font-semibold opacity-75">{isoToLocalTime(segment.occupation.start)} – {isoToLocalTime(segment.occupation.end)}</span>}{segment.occupation.type === 'reserva' && isHighlighted && <span className="mt-0.5 block truncate text-[10px] font-semibold">Revisar esta reserva</span>}{segment.occupation.type === 'reserva' && canMove(segment.occupation) && <span className="mt-0.5 block truncate text-[10px] font-semibold opacity-75">Arrastra para mover</span>}{segment.occupation.type === 'reserva' && segment.occupation.isException && <span className="mt-0.5 block truncate text-[10px] font-semibold opacity-75">+30 min</span>}</span> : segment ? null : past ? <span className="pointer-events-none absolute inset-0 grid place-items-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground/80">Hora pasada</span> : <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-bold text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">+</span>}<span className="sr-only">{court.name}, {day.date}, {slot.label}, {past ? 'hora pasada' : occupationLabel(segment?.occupation)}</span></button>
  }

  function renderDailyGrid() {
    return <div className="overflow-x-auto"><div className="min-w-[760px]"><div className="grid border-b bg-background" style={{ gridTemplateColumns: `72px repeat(${data.courts.length}, minmax(170px, 1fr))` }}><div className="sticky left-0 z-10 border-r bg-background px-3 py-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-muted-foreground">Hora</div>{data.courts.map((court) => <div key={court.id} className="border-r px-4 py-2.5 last:border-r-0"><p className="truncate text-sm font-extrabold">{court.name}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{court.sports.map((sport) => sport.name).join(' · ') || 'Sin deporte'}</p></div>)}</div>{dailySlots.map((slot) => <div key={slot.start} className="grid" style={{ gridTemplateColumns: `72px repeat(${data.courts.length}, minmax(170px, 1fr))` }}><div className="sticky left-0 z-10 flex min-h-16 items-start justify-end border-r border-b bg-background px-3 py-1.5 text-[11px] font-bold tabular-nums text-muted-foreground">{slot.label}</div>{data.courts.map((court) => renderCell(data, court, slot))}</div>)}</div></div>
  }

  function renderWeeklyGrid() {
    if (!selectedCourt) return <div className="px-6 py-16 text-center"><p className="font-bold">Selecciona una cancha</p><p className="mt-2 text-sm text-muted-foreground">Necesitas una cancha activa para ver la semana.</p></div>
    return <div className="overflow-x-auto"><div className="min-w-[1120px]"><div className="grid border-b bg-background" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(145px, 1fr))` }}><div className="sticky left-0 z-10 border-r bg-background px-3 py-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-muted-foreground">Hora</div>{days.map((day) => <div key={day.date} className="border-r px-3 py-2.5 text-center last:border-r-0"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">{formatAgendaDate(day.date).split(',')[0]}</p><p className="mt-0.5 text-lg font-black tracking-[-.04em]">{day.date.slice(-2)}</p></div>)}</div>{weeklySlots.map((slot) => <div key={slot.start} className="grid" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(145px, 1fr))` }}><div className="sticky left-0 z-10 flex min-h-16 items-start justify-end border-r border-b bg-background px-3 py-1.5 text-[11px] font-bold tabular-nums text-muted-foreground">{slot.label}</div>{days.map((day) => { const available = buildSlots(day.openingTime, day.closingTime).some((candidate) => candidate.start === slot.start); return available ? renderCell(day, selectedCourt, slot) : <div key={`${day.date}-${slot.start}`} className="grid min-h-16 place-items-center border-r border-b bg-muted/45 px-2 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground/75 last:border-r-0" aria-label={`${day.date}, fuera de horario`}>Fuera de horario</div> })}</div>)}</div></div>
  }

  function renderDialog() {
    if (!selectedCell) return null
    const court = data.courts.find((item) => item.id === selectedCell.courtId)
    if (operation === 'manual' && court) return <><SheetHeader><SheetTitle>Registrar reserva manual</SheetTitle><SheetDescription>Reserva recibida por WhatsApp o de forma presencial.</SheetDescription></SheetHeader><ManualBookingForm key={`${selectedCell.date}-${selectedCell.courtId}-${selectedStartTime}-${selectedBlocks}`} localId={data.localId} date={selectedCell.date} court={court} startTime={selectedStartTime} initialBlocks={selectedBlocks} defaultSportId={selectedOccupation?.sportId} onCancel={() => setOperation('summary')} onSuccess={closeDialog} /></>
    if (operation === 'maintenance' && court) return <><SheetHeader><SheetTitle>Bloquear horario</SheetTitle><SheetDescription>El bloqueo evita nuevas reservas en este rango.</SheetDescription></SheetHeader><MaintenanceForm localId={data.localId} date={selectedCell.date} court={court} startTime={selectedStartTime} endTime={selectedEndTime} onCancel={() => setOperation('summary')} onSuccess={closeDialog} /></>
    if (operation === 'encajada' && selectedOccupation) return <><SheetHeader><SheetTitle>Registrar reserva encajada</SheetTitle><SheetDescription>Usa los 30 minutos restantes y la siguiente hora completa.</SheetDescription></SheetHeader><EncasedBookingForm localId={data.localId} date={selectedCell.date} startTime={encasedStartTime} sportOptions={court?.sports ?? data.sports} defaultSportId={selectedOccupation.sportId} onCancel={() => setOperation('summary')} onSuccess={closeDialog} /></>
    if (operation === 'extend' && selectedOccupation?.reservationId) return <><SheetHeader><SheetTitle>Autorizar extensión</SheetTitle><SheetDescription>{selectedCell.courtName} · {selectedCell.date}</SheetDescription></SheetHeader><ExtendReservationForm reservationId={selectedOccupation.reservationId} onCancel={() => setOperation('summary')} onSuccess={closeDialog} /></>
    if (operation === 'confirm' && selectedOccupation?.reservationId) return <><SheetHeader><SheetTitle>Confirmar reserva</SheetTitle><SheetDescription>Verifica el comprobante antes de aprobar el pago.</SheetDescription></SheetHeader><ConfirmReservationForm reservationId={selectedOccupation.reservationId} onCancel={() => setOperation('summary')} onSuccess={closeDialog} /></>
    if (operation === 'reject' && selectedOccupation?.reservationId) return <><SheetHeader><SheetTitle>Rechazar comprobante</SheetTitle><SheetDescription>La reserva se liberará y el cliente verá el motivo indicado.</SheetDescription></SheetHeader><RejectReservationForm reservationId={selectedOccupation.reservationId} onCancel={() => setOperation('summary')} onSuccess={closeDialog} /></>
    if (operation === 'move' && selectedOccupation?.reservationId && court) return <><SheetHeader><SheetTitle>Reprogramar reserva</SheetTitle><SheetDescription>Confirma el nuevo destino antes de aplicarlo.</SheetDescription></SheetHeader><RescheduleReservationForm reservationId={selectedOccupation.reservationId} court={court} date={selectedCell.date} time={selectedStartTime} onCancel={() => setOperation('summary')} onSuccess={closeDialog} /></>
    if (operation === 'cancel' && selectedOccupation?.reservationId) return <><SheetHeader><SheetTitle>Registrar cancelación</SheetTitle><SheetDescription>La decisión queda visible en auditoría y reportes.</SheetDescription></SheetHeader><CancelReservationForm reservationId={selectedOccupation.reservationId} canCancelAsClient={new Date(selectedOccupation.start).getTime() > nowMs} onCancel={() => setOperation('summary')} onSuccess={closeDialog} /></>
    if (operation === 'no-show' && selectedOccupation?.reservationId) return <><SheetHeader><SheetTitle>Registrar inasistencia</SheetTitle><SheetDescription>Úsalo solo cuando el cliente no se presentó.</SheetDescription></SheetHeader><NoShowReservationForm reservationId={selectedOccupation.reservationId} onCancel={() => setOperation('summary')} onSuccess={closeDialog} /></>
    if (operation === 'payment' && selectedOccupation?.reservationId) return <><SheetHeader><SheetTitle>Registrar cobro</SheetTitle><SheetDescription>Control manual de caja de esta reserva.</SheetDescription></SheetHeader><PaymentMovementForm reservationId={selectedOccupation.reservationId} outstandingAmount={selectedOccupation.outstandingAmount} onCancel={() => setOperation('summary')} onSuccess={closeDialog} /></>

    const reservation = selectedOccupation?.type === 'reserva' ? selectedOccupation : undefined
    const status = reservation?.reservationStatus
    const amount = formatAmount(reservation?.totalAmount)
    const advance = formatAmount(reservation?.advanceAmount)
    const paid = formatAmount(reservation?.paidAmount)
    const outstanding = formatAmount(reservation?.outstandingAmount)
    const phone = reservation?.customerPhone?.replace(/\D/g, '')
    const hasStarted = Boolean(reservation && new Date(reservation.start).getTime() <= nowMs)
    const isInProgress = Boolean(reservation && new Date(reservation.start).getTime() <= nowMs && new Date(reservation.end).getTime() > nowMs)
    return <>
      <SheetHeader><SheetTitle>{selectedCell.courtName}</SheetTitle><SheetDescription>{selectedCell.date} · {reservation ? `${isoToLocalTime(reservation.start)} – ${isoToLocalTime(reservation.end)}` : `${selectedStartTime} – ${selectedEndTime}`}</SheetDescription></SheetHeader>
      <div className="space-y-3 rounded-xl border bg-muted/25 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold"><span className={`size-2.5 rounded-full ${selectedOccupation?.type === 'mantenimiento' ? 'bg-warning' : reservation ? statusDot(status) : 'bg-primary'}`} />{selectedOccupation?.type === 'mantenimiento' ? occupationLabel(selectedOccupation) : reservation ? reservationStatusLabel(status) : 'Bloque libre'}</div>
          {reservation && <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.08em] ${reservationStatusBadgeTone(status)}`}>{reservationStatusLabel(status)}</span>}
        </div>
        {reservation?.customerName && <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold">{reservation.customerName}</p>{reservation.customerPhone && <p className="text-xs text-muted-foreground">{reservation.customerPhone}</p>}</div>{phone && <div className="flex gap-2 text-xs font-bold"><a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="rounded-lg border px-2.5 py-1.5 transition-colors hover:bg-accent">WhatsApp</a><a href={`tel:${reservation.customerPhone}`} className="rounded-lg border px-2.5 py-1.5 transition-colors hover:bg-accent">Llamar</a></div>}</div>}
        {reservation && <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2"><span>Deporte: <strong className="text-foreground">{reservation.sportName ?? 'Sin especificar'}</strong></span>{amount && <span>Total: <strong className="text-foreground">{amount}</strong></span>}{advance && <span>Adelanto requerido: <strong className="text-foreground">{advance}</strong></span>}{paid && <span>Cobrado: <strong className="text-foreground">{paid}</strong></span>}{outstanding && <span>Falta cobrar: <strong className="text-foreground">{outstanding}</strong></span>}<span>Canal: <strong className="capitalize text-foreground">{reservation.reservationChannel ?? 'app'}</strong></span></div>}
        {reservation?.proofPath && <div className="rounded-lg border border-warning/35 bg-warning/10 p-3"><div className="flex items-center justify-between gap-2"><div><p className="text-xs font-extrabold uppercase tracking-[.1em]">Comprobante de pago</p><p className="mt-1 text-xs text-muted-foreground">{reservation.proofUploadedAt ? `Subido ${new Date(reservation.proofUploadedAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}` : 'Evidencia adjunta'}</p></div>{reservation.proofUrl && isImageProof(reservation.proofPath) ? <button type="button" onClick={openProofLightbox} className="shrink-0 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-bold transition-colors hover:bg-accent">Ampliar</button> : reservation.proofUrl && <a href={reservation.proofUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-bold transition-colors hover:bg-accent">Abrir archivo</a>}</div>{reservation.proofUrl && isImageProof(reservation.proofPath) && <button type="button" onClick={openProofLightbox} className="mt-3 block w-full overflow-hidden rounded-lg border bg-background text-left"><Image src={reservation.proofUrl} alt="Comprobante de pago de la reserva" width={800} height={520} unoptimized className="max-h-52 w-full object-contain" /></button>}</div>}
        {selectedOccupation?.type === 'mantenimiento' && <p className="text-sm text-muted-foreground">Este horario está bloqueado para mantenimiento o cierre operativo.</p>}
        {reservation && <p className="text-sm text-muted-foreground">{reservation.isException ? 'La reserva tiene una extensión autorizada de 30 minutos.' : status === 'pendiente_validacion' && hasStarted ? 'El horario ya comenzó: no se puede validar ni rechazar el comprobante. Registra una cancelación del local para dejar la incidencia auditada.' : status === 'pendiente_validacion' ? 'Revisa el comprobante y decide si el pago es válido.' : 'Reserva activa en esta cancha.'}</p>}
        {reservation?.reservationNotes && <p className="border-t pt-3 text-xs text-muted-foreground">Nota: {reservation.reservationNotes}</p>}
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {!selectedOccupation && court && <><Button type="button" variant="outline" onClick={() => setOperation('maintenance')}><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} /> Bloquear</Button><Button type="button" onClick={() => setOperation('manual')}><HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Registrar reserva</Button></>}
        {reservation?.reservationId && status === 'pendiente_validacion' && !hasStarted && <><Button type="button" variant="destructive" onClick={() => setOperation('reject')}><HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} /> Rechazar</Button><Button type="button" onClick={() => setOperation('confirm')}><HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} /> Confirmar reserva</Button></>}
        {reservation?.reservationId && ['pendiente_validacion', 'confirmada', 'pendiente_pago'].includes(status ?? '') && <Button type="button" variant="outline" onClick={() => setOperation('cancel')}><HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} /> Cancelar</Button>}
        {reservation?.reservationId && status === 'confirmada' && isInProgress && <Button type="button" variant="destructive" onClick={() => setOperation('no-show')}>No se presentó</Button>}
        {reservation?.reservationId && (status === 'confirmada' || status === 'completada') && <Button type="button" variant="outline" onClick={() => setOperation('payment')}>Registrar cobro</Button>}
        {reservation?.reservationId && (status === 'confirmada' || status === 'completada') && <><Button type="button" variant="outline" onClick={() => setOperation('extend')}><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} /> Autorizar +30 min</Button>{reservation.isException && <Button type="button" onClick={() => setOperation('encajada')}><HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Registrar encajada</Button>}</>}
      </div>
    </>
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon-sm" aria-label="Periodo anterior" onClick={() => navigate(shiftAgendaDate(data.date, isWeek ? -7 : -1))} disabled={isPending}><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} /></Button><Button type="button" variant="outline" className="min-w-36 justify-start gap-2" onClick={() => navigate(data.date)} disabled={isPending}><HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} /><span className="capitalize">{isWeek ? 'Semana del ' + formatAgendaDate(days[0].date) : data.dayLabel}</span></Button><Button type="button" variant="outline" size="icon-sm" aria-label="Periodo siguiente" onClick={() => navigate(shiftAgendaDate(data.date, isWeek ? 7 : 1))} disabled={isPending}><HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} /></Button><Button type="button" variant="ghost" size="sm" onClick={() => navigate(getTodayInLima())} disabled={isPending}>Hoy</Button></div><div className="flex flex-wrap items-center gap-2"><Select value={selectedSportId || 'all'} onValueChange={(value) => startTransition(() => router.push(buildAgendaUrl(pathname, data.date, value === 'all' ? '' : value, view, selectedCourt?.id)))}><SelectTrigger aria-label="Filtrar por deporte" size="sm" className="min-w-44"><HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} className="text-primary" /><SelectValue /></SelectTrigger><SelectContent position="popper" align="start"><SelectItem value="all">Todos los deportes</SelectItem>{data.sports.map((sport) => <SelectItem key={sport.id} value={sport.id}>{sport.name}</SelectItem>)}</SelectContent></Select>{isWeek && <Select value={selectedCourt?.id ?? ''} onValueChange={(value) => startTransition(() => router.push(buildAgendaUrl(pathname, data.date, selectedSportId, 'week', value)))}><SelectTrigger aria-label="Cancha semanal" size="sm" className="min-w-40"><SelectValue placeholder="Elige una cancha" /></SelectTrigger><SelectContent position="popper" align="start">{data.courts.map((court) => <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>)}</SelectContent></Select>}<div className="flex rounded-xl border border-border bg-muted/35 p-0.5"><Button type="button" size="sm" variant={isWeek ? 'ghost' : 'default'} className="h-8 rounded-lg px-3" onClick={() => changeView('day')} aria-pressed={!isWeek}>Día</Button><Button type="button" size="sm" variant={isWeek ? 'default' : 'ghost'} className="h-8 rounded-lg px-3" onClick={() => changeView('week')} aria-pressed={isWeek}>Semana</Button></div></div></div>
    <div className="flex flex-wrap justify-end gap-3 text-xs font-semibold text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warning" /> Por validar</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Confirmada</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-secondary" /> Mantenimiento</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-border bg-card" /> Libre</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-muted" /> No disponible</span></div>
    <Card className="overflow-hidden p-0 shadow-sm"><div className="flex items-center justify-between border-b bg-muted/20 px-5 py-4"><div><p className="text-base font-extrabold tracking-[-.02em]">{data.localName}</p><p className="mt-0.5 text-xs text-muted-foreground">{isWeek && selectedCourt ? `${selectedCourt.name} · ` : ''}{data.courts.length} canchas configuradas · {occupiedCourts} con actividad</p>{!isWeek && data.openingTime && data.closingTime && <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Atención: {data.openingTime.slice(0, 5)}–{data.closingTime.slice(0, 5)} · Fuera de ese rango y las horas pasadas no se pueden reservar.</p>}</div><Button type="button" size="sm" variant="outline" onClick={() => openFirstFree('manual')} disabled={!data.courts.length}><HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Nueva reserva</Button></div>{!data.courts.length ? <div className="px-6 py-16 text-center"><p className="font-bold">No hay canchas activas</p><p className="mt-2 text-sm text-muted-foreground">Activa o configura una cancha para verla en la agenda.</p></div> : isWeek ? renderWeeklyGrid() : !dailySlots.length ? <div className="px-6 py-16 text-center"><p className="font-bold">No hay horario configurado para este día</p><p className="mt-2 text-sm text-muted-foreground">Configura el horario de atención del local para habilitar sus bloques.</p></div> : renderDailyGrid()}</Card>
    {contextMenu && <div className="fixed z-[60] min-w-56 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-floating" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}><p className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">{contextMenu.cell.courtName} · {contextMenu.cell.slot.label}</p>{contextMenu.cell.occupation && <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors hover:bg-accent" onClick={() => { setSelectedCell(contextMenu.cell); setOperation('summary'); setContextMenu(null) }}><HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4 text-muted-foreground" /> Ver resumen</button>}{!contextMenu.cell.occupation && <><button type="button" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors hover:bg-accent" onClick={() => { setSelectedCell(contextMenu.cell); setOperation('manual'); setContextMenu(null) }}><HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> Registrar reserva</button><button type="button" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors hover:bg-accent" onClick={() => { setSelectedCell(contextMenu.cell); setOperation('maintenance'); setContextMenu(null) }}><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> Bloquear horario</button></>}{contextMenu.cell.occupation?.type === 'reserva' && contextMenu.cell.occupation.reservationId && contextMenu.cell.occupation.reservationStatus === 'pendiente_validacion' && <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-warning-foreground transition-colors hover:bg-warning/10" onClick={() => { setSelectedCell(contextMenu.cell); setOperation('summary'); setContextMenu(null) }}><HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4" /> Revisar comprobante</button>}{contextMenu.cell.occupation?.type === 'reserva' && contextMenu.cell.occupation.reservationId && ['confirmada', 'completada'].includes(contextMenu.cell.occupation.reservationStatus ?? '') && <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors hover:bg-accent" onClick={() => { setSelectedCell(contextMenu.cell); setOperation('extend'); setContextMenu(null) }}><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> Autorizar +30 min</button>}{contextMenu.cell.occupation?.type === 'reserva' && contextMenu.cell.occupation.isException && contextMenu.cell.occupation.reservationId && <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors hover:bg-accent" onClick={() => { setSelectedCell(contextMenu.cell); setOperation('encajada'); setContextMenu(null) }}><HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" /> Registrar encajada</button>}</div>}
    <Popover open={selectedCells.length > 0} onOpenChange={(open) => { if (!open) setSelectedCells([]) }}>
      <PopoverAnchor asChild><span aria-hidden="true" className="fixed z-40 size-px" style={{ left: selectionPopoverPosition.x, top: selectionPopoverPosition.y }} /></PopoverAnchor>
      <PopoverContent align="start" side="bottom" className="w-72 space-y-3 p-3" onPointerDownOutside={(event) => {
        const pointerEvent = event.detail.originalEvent as PointerEvent
        if (pointerEvent.ctrlKey || pointerEvent.metaKey) event.preventDefault()
      }}>
        <div><PopoverTitle className="text-sm font-extrabold">{selectionBlocks === 1 ? 'Bloque disponible' : `${selectionBlocks} bloques seleccionados`}</PopoverTitle><PopoverDescription className="mt-1 text-xs">{selectionStart ? `${selectionStart.courtName} · ${selectionStart.date} · ${selectionStart.slot.label} – ${selectionEndTime}` : ''}</PopoverDescription></div>
        <div className="grid gap-2"><Button type="button" size="sm" className="w-full justify-start" onClick={() => openSelectionOperation('manual')}><HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Registrar reserva</Button><Button type="button" size="sm" variant="outline" className="w-full justify-start" onClick={() => openSelectionOperation('maintenance')}><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} /> Bloquear horario</Button></div>
        <p className="text-[11px] text-muted-foreground">Mantén Ctrl y haz clic en bloques contiguos para seleccionar varias horas.</p>
      </PopoverContent>
    </Popover>
    <Sheet modal={false} open={Boolean(selectedCell)} onOpenChange={(open) => { if (!open) closeDialog() }}>
      <SheetContent side="right" floating showOverlay={false} className="overflow-y-auto border-border bg-card p-0" onInteractOutside={(event) => { if (lightboxOpen || openingLightbox.current) event.preventDefault() }} onFocusOutside={(event) => { if (lightboxOpen || openingLightbox.current) event.preventDefault() }}>
        <div className="flex flex-col gap-5 p-5 sm:p-6 [&_[data-slot=sheet-header]]:p-0 [&_[data-slot=sheet-header]]:pr-8">{renderDialog()}</div>
      </SheetContent>
    </Sheet>
    {selectedOccupation?.proofUrl && isImageProof(selectedOccupation.proofPath) && <Dialog open={lightboxOpen} onOpenChange={onProofLightboxChange}>
      <DialogContent className="max-w-5xl border-border bg-background/95 p-3">
        <DialogHeader className="sr-only"><DialogTitle>Comprobante de pago ampliado</DialogTitle><DialogDescription>Vista ampliada del comprobante de pago de la reserva.</DialogDescription></DialogHeader>
        <Image src={selectedOccupation.proofUrl} alt="Comprobante de pago ampliado" width={1600} height={1100} unoptimized className="max-h-[82vh] w-full object-contain" />
      </DialogContent>
    </Dialog>}
  </div>
}
