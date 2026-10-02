import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { localStatePresentation } from '@/components/dashboard/status'
import { BenefitsSettingsForm } from '@/features/local-settings/benefits-settings-form'
import { CommercialSettingsForm } from '@/features/local-settings/commercial-settings-form'
import { GeneralSettingsForm } from '@/features/local-settings/general-settings-form'
import { LocalMediaManager } from '@/features/local-settings/local-media-manager'
import { ScheduleSettingsForm } from '@/features/local-settings/schedule-settings-form'
import { SettingsSectionNav } from '@/features/local-settings/settings-section-nav'
import { AdminLocalCourts } from '@/features/admin-locales/admin-local-courts'
import { EditGuard, LockSection } from '@/components/dashboard/edit-guard'
import { getAdminLocalDetail } from '@/features/admin-locales/queries'
import { getAdminLocalEditor } from '@/features/admin-locales/editor-queries'
import type { AdminLocalState } from '@/features/admin-locales/types'

const OPERATIONAL_STATES: AdminLocalState[] = ['trial', 'activo', 'en_gracia']

export default async function AdminLocalConfigPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const local = await getAdminLocalDetail(id)
  if (!local) notFound()

  const state = localStatePresentation[local.state]
  const isOperational = OPERATIONAL_STATES.includes(local.state)

  if (!isOperational) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <p className="eyebrow">Configuración del local</p>
          <Badge variant={state.tone}>{state.label}</Badge>
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-[-.04em]">{local.name}</h1>
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              La configuración se habilita cuando el local entra en operación (periodo de prueba, activo o en
              gracia). Mientras tanto solo se puede revisar la ficha y decidir su incorporación.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const editor = await getAdminLocalEditor(local.id)

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Configuración del local</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-.04em]">{local.name}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Edita la información operativa del local. Los cambios se reflejan en la app y quedan registrados en
            la auditoría de Grassly.
          </p>
        </div>
        <Badge variant={local.published ? 'success' : 'neutral'}>
          {local.published ? 'Publicado' : 'No publicado'}
        </Badge>
      </div>

      <div className="mt-9 grid items-start gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
        <SettingsSectionNav courtsHref={`/admin/locales/${local.id}/configuracion#canchas`} />
        <div className="space-y-6">
          <EditGuard>
            <GeneralSettingsForm settings={editor.settings} />
          </EditGuard>

          <EditGuard>
            <LocalMediaManager
              localId={local.id}
              logo={editor.settings.logo}
              photos={editor.photos}
              allowVisibility
            />
          </EditGuard>

          <EditGuard>
            <ScheduleSettingsForm localId={local.id} schedules={editor.schedules} />
          </EditGuard>

          <EditGuard>
            <BenefitsSettingsForm localId={local.id} catalog={editor.benefitCatalog} benefits={editor.benefits} />
          </EditGuard>

          <EditGuard>
            <CommercialSettingsForm
              settings={editor.settings}
              minimumAdvancePercentage={editor.minimumAdvancePercentage}
            />
          </EditGuard>

          <div id="canchas" className="scroll-mt-24">
            <LockSection>
              <AdminLocalCourts
                localId={local.id}
                localName={local.name}
                courts={editor.courts}
                sports={editor.sports}
                editable
              />
            </LockSection>
          </div>
        </div>
      </div>
    </div>
  )
}
