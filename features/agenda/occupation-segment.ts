import { getLocalMinutes } from './date-utils'
import type { AgendaOccupation } from './types'

type SlotRange = { start: number; end: number }

export function getOccupationSegment(
  occupations: AgendaOccupation[],
  courtId: string,
  slot: SlotRange,
  atMinute?: number,
) {
  const matches = occupations.filter((occupation) => {
    if (occupation.courtId !== courtId) return false
    const start = getLocalMinutes(occupation.start)
    let end = getLocalMinutes(occupation.end)
    if (end <= start) end += 24 * 60
    return end > slot.start && start < slot.end
  })
  const spansMinute = (occupation: AgendaOccupation) => {
    const start = getLocalMinutes(occupation.start)
    let end = getLocalMinutes(occupation.end)
    if (end <= start) end += 24 * 60
    return atMinute !== undefined && start <= atMinute && atMinute < end
  }
  // En la celda compartida, dibuja la reserva que empieza a :30.
  // Para abrir el detalle, selecciona la que ocupa el minuto pulsado.
  const match = matches.find(spansMinute) ??
    matches.find((occupation) => {
      const start = getLocalMinutes(occupation.start)
      return start >= slot.start && start < slot.end
    }) ?? matches[0]
  if (!match) return undefined
  const occupationStart = getLocalMinutes(match.start)
  let occupationEnd = getLocalMinutes(match.end)
  if (occupationEnd <= occupationStart) occupationEnd += 24 * 60
  const overlapStart = Math.max(slot.start, occupationStart)
  return {
    occupation: match,
    top: ((overlapStart - slot.start) / 60) * 100,
    isAnchor: occupationStart >= slot.start && occupationStart < slot.end,
    durationMinutes: occupationEnd - occupationStart,
  }
}
