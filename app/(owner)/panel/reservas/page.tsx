import { ReservationsDashboard } from '@/features/reservations/reservations-dashboard'
import { getReservationsData } from '@/features/reservations/queries'
import type { ReservationChannel, ReservationsFilters, ReservationStatus } from '@/features/reservations/types'

type ReservationsSearchParams = Promise<{ status?: string; court?: string; channel?: string; from?: string; to?: string; page?: string }>

const statuses = new Set<ReservationStatus>(['pendiente_pago', 'pendiente_validacion', 'rechazada_pago', 'confirmada', 'completada', 'no_show', 'cancelada_cliente', 'cancelada_local', 'expirada'])
const channels = new Set<ReservationChannel>(['app', 'whatsapp', 'presencial'])
const isDate = (value: string | undefined) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))

export default async function OwnerReservationsPage({ searchParams }: { searchParams: ReservationsSearchParams }) {
  const params = await searchParams
  const page = Number.parseInt(params.page ?? '1', 10)
  const filters: ReservationsFilters = {
    status: statuses.has(params.status as ReservationStatus) ? params.status as ReservationStatus : undefined,
    courtId: params.court || undefined,
    channel: channels.has(params.channel as ReservationChannel) ? params.channel as ReservationChannel : undefined,
    from: isDate(params.from) ? params.from : undefined,
    to: isDate(params.to) ? params.to : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
  if (filters.from && filters.to && filters.from > filters.to) [filters.from, filters.to] = [filters.to, filters.from]
  const data = await getReservationsData(filters)
  return <ReservationsDashboard key={JSON.stringify(data.filters)} data={data} />
}
