'use client'

import { useActionState, useMemo, useState } from 'react'
import { Add01Icon, Cancel01Icon, CarParking01Icon, Chair01Icon, Coffee01Icon, Dress01Icon, FootballIcon, Lamp01Icon, Locker01Icon, ShowerHeadIcon, SparklesIcon, Toilet01Icon, Wifi01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { saveBenefitsSettingsAction } from './actions'
import { useSettingsFormFeedback } from './form-feedback'
import { initialSettingsActionState, type BenefitCatalogItem, type LocalBenefit } from './types'

const categoryLabels: Record<string, string> = {
  acceso: 'Acceso',
  comodidad: 'Comodidad',
  servicios: 'Servicios',
  cancha: 'Cancha',
}

const iconByKey = {
  parking: CarParking01Icon,
  coffee: Coffee01Icon,
  'waiting-area': Chair01Icon,
  wifi: Wifi01Icon,
  grandstand: Chair01Icon,
  restroom: Toilet01Icon,
  'changing-room': Dress01Icon,
  shower: ShowerHeadIcon,
  locker: Locker01Icon,
  'sports-equipment': FootballIcon,
  'stadium-lights': Lamp01Icon,
  'custom-benefit': SparklesIcon,
} as const

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('es-PE')
}

export function BenefitsSettingsForm({ localId, catalog, benefits }: { localId: string; catalog: BenefitCatalogItem[]; benefits: LocalBenefit[] }) {
  const [selectedIds, setSelectedIds] = useState(() => benefits.flatMap((benefit) => benefit.beneficio_catalogo_id ? [benefit.beneficio_catalogo_id] : []))
  const [customBenefits, setCustomBenefits] = useState(() => benefits.flatMap((benefit) => benefit.nombre_personalizado ? [benefit.nombre_personalizado] : []))
  const [customDraft, setCustomDraft] = useState('')
  const [customError, setCustomError] = useState('')
  const [state, action, pending] = useActionState(saveBenefitsSettingsAction, initialSettingsActionState)
  useSettingsFormFeedback(state)

  const catalogNames = useMemo(() => new Set(catalog.map((benefit) => normalize(benefit.nombre))), [catalog])
  const categories = useMemo(() => Array.from(new Set(catalog.map((benefit) => benefit.categoria))), [catalog])

  function toggleCatalog(benefitId: string) {
    setSelectedIds((current) => current.includes(benefitId)
      ? current.filter((id) => id !== benefitId)
      : [...current, benefitId])
  }

  function addCustomBenefit() {
    const name = customDraft.trim()
    const normalized = normalize(name)
    if (name.length < 3 || name.length > 60) {
      setCustomError('Escribe entre 3 y 60 caracteres.')
      return
    }
    if (catalogNames.has(normalized)) {
      setCustomError('Ese beneficio ya existe en el catálogo. Selecciónalo arriba.')
      return
    }
    if (customBenefits.some((benefit) => normalize(benefit) === normalized)) {
      setCustomError('Ese beneficio ya está agregado.')
      return
    }
    if (customBenefits.length >= 5) {
      setCustomError('Puedes agregar hasta 5 beneficios personalizados.')
      return
    }
    setCustomBenefits((current) => [...current, name])
    setCustomDraft('')
    setCustomError('')
  }

  return (
    <Card id="beneficios" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Beneficios y comodidades</CardTitle>
        <CardDescription>Marca lo que realmente ofrece tu local. Esta información ayuda a los clientes a comparar locales antes de reservar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} onReset={(event) => event.preventDefault()} className="space-y-7">
          <input type="hidden" name="localId" value={localId} />
          {selectedIds.map((benefitId) => <input key={benefitId} type="hidden" name="benefitCatalogId" value={benefitId} />)}

          <div className="space-y-5">
            {categories.map((category) => (
              <fieldset key={category}>
                <legend className="text-xs font-extrabold uppercase tracking-[.12em] text-muted-foreground">{categoryLabels[category] ?? category}</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {catalog.filter((benefit) => benefit.categoria === category).map((benefit) => {
                    const checked = selectedIds.includes(benefit.id)
                    const Icon = iconByKey[benefit.icon_key as keyof typeof iconByKey] ?? SparklesIcon
                    return (
                      <button key={benefit.id} type="button" aria-pressed={checked} onClick={() => toggleCatalog(benefit.id)} className={cn('flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40', checked ? 'border-primary/50 bg-primary/12 shadow-sm' : 'bg-muted/15 hover:border-foreground/20 hover:bg-muted/35')}>
                        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl border', checked ? 'border-primary/35 bg-primary text-primary-foreground' : 'bg-background text-muted-foreground')}>
                          <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-bold">{benefit.nombre}</span>
                        <span className={cn('grid size-5 place-items-center rounded-md border text-xs font-black transition-colors', checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/35 bg-background text-transparent')} aria-hidden="true">✓</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <fieldset className="border-t pt-6">
            <legend className="text-sm font-bold">Otro beneficio</legend>
            <p className="mt-1 text-sm text-muted-foreground">Si no está en el catálogo, agrégalo con un nombre breve y claro.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input value={customDraft} onChange={(event) => { setCustomDraft(event.target.value); setCustomError('') }} maxLength={60} placeholder="Ej. Tribuna techada" aria-invalid={Boolean(customError)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomBenefit() } }} />
              <Button type="button" variant="outline" onClick={addCustomBenefit} disabled={customBenefits.length >= 5}><HugeiconsIcon icon={Add01Icon} strokeWidth={2} />Agregar</Button>
            </div>
            {customError && <p className="mt-2 text-sm font-medium text-destructive">{customError}</p>}
            {customBenefits.length > 0 && <div className="mt-4 flex flex-wrap gap-2">
              {customBenefits.map((benefit) => <span key={benefit} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/35 py-1 pl-3 pr-1 text-sm font-semibold"><input type="hidden" name="customBenefit" value={benefit} /><HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3.5 text-primary" />{benefit}<button type="button" onClick={() => setCustomBenefits((current) => current.filter((item) => item !== benefit))} className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground" aria-label={`Quitar ${benefit}`}><HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" /></button></span>)}
            </div>}
            <FieldError className="mt-2" errors={state.fieldErrors?.customBenefits?.map((message) => ({ message }))} />
          </fieldset>

          <FieldError errors={state.fieldErrors?.catalogIds?.map((message) => ({ message }))} />
          <Button type="submit" disabled={pending}>{pending && <Spinner />}Guardar beneficios</Button>
        </form>
      </CardContent>
    </Card>
  )
}
