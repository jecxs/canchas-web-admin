import { ClientsDashboard } from '@/features/clients/clients-dashboard'
import { getClientsData } from '@/features/clients/queries'
import type { ClientsFilters } from '@/features/clients/types'

type ClientsSearchParams = Promise<{ court?: string; q?: string; page?: string }>

export default async function OwnerClientsPage({ searchParams }: { searchParams: ClientsSearchParams }) {
  const params = await searchParams
  const page = Number.parseInt(params.page ?? '1', 10)
  const courtIds = (params.court ?? '').split(',').map((id) => id.trim()).filter(Boolean)
  const filters: ClientsFilters = {
    courtIds,
    query: params.q ?? '',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
  const data = await getClientsData(filters)
  return <ClientsDashboard data={data} />
}
