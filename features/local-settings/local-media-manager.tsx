'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Delete02Icon, EyeIcon, Image01Icon, ViewOffIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LockToggle } from '@/components/dashboard/edit-guard'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { notify } from '@/lib/notifications/notify'
import { createClient } from '@/utils/supabase/client'
import { deleteGalleryPhoto, registerLogoPath, reorderGalleryPhotos, setPhotoVisibilityAction } from './media-actions'
import { uploadGalleryPhoto } from './gallery-photo-upload'
import type { LocalPhoto, PhotoCourtOption } from './types'

const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

function publicUrl(bucket: string, path: string) {
  return createClient().storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export function LocalMediaManager({ localId, logo, photos, courts = [], allowVisibility = false }: { localId: string; logo: string | null; photos: LocalPhoto[]; courts?: PhotoCourtOption[]; allowVisibility?: boolean }) {
  const logoInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [photoCourtId, setPhotoCourtId] = useState('')
  const router = useRouter()
  const selectedCourt = courts.find((court) => court.id === photoCourtId)
  const visiblePhotos = photoCourtId ? photos.filter((photo) => photo.cancha_id === photoCourtId) : photos
  const coverPhotoId = photos.find((photo) => !photo.oculta)?.id

  async function uploadLogo(file: File) {
    const extension = extensions[file.type]
    if (!extension || file.size === 0 || file.size > 2 * 1024 * 1024) {
      notify.warning({ description: 'Usa JPG, PNG o WebP de máximo 2 MB.' })
      return
    }
    const path = `${localId}/logo-${crypto.randomUUID()}.${extension}`
    const supabase = createClient()
    const { error } = await supabase.storage.from('logos-locales').upload(path, file, { contentType: file.type, upsert: false })
    if (error) { console.error('[local-media:upload]', { status: error.status }); notify.error(); return }

    const result = await registerLogoPath({ localId, path })
    if (!result.success) {
      await supabase.storage.from('logos-locales').remove([path])
      if (result.message === 'Revisa los campos indicados') notify.warning()
      else notify.error()
      return
    }
    notify.success()
    router.refresh()
  }

  function chooseFile(file: File | undefined, kind: 'logo' | 'gallery') {
    if (!file) return
    startTransition(async () => {
      if (kind === 'logo') return uploadLogo(file)
      const result = await uploadGalleryPhoto(localId, file, photoCourtId || null)
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
      if (result.success) { notify.success(); setDeleteId(null); router.refresh() }
      else notify.error()
    })
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= photos.length) return
    const ids = photos.map((photo) => photo.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    startTransition(async () => {
      const result = await reorderGalleryPhotos({ localId, photoIds: ids })
      if (result.success) { notify.success(); router.refresh() }
      else notify.error()
    })
  }

  function toggleVisibility(photo: LocalPhoto) {
    startTransition(async () => {
      const result = await setPhotoVisibilityAction({ localId, photoId: photo.id, hidden: !photo.oculta })
      if (result.success) { notify.success(); router.refresh() }
      else notify.error()
    })
  }

  return (
    <Card id="identidad-visual" className="scroll-mt-24">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Logo y galería</CardTitle>
            <CardDescription>Imágenes públicas del negocio. La primera foto de la galería funciona como portada.</CardDescription>
          </div>
          <LockToggle />
        </div>
      </CardHeader>
      <CardContent className="space-y-7">
        <section>
          <p className="text-sm font-semibold">Logo</p>
          <div className="mt-3 flex items-center gap-4">
            <div role="img" aria-label="Logo actual del local" className="grid size-24 shrink-0 place-items-center rounded-2xl border bg-muted bg-cover bg-center" style={logo ? { backgroundImage: `url("${publicUrl('logos-locales', logo)}")` } : undefined}>{!logo && <HugeiconsIcon icon={Image01Icon} strokeWidth={1.7} className="size-8 text-muted-foreground" />}</div>
            <div><input ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { chooseFile(event.target.files?.[0], 'logo'); event.target.value = '' }} /><Button type="button" variant="outline" disabled={pending} onClick={() => logoInput.current?.click()}>{pending ? <Spinner /> : <HugeiconsIcon icon={Image01Icon} strokeWidth={2} />} {logo ? 'Reemplazar logo' : 'Subir logo'}</Button><p className="mt-2 text-xs text-muted-foreground">JPG, PNG o WebP · máximo 2 MB.</p></div>
          </div>
        </section>
        <section className="border-t pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Galería</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {photoCourtId ? `${visiblePhotos.length} en ${selectedCourt?.name ?? 'esta cancha'} · ${photos.length} de 12 en total` : `${photos.length} de 12 fotos`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {courts.length > 0 ? (
                <Select value={photoCourtId || 'local'} onValueChange={(value) => setPhotoCourtId(value === 'local' ? '' : value)} disabled={pending}>
                  <SelectTrigger aria-label="Filtrar fotos y elegir destino de la nueva foto" className="h-10 min-w-40 max-w-52 bg-background">
                    <HugeiconsIcon icon={Image01Icon} strokeWidth={2} className="size-4 text-primary" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" align="end">
                    <SelectItem value="local">Galería del local</SelectItem>
                    {courts.map((court) => <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : null}
              <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { chooseFile(event.target.files?.[0], 'gallery'); event.target.value = '' }} />
              <Button type="button" disabled={pending || photos.length >= 12} onClick={() => galleryInput.current?.click()}>{pending ? <Spinner /> : <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />}{photoCourtId ? 'Añadir a cancha' : 'Añadir foto'}</Button>
            </div>
          </div>
          {visiblePhotos.length ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visiblePhotos.map((photo, index) => (
                <div key={photo.id} className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted bg-cover bg-center${photo.oculta ? ' opacity-55' : ''}`} style={{ backgroundImage: `url("${publicUrl('fotos-locales', photo.storage_path)}")` }}>
                  <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-1 text-[10px] font-bold">{photo.id === coverPhotoId ? 'Portada' : index + 1}</span>
                  {photo.cancha_id && !photoCourtId ? <span className="absolute left-2 top-9 max-w-[calc(100%-1rem)] truncate rounded-full bg-background/90 px-2 py-1 text-[10px] font-bold">{courts.find((court) => court.id === photo.cancha_id)?.name ?? 'Cancha'}</span> : null}
                  {photo.oculta ? <span className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-1 text-[10px] font-bold text-white">Oculta</span> : null}
                  {!photoCourtId || allowVisibility ? (
                    <div className="absolute bottom-2 left-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      {!photoCourtId ? (
                        <>
                          <Button type="button" size="icon-sm" variant="secondary" disabled={pending || index === 0} aria-label="Mover foto a la izquierda" onClick={() => movePhoto(index, -1)}><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} /></Button>
                          <Button type="button" size="icon-sm" variant="secondary" disabled={pending || index === photos.length - 1} aria-label="Mover foto a la derecha" onClick={() => movePhoto(index, 1)}><HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} /></Button>
                        </>
                      ) : null}
                      {allowVisibility ? <Button type="button" size="icon-sm" variant="secondary" disabled={pending} aria-label={photo.oculta ? 'Mostrar foto' : 'Ocultar foto'} onClick={() => toggleVisibility(photo)}><HugeiconsIcon icon={photo.oculta ? EyeIcon : ViewOffIcon} strokeWidth={2} /></Button> : null}
                    </div>
                  ) : null}
                  <Button type="button" size="icon-sm" variant="destructive" className="absolute bottom-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Eliminar foto ${index + 1}`} onClick={() => setDeleteId(photo.id)}><HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /></Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              {photoCourtId ? `Aún no hay fotos de ${selectedCourt?.name ?? 'esta cancha'}.` : 'Añade al menos una foto real del local para poder publicarlo.'}
            </div>
          )}
        </section>
        <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}><DialogContent><DialogHeader><DialogTitle>Eliminar foto</DialogTitle><DialogDescription>La imagen dejará de aparecer en la galería. Esta acción no se puede deshacer.</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose><Button variant="destructive" disabled={pending} onClick={confirmDelete}>{pending && <Spinner />}Eliminar</Button></DialogFooter></DialogContent></Dialog>
      </CardContent>
    </Card>
  )
}
