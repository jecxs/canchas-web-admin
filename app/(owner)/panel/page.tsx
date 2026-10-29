import { OwnerDashboard } from '@/features/owner-dashboard/owner-dashboard'
import { getOwnerDashboardData } from '@/features/owner-dashboard/queries'
import { getPublicationChecklist } from '@/features/local-publication/queries'
import { requireOperationalOwnerLocal } from '@/lib/auth/dal'

export default async function OwnerDashboardPage() {
  const { context, local } = await requireOperationalOwnerLocal()
  const [data, checklist] = await Promise.all([
    getOwnerDashboardData(),
    getPublicationChecklist(local.id),
  ])

  return (
    <OwnerDashboard
      data={data}
      ownerName={context.profile.nombre_completo}
      local={local}
      subscription={context.subscription}
      checklist={checklist}
    />
  )
}
