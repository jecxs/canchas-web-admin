import { SuspendedLocalState } from '@/components/states'
import { ModerationSupportAction, OwnerModerationNotice } from '@/features/local-moderation/owner-moderation-notice'
import { requireOwnerLocal } from '@/lib/auth/dal'

export default async function SuspendedOwnerPage() {
  const { local } = await requireOwnerLocal(['suspendido'])

  return (
    <div className="mx-auto max-w-3xl py-6">
      <SuspendedLocalState localName={local.nombre} />
      {local.moderation ? (
        <div className="mt-4">
          <OwnerModerationNotice moderation={local.moderation} />
          <ModerationSupportAction localName={local.nombre} />
        </div>
      ) : null}
    </div>
  )
}
