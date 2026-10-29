'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { deleteGalleryPhoto } from '@/features/local-settings/media-actions'
import { uploadGalleryPhoto } from '@/features/local-settings/gallery-photo-upload'
import { notify } from '@/lib/notifications/notify'
import { createClient } from '@/utils/supabase/client'
import type { CourtItem } from './types'

export function CourtPhotoManager({ localId, court, photoCount }: { localId: string; court: CourtItem; photoCount: number }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()
  const photos = court.photos ?? []

  function chooseFile(file: File | undefined) {
    if (!file) return
    startTransition(async () => {
      const result = await uploadGalleryPhoto(localId, file, court.id)
      if (!result.success) {
        if (result.message?.startsWith('Usa')) notify.warning({ description: result.message })
        else notify.error()
        return
      }
      notify.success()
      router.refresh()
    })
  }

  function confirmDelete() {
    if (!deleteId) return
    startTransition(async () => {
      const result = await deleteGalleryPhoto({ localId, photoId: deleteId })
      if (!result.success) { notify.error(); return }
      setDeleteId(null)
      notify.success()
      router.refresh()
    })
  }

  return (
    <section className="mt-5 border-t pt-4" aria-label={`Fotos de ${court.name}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Fotos{photos.length ? ` · ${photos.length}` : ''}</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { chooseFile(event.target.files?.[0]); event.target.value = '' }} />
        <Button type="button" variant="outline" size="sm" disabled={pending || photoCount >= 12} onClick={() => inputRef.current?.click()}>
          {pending ? <Spinner /> : <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />}
          Añadir foto
        </Button>
      </div>
      {photos.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative h-24 w-32 shrink-0 overflow-hidden rounded-xl border bg-muted">
              <div role="img" aria-label={`Foto de ${court.name}`} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${createClient().storage.from('fotos-locales').getPublicUrl(photo.storagePath).data.publicUrl}")` }} />
              <Button type="button" size="icon-xs" variant="destructive" disabled={pending} className="absolute right-1.5 top-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" aria-label={`Eliminar foto de ${court.name}`} onClick={() => setDeleteId(photo.id)}>
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Eliminar foto</DialogTitle><DialogDescription>También se quitará de la galería del local.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose><Button variant="destructive" disabled={pending} onClick={confirmDelete}>{pending && <Spinner />}Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
