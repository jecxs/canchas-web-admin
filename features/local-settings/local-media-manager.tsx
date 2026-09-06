'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Delete02Icon, Image01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { notify } from '@/lib/notifications/notify'
import { createClient } from '@/utils/supabase/client'
import { deleteGalleryPhoto, registerGalleryPath, registerLogoPath, reorderGalleryPhotos } from './media-actions'
import type { LocalPhoto } from './types'

const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

function publicUrl(bucket: string, path: string) {
  return createClient().storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export function LocalMediaManager({ localId, logo, photos }: { localId: string; logo: string | null; photos: LocalPhoto[] }) {
  const logoInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()

  async function upload(file: File, bucket: 'logos-locales' | 'fotos-locales', kind: 'logo' | 'gallery') {
    const extension = extensions[file.type]
    const limit = kind === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024
    if (!extension || file.size > limit) {
      notify.warning({ description: `Usa JPG, PNG o WebP de máximo ${kind === 'logo' ? '2' : '5'} MB.` })
      return
    }
    const path = `${localId}/${kind}-${crypto.randomUUID()}.${extension}`
    const supabase = createClient()
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false })
    if (error) { console.error('[local-media:upload]', { status: error.status }); notify.error(); return }

    const result = kind === 'logo'
      ? await registerLogoPath({ localId, path })
      : await registerGalleryPath({ localId, path })
    if (!result.success) {
      await supabase.storage.from(bucket).remove([path])
      if (result.message === 'Revisa los campos indicados') notify.warning()
      else notify.error()
      return
    }
    notify.success()
    router.refresh()
  }

  function chooseFile(file: File | undefined, bucket: 'logos-locales' | 'fotos-locales', kind: 'logo' | 'gallery') {
    if (!file) return
    startTransition(() => upload(file, bucket, kind))
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

  return (
    <Card id="identidad-visual" className="scroll-mt-24">
      <CardHeader><CardTitle>Logo y galería</CardTitle><CardDescription>Imágenes públicas del negocio. La primera foto de la galería funciona como portada.</CardDescription></CardHeader>
      <CardContent className="space-y-7">
        <section>
          <p className="text-sm font-semibold">Logo</p>
          <div className="mt-3 flex items-center gap-4">
            <div role="img" aria-label="Logo actual del local" className="grid size-24 shrink-0 place-items-center rounded-2xl border bg-muted bg-cover bg-center" style={logo ? { backgroundImage: `url("${publicUrl('logos-locales', logo)}")` } : undefined}>{!logo && <HugeiconsIcon icon={Image01Icon} strokeWidth={1.7} className="size-8 text-muted-foreground" />}</div>
            <div><input ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0], 'logos-locales', 'logo')} /><Button type="button" variant="outline" disabled={pending} onClick={() => logoInput.current?.click()}>{pending ? <Spinner /> : <HugeiconsIcon icon={Image01Icon} strokeWidth={2} />} {logo ? 'Reemplazar logo' : 'Subir logo'}</Button><p className="mt-2 text-xs text-muted-foreground">JPG, PNG o WebP · máximo 2 MB.</p></div>
          </div>
        </section>
        <section className="border-t pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">Galería</p><p className="mt-1 text-xs text-muted-foreground">{photos.length} de 12 fotos</p></div><input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0], 'fotos-locales', 'gallery')} /><Button type="button" disabled={pending || photos.length >= 12} onClick={() => galleryInput.current?.click()}>{pending ? <Spinner /> : <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />}Añadir foto</Button></div>
          {photos.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((photo, index) => <div key={photo.id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted bg-cover bg-center" style={{ backgroundImage: `url("${publicUrl('fotos-locales', photo.storage_path)}")` }}><span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-1 text-[10px] font-bold">{index === 0 ? 'Portada' : index + 1}</span><div className="absolute bottom-2 left-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Button type="button" size="icon-sm" variant="secondary" disabled={pending || index === 0} aria-label="Mover foto a la izquierda" onClick={() => movePhoto(index, -1)}><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} /></Button><Button type="button" size="icon-sm" variant="secondary" disabled={pending || index === photos.length - 1} aria-label="Mover foto a la derecha" onClick={() => movePhoto(index, 1)}><HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} /></Button></div><Button type="button" size="icon-sm" variant="destructive" className="absolute bottom-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Eliminar foto ${index + 1}`} onClick={() => setDeleteId(photo.id)}><HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /></Button></div>)}</div> : <div className="mt-4 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Añade al menos una foto real del local para poder publicarlo.</div>}
        </section>
        <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}><DialogContent><DialogHeader><DialogTitle>Eliminar foto</DialogTitle><DialogDescription>La imagen dejará de aparecer en la galería. Esta acción no se puede deshacer.</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose><Button variant="destructive" disabled={pending} onClick={confirmDelete}>{pending && <Spinner />}Eliminar</Button></DialogFooter></DialogContent></Dialog>
      </CardContent>
    </Card>
  )
}
