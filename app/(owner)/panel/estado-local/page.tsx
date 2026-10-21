import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModerationSupportAction, OwnerModerationNotice } from '@/features/local-moderation/owner-moderation-notice'
import { getOwnerShellContext } from '@/lib/auth/dal'

export default async function OwnerLocalStatusPage() {
  const { activeLocal } = await getOwnerShellContext()
  if (!activeLocal?.moderation) redirect('/panel')

  return (
    <div className="mx-auto max-w-2xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>Estado del local</CardTitle>
        </CardHeader>
        <CardContent>
          <OwnerModerationNotice moderation={activeLocal.moderation} />
          <ModerationSupportAction localName={activeLocal.nombre} />
        </CardContent>
      </Card>
    </div>
  )
}
