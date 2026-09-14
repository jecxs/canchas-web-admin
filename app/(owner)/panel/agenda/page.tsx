import { AgendaBoard } from '@/features/agenda/agenda-board'
import { getTodayInLima, getWeekDates, isValidAgendaDate } from '@/features/agenda/date-utils'
import { getAgendaData, getAgendaWeekData } from '@/features/agenda/queries'

type AgendaSearchParams = Promise<{ date?: string; sport?: string; view?: string; court?: string; reservation?: string }>

export default async function OwnerAgendaPage({ searchParams }: { searchParams: AgendaSearchParams }) {
  const params = await searchParams
  const date = isValidAgendaDate(params.date) ? params.date : getTodayInLima()
  const selectedSportId = params.sport ?? ''
  const view = params.view === 'week' ? 'week' : 'day'
  const weekDates = getWeekDates(date)
  const weekData = view === 'week' ? await getAgendaWeekData(weekDates, selectedSportId) : undefined
  const data = weekData?.[0] ?? await getAgendaData(date, selectedSportId)

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <p className="eyebrow mb-4">Operación diaria</p>
      <AgendaBoard data={data} selectedSportId={selectedSportId} view={view} weekData={weekData} selectedCourtId={params.court ?? ''} highlightReservationId={params.reservation ?? ''} />
    </div>
  )
}
