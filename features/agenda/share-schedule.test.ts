import { describe, expect, it } from 'vitest'
import { buildShareSchedule } from './share-schedule'
import type { AgendaCourt, AgendaData, AgendaOccupation } from './types'

const courts: AgendaCourt[] = [
  { id: 'cancha-1', name: 'Cancha 01', sports: [{ id: 'futbol', name: 'Fútbol', support: 'dedicada' }, { id: 'voley', name: 'Vóley', support: 'adaptada' }] },
  { id: 'cancha-2', name: 'Cancha 02', sports: [{ id: 'futbol', name: 'Fútbol', support: 'dedicada' }] },
]

function day(date: string, occupations: AgendaOccupation[] = [], openingTime = '07:00', closingTime = '12:00'): AgendaData {
  return { localId: 'local-1', localName: 'El pelotero', date, dayLabel: date, openingTime, closingTime, courts, occupations, paymentMethods: [] }
}

function stateAt(schedule: ReturnType<typeof buildShareSchedule>, column: number, time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return schedule.cells[column][schedule.starts.indexOf(hour * 60 + minute)]
}

describe('public agenda image schedule', () => {
  it('marks one physical court busy for a half-hour adapted-sport reservation while another remains free', () => {
    const reservation: AgendaOccupation = {
      courtId: 'cancha-1', courtName: 'Cancha 01', type: 'reserva', isException: false,
      sportId: 'voley', sportName: 'Vóley', customerName: 'Private name',
      start: '2026-11-02T14:30:00Z', end: '2026-11-02T15:30:00Z',
    }
    const data = day('2026-11-02', [reservation])
    const schedule = buildShareSchedule({ data, days: [data], isWeek: false, capturedAt: new Date('2026-11-02T12:00:00Z') })
    expect(schedule.columns).toHaveLength(2)
    expect(stateAt(schedule, 0, '09:00')).toBe('free')
    expect(stateAt(schedule, 0, '09:30')).toBe('busy')
    expect(schedule.reservationNames[0][schedule.starts.indexOf(570)]).toBe('Private')
    expect(stateAt(schedule, 0, '10:00')).toBe('busy')
    expect(stateAt(schedule, 0, '10:30')).toBe('free')
    expect(stateAt(schedule, 1, '09:30')).toBe('free')
  })

  it('does not advertise elapsed or maintenance time as free', () => {
    const maintenance: AgendaOccupation = {
      courtId: 'cancha-1', courtName: 'Cancha 01', type: 'mantenimiento', isException: false,
      start: '2026-11-02T16:00:00Z', end: '2026-11-02T17:00:00Z',
    }
    const data = day('2026-11-02', [maintenance])
    const schedule = buildShareSchedule({ data, days: [data], isWeek: false, capturedAt: new Date('2026-11-02T14:15:00Z') })
    expect(stateAt(schedule, 0, '09:00')).toBe('past')
    expect(stateAt(schedule, 0, '09:30')).toBe('free')
    expect(stateAt(schedule, 0, '11:00')).toBe('unavailable')
  })

  it('keeps overnight availability on the following calendar date', () => {
    const reservation: AgendaOccupation = {
      courtId: 'cancha-1', courtName: 'Cancha 01', type: 'reserva', isException: false,
      start: '2026-11-03T05:30:00Z', end: '2026-11-03T06:30:00Z',
    }
    const data = day('2026-11-02', [reservation], '22:00', '02:00')
    const schedule = buildShareSchedule({ data, days: [data], isWeek: true, selectedCourt: courts[0], capturedAt: new Date('2026-11-02T20:00:00Z') })
    expect(stateAt(schedule, 0, '22:00')).toBe('free')
    expect(schedule.cells[0][schedule.starts.indexOf(24 * 60 + 30)]).toBe('busy')
    expect(schedule.cells[0][schedule.starts.indexOf(25 * 60 + 30)]).toBe('free')
  })
})
