import { SuspendedLocalState } from '@/components/states'
import { requireOwnerLocal } from '@/lib/auth/dal'

export default async function SuspendedOwnerPage() {
  const { local } = await requireOwnerLocal(['suspendido'])

  return (
    <div className="mx-auto max-w-3xl py-6">
      <SuspendedLocalState localName={local.nombre} />
    </div>
  )
}
