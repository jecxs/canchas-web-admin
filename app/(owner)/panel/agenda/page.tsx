import { AgendaBoard } from '@/features/agenda/agenda-board'
import { getRollingAgendaDates, getTodayInLima, getWeekStart, isValidAgendaDate } from '@/features/agenda/date-utils'
import { getAgendaData, getAgendaWeekData } from '@/features/agenda/queries'
import { normalizeAgendaSportId } from '@/features/agenda/sport-filter'

type AgendaSearchParams = Promise<{ date?: string; sport?: string; view?: string; court?: string; reservation?: string; newClient?: string; clientId?: string; clientName?: string; clientPhone?: string; clientAccount?: string; clientCount?: string }>

export default async function OwnerAgendaPage({ searchParams }: { searchParams: AgendaSearchParams }) {
  const params = await searchParams
  const view = params.view === 'week' ? 'week' : 'day'
  const newClient = params.newClient === '1' && params.clientName
    ? {
        clienteId: params.clientId || null,
        name: params.clientName,
        phone: params.clientPhone || null,
        isAccount: params.clientAccount === '1',
        totalReservations: Number.parseInt(params.clientCount ?? '0', 10) || 0,
      }
    : null
  const today = getTodayInLima()
  const requestedDate = isValidAgendaDate(params.date) ? params.date : today
  // Links created by the former calendar-week view pointed to Monday. When
  // that Monday belongs to the current week, reopen the operational board at
  // today instead of filling the first columns with elapsed days.
  const date = view === 'week' && requestedDate < today && getWeekStart(requestedDate) === getWeekStart(today) ? today : requestedDate
  const requestedSportId = params.sport
  const weekDates = getRollingAgendaDates(date)
  const weekData = view === 'week' ? await getAgendaWeekData(weekDates, requestedSportId) : undefined
  const data = weekData?.[0] ?? await getAgendaData(date, requestedSportId)
  const selectedSportId = normalizeAgendaSportId(requestedSportId, data.sports)

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <p className="eyebrow mb-4">Operación diaria</p>
      <AgendaBoard data={data} selectedSportId={selectedSportId} view={view} weekData={weekData} selectedCourtId={params.court ?? ''} highlightReservationId={params.reservation ?? ''} newClient={newClient} />
    </div>
  )
}
