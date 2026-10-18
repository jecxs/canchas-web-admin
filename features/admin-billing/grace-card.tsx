'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { initialGraceState, setOwnerGraceAction } from './grace-action'

export function GraceCard({ ownerId, currentDays, contractedDays }: {
  ownerId: string; currentDays: number | null; contractedDays: number
}) {
  const [state, action, pending] = useActionState(setOwnerGraceAction, initialGraceState)
  return (
    <form action={action} className="space-y-3 rounded-xl border p-4">
      <input type="hidden" name="owner_id" value={ownerId} />
      <label className="block max-w-52 space-y-2 text-sm font-semibold">
        Días de gracia individuales
        <Input key={currentDays ?? 'plan'} type="number" name="days" min={0} max={30}
          defaultValue={currentDays ?? ''} placeholder={`Plan: ${contractedDays}`} />
      </label>
      <p className="text-xs text-muted-foreground">Deja vacío para volver a los {contractedDays} días del contrato. Se aplica al próximo fallo de renovación.</p>
      <Button type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Guardar excepción'}</Button>
      {state.message ? <p role="status" className={state.success ? 'text-sm text-success-foreground' : 'text-sm text-destructive'}>{state.message}</p> : null}
    </form>
  )
}
