import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { CommercialSettingsForm } from '@/features/local-settings/commercial-settings-form'
import { GeneralSettingsForm } from '@/features/local-settings/general-settings-form'
import { LocalMediaManager } from '@/features/local-settings/local-media-manager'
import { getLocalSettings } from '@/features/local-settings/queries'
import { ScheduleSettingsForm } from '@/features/local-settings/schedule-settings-form'

const sections = [
  ['Datos generales', '#datos-generales'],
  ['Logo y galería', '#identidad-visual'],
  ['Horarios', '#horarios'],
  ['Pagos y políticas', '#pagos-politicas'],
] as const

export default async function OwnerSettingsPage() {
  const { local, settings, schedules, photos } = await getLocalSettings()

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Panel del propietario</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-.04em]">Configuración</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Completa la información operativa de {local.nombre}. Las canchas y sus tarifas se administran en su módulo propio.</p>
        </div>
        <Badge variant={settings.publicado ? 'success' : 'neutral'}>{settings.publicado ? 'Publicado' : 'No publicado'}</Badge>
      </div>

      <div className="mt-9 grid items-start gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Secciones de configuración" className="rounded-2xl border bg-card p-2 lg:sticky lg:top-24">
          {sections.map(([label, href]) => <Link key={href} href={href} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">{label}</Link>)}
          <Link href="/panel/canchas" className="mt-1 block rounded-xl bg-primary/14 px-3 py-2.5 text-sm font-bold">Canchas y tarifas →</Link>
        </nav>
        <div className="space-y-6">
          <GeneralSettingsForm settings={settings} />
          <LocalMediaManager localId={settings.id} logo={settings.logo} photos={photos} />
          <ScheduleSettingsForm localId={settings.id} schedules={schedules} />
          <CommercialSettingsForm settings={settings} />
        </div>
      </div>
    </div>
  )
}
