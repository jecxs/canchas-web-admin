import { UnsavedChangesProvider } from '@/components/dashboard/unsaved-changes'
import { SubscriptionPricingCard } from '@/features/admin-billing/subscription-pricing-card'
import { getSubscriptionPriceVersions } from '@/features/admin-billing/queries'
import { PlatformParameterField } from '@/features/admin-platform/platform-parameter-field'
import { getAdvancePercentageValues, getPlatformParameters } from '@/features/admin-platform/queries'
import { PLATFORM_PARAMETERS } from '@/features/admin-platform/types'
import { requireAdmin } from '@/lib/auth/dal'

export default async function AdminPlatformSettingsPage() {
  await requireAdmin()
  const [rows, advancePercentages, subscriptionPrices] = await Promise.all([
    getPlatformParameters(),
    getAdvancePercentageValues(),
    getSubscriptionPriceVersions(),
  ])

  return (
    <div className="mx-auto w-full max-w-5xl">
      <p className="eyebrow">Superadministración</p>
      <h1 className="mt-3 text-3xl font-black tracking-[-.04em]">Configuración de la plataforma</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Parámetros globales que se aplican a todos los locales. Pulsa{' '}
        <span className="font-semibold text-foreground">Editar</span> en la tarjeta que quieras cambiar: se
        despliegan sus consideraciones y cada modificación se confirma antes de guardar y queda registrada en la
        auditoría.
      </p>

      <UnsavedChangesProvider>
        <div className="mt-7">
          <SubscriptionPricingCard prices={subscriptionPrices} />
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
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
