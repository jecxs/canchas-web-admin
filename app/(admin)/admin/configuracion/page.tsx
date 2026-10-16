import { UnsavedChangesProvider } from '@/components/dashboard/unsaved-changes'
import { PlatformParameterField } from '@/features/admin-platform/platform-parameter-field'
import { getAdvancePercentageValues, getPlatformParameters } from '@/features/admin-platform/queries'
import { PLATFORM_PARAMETERS } from '@/features/admin-platform/types'
import { requireAdmin } from '@/lib/auth/dal'

export default async function AdminPlatformSettingsPage() {
  await requireAdmin()
  const [rows, advancePercentages] = await Promise.all([
    getPlatformParameters(),
    getAdvancePercentageValues(),
  ])

  return (
    <div className="mx-auto w-full max-w-4xl">
      <p className="eyebrow">Superadministración</p>
      <h1 className="mt-3 text-3xl font-black tracking-[-.04em]">Configuración de la plataforma</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Parámetros globales que se aplican a todos los locales. Pulsa <span className="font-semibold text-foreground">Editar</span>{' '}
        en la tarjeta que quieras cambiar: cada modificación se confirma antes de guardar y queda registrada en
        la auditoría.
      </p>

      <UnsavedChangesProvider>
        <div className="mt-7 space-y-2.5">
          {PLATFORM_PARAMETERS.map((definition) => (
            <PlatformParameterField
              key={definition.key}
              definition={definition}
              advancePercentages={advancePercentages}
              row={
                rows.find((row) => row.key === definition.key) ?? {
                  key: definition.key,
                  value: null,
                  description: null,
                }
              }
            />
          ))}
        </div>
      </UnsavedChangesProvider>
    </div>
  )
}