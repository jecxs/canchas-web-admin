import { CajaView } from '@/features/caja/caja-view'
import { getCajaReport } from '@/features/caja/queries'

type CajaSearchParams = Promise<{ start?: string; end?: string }>

export default async function OwnerCajaPage({
  searchParams,
}: {
  searchParams: CajaSearchParams
}) {
  const params = await searchParams
  const data = await getCajaReport({ start: params.start, end: params.end })

  return <CajaView data={data} />
}
