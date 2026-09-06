'use client'

import { useActionState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { notify } from '@/lib/notifications/notify'
import { changeCourtStatusAction } from './actions'
import { initialCourtActionState } from './types'

export function CourtStatusAction({ localId, courtId, active, courtName }: { localId: string; courtId: string; active: boolean; courtName: string }) {
  const [state, action, pending] = useActionState(changeCourtStatusAction, initialCourtActionState)

  useEffect(() => {
    if (!state.message) return
    if (state.success) notify.success()
    else notify.error({ description: state.message })
  }, [state])

  if (!active) {
    return <form action={action}><input type="hidden" name="localId" value={localId} /><input type="hidden" name="courtId" value={courtId} /><input type="hidden" name="active" value="true" /><Button type="submit" variant="soft" disabled={pending}>{pending && <Spinner />}Activar</Button></form>
  }

  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="ghost" className="text-muted-foreground">Desactivar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Desactivar {courtName}</DialogTitle><DialogDescription>Dejará de ofrecerse para nuevas reservas. Si tiene reservas futuras, Grassly impedirá la desactivación.</DialogDescription></DialogHeader>
        <form action={action}>
          <input type="hidden" name="localId" value={localId} />
          <input type="hidden" name="courtId" value={courtId} />
          <input type="hidden" name="active" value="false" />
          <DialogFooter><DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose><Button type="submit" variant="destructive" disabled={pending}>{pending && <Spinner />}Desactivar cancha</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
