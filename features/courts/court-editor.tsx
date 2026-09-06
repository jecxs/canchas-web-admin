'use client'

import { useActionState, useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Edit02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { notify } from '@/lib/notifications/notify'
import { saveCourtAction } from './actions'
import { initialCourtActionState, type CourtItem, type SportOption } from './types'

export function CourtEditor({ localId, sports, court }: { localId: string; sports: SportOption[]; court?: CourtItem }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(() => new Set(court?.sports.map((sport) => sport.sportId) ?? []))
  const [state, action, pending] = useActionState(saveCourtAction, initialCourtActionState)

  useEffect(() => {
    if (!state.message) return
    if (state.success) notify.success()
    else if (state.message === 'Revisa los campos indicados') notify.warning()
    else notify.error()
  }, [state])

  function toggle(id: string) {
    setSelected((value) => {
      const next = new Set(value)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={court ? 'outline' : 'default'}>
          <HugeiconsIcon icon={court ? Edit02Icon : Add01Icon} strokeWidth={2} />
          {court ? 'Editar' : 'Nueva cancha'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{court ? `Editar ${court.name}` : 'Crear cancha'}</DialogTitle>
          <DialogDescription>Una cancha es el espacio físico. Puede admitir varios deportes con precios diferentes.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-6">
          <input type="hidden" name="localId" value={localId} />
          <input type="hidden" name="courtId" value={court?.id ?? ''} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field><FieldLabel htmlFor={`court-name-${court?.id ?? 'new'}`}>Nombre</FieldLabel><Input id={`court-name-${court?.id ?? 'new'}`} name="name" defaultValue={court?.name ?? ''} required maxLength={80} placeholder="Cancha principal" /><FieldError errors={state.fieldErrors?.name?.map((message) => ({ message }))} /></Field>
            <Field><FieldLabel htmlFor={`surface-${court?.id ?? 'new'}`}>Superficie <span className="font-normal text-muted-foreground">(opcional)</span></FieldLabel><Input id={`surface-${court?.id ?? 'new'}`} name="surface" defaultValue={court?.surface ?? ''} maxLength={60} placeholder="Grass sintético" /></Field>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Deportes y precio por hora</legend>
            <div className="mt-3 grid gap-3">
              {sports.map((sport) => {
                const relation = court?.sports.find((item) => item.sportId === sport.id)
                const enabled = selected.has(sport.id)
                return (
                  <div key={sport.id} className="rounded-2xl border p-4">
                    <label className="flex cursor-pointer items-center gap-3 font-semibold"><input type="checkbox" name="sport" value={sport.id} checked={enabled} onChange={() => toggle(sport.id)} className="size-4 accent-primary" />{sport.name}</label>
                    {enabled && <div className="mt-3 grid gap-3 sm:grid-cols-2"><select name={`support_${sport.id}`} defaultValue={relation?.support ?? 'dedicada'} className="h-10 rounded-xl border bg-background px-3 text-sm"><option value="dedicada">Dedicada</option><option value="adaptada">Adaptada</option></select><Input name={`price_${sport.id}`} type="number" min="0.01" max="10000" step="0.01" defaultValue={relation?.hourlyPrice ?? ''} required placeholder="Precio por hora (S/)" /></div>}
                  </div>
                )
              })}
            </div>
            <FieldError className="mt-2" errors={state.fieldErrors?.sports?.map((message) => ({ message }))} />
          </fieldset>
          <Button type="submit" disabled={pending || sports.length === 0} className="w-full sm:w-auto">{pending && <Spinner />}{court ? 'Guardar cancha' : 'Crear cancha'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
