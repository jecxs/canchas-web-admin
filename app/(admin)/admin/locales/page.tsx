import { AdminLocalesBoard } from '@/features/admin-locales/admin-locales-board'
import { getAdminLocales } from '@/features/admin-locales/queries'
import { isAdminLocalState, type AdminLocalFilters } from '@/features/admin-locales/types'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AdminLocalesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const estado = typeof params.estado === 'string' ? params.estado : undefined
  const publicado = typeof params.publicado === 'string' ? params.publicado : undefined

  const filters: AdminLocalFilters = {
    state: isAdminLocalState(estado) ? estado : undefined,
    published: publicado === 'true' ? true : publicado === 'false' ? false : undefined,
  }

  const data = await getAdminLocales(filters)

  return <AdminLocalesBoard data={data} />
}
