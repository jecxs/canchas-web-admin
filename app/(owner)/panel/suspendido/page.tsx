import Link from 'next/link'
import { SuspendedLocalState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
      <div className="mt-4">
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">¿Necesitas tu información?</p>
              <p className="mt-1 text-sm text-muted-foreground">Descarga tus reservas y tu caja en Excel aunque el panel esté restringido.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/panel/mis-datos">Ir a Mis datos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
