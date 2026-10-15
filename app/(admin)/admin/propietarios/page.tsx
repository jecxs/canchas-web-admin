import { AdminOwnersBoard } from '@/features/admin-owners/admin-owners-board'
import { getAdminOwners } from '@/features/admin-owners/queries'

export default async function AdminOwnersPage() {
  const data = await getAdminOwners()

  return <AdminOwnersBoard data={data} />
}
