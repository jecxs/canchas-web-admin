import { Clock01Icon, DiscountTag01Icon, Money03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { PricingDashboard } from '@/features/pricing/pricing-dashboard'
import { getPricingConfiguration } from '@/features/pricing/queries'

export default async function OwnerPricingPage() {
  const { local, targets, rules, schedules } = await getPricingConfiguration()
  const activeTargets = targets.filter((target) => target.courtActive).length
  const activeRecurring = rules.filter((rule) => rule.active && rule.type === 'recurrente').length
  const activePromotions = rules.filter((rule) => rule.active && rule.type === 'promocion').length

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-.045em]">Tarifas dinámicas</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Configura precios semanales y promociones de {local.nombre}.</p>
        </div>
        <div className="grid grid-cols-3 gap-2" aria-label="Resumen de tarifas">
          <div className="flex min-w-28 items-center gap-2.5 rounded-2xl bg-sidebar px-3 py-2.5 text-sidebar-foreground shadow-xs">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><HugeiconsIcon icon={Money03Icon} strokeWidth={2} className="size-4" /></span>
            <div><p className="text-xl font-black leading-none tabular-nums">{activeTargets}</p><p className="mt-1 text-[10px] font-bold text-sidebar-foreground/60">Bases</p></div>
          </div>
          <div className="flex min-w-28 items-center gap-2.5 rounded-2xl bg-primary px-3 py-2.5 text-primary-foreground shadow-xs">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-sidebar/10"><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4" /></span>
            <div><p className="text-xl font-black leading-none tabular-nums">{activeRecurring}</p><p className="mt-1 text-[10px] font-bold text-primary-foreground/65">Semanales</p></div>
          </div>
          <div className="flex min-w-28 items-center gap-2.5 rounded-2xl bg-[#fff0c7] px-3 py-2.5 text-[#493500] shadow-xs">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#f6d36f]"><HugeiconsIcon icon={DiscountTag01Icon} strokeWidth={2} className="size-4" /></span>
            <div><p className="text-xl font-black leading-none tabular-nums">{activePromotions}</p><p className="mt-1 text-[10px] font-bold text-[#735700]">Promociones</p></div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <PricingDashboard localId={local.id} targets={targets} rules={rules} schedules={schedules} />
      </div>
    </div>
  )
}
