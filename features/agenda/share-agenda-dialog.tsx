'use client'

import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, ImageDownloadIcon, Share08Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { notify } from '@/lib/notifications/notify'
import { buildShareSchedule, renderShareSchedulePng } from './share-schedule'
import type { AgendaCourt, AgendaData } from './types'

type ShareAgendaDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: AgendaData
  days: AgendaData[]
  isWeek: boolean
  selectedCourt?: AgendaCourt
}

export function ShareAgendaDialog({ open, onOpenChange, data, days, isWeek, selectedCourt }: ShareAgendaDialogProps) {
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null)
  const [error, setError] = useState('')
  const [isRendering, setIsRendering] = useState(true)
  const [schedule] = useState(() => buildShareSchedule({ data, days, isWeek, selectedCourt, capturedAt: new Date() }))
  const filename = `grassly-horarios-${data.date}-${isWeek ? 'semana' : 'dia'}.png`

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    renderShareSchedulePng(schedule).then((blob) => {
      if (cancelled) return
      objectUrl = URL.createObjectURL(blob)
      setImage({ blob, url: objectUrl })
    }).catch(() => {
      if (!cancelled) setError('No se pudo generar la imagen. Inténtalo de nuevo.')
    }).finally(() => {
      if (!cancelled) setIsRendering(false)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [schedule])

  async function copyImage() {
    if (!image) return
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('Clipboard API unavailable')
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': image.blob })])
      notify.success({ title: 'Imagen copiada', description: 'Pégala directamente en tu grupo de WhatsApp.' })
    } catch {
      notify.warning({ title: 'No se pudo copiar', description: 'Descarga la imagen para compartirla desde este navegador.' })
    }
  }

  function downloadImage() {
    if (!image) return
    const link = document.createElement('a')
    link.href = image.url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  async function shareImage() {
    if (!image || !navigator.share) return
    const file = new File([image.blob], filename, { type: 'image/png' })
    try {
      await navigator.share({ files: [file], title: `${data.localName} · Horarios disponibles` })
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      notify.warning({ title: 'No se pudo compartir', description: 'Prueba copiando o descargando la imagen.' })
    }
  }

  const canNativeShare = image && typeof navigator !== 'undefined' && Boolean(navigator.canShare?.({ files: [new File([image.blob], filename, { type: 'image/png' })] }))

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[min(92vh,920px)] w-[min(96vw,1160px)] max-w-none flex-col sm:max-w-[1160px] gap-0 overflow-hidden rounded-2xl p-0" showCloseButton>
      <DialogHeader className="border-b px-6 py-5 pr-14 text-left">
        <DialogTitle className="text-xl font-extrabold tracking-tight">Compartir disponibilidad</DialogTitle>
        <DialogDescription className="max-w-2xl text-sm">Vista pública de {isWeek ? `los 7 días desde ${data.dayLabel} para ${selectedCourt?.name ?? 'la cancha'}` : `las canchas de ${data.localName}`}. Muestra espacios libres y ocupados con el primer nombre de quien reservó, sin datos de contacto ni pagos.</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-auto bg-[#eaf0e5] p-4 sm:p-6">
        {isRendering && <div className="grid min-h-full place-items-center rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Preparando imagen de disponibilidad…</div>}
        {error && <div className="grid min-h-full place-items-center rounded-xl border border-dashed border-destructive/30 bg-card p-8 text-center text-sm text-destructive">{error}</div>}
        {image && <div className="mx-auto w-full max-w-[1000px] overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/10">
          {/* Blob local generado en el navegador: Next Image no aporta optimización aquí. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={`Vista previa de la disponibilidad de ${data.localName}`} className="block h-auto w-full" />
        </div>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-card px-6 py-4">
        <p className="max-w-md text-xs text-muted-foreground">La imagen se genera al abrir esta ventana. Para reflejar nuevas reservas, ciérrala y vuelve a compartir.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={downloadImage} disabled={!image}><HugeiconsIcon icon={ImageDownloadIcon} strokeWidth={2} /> Descargar PNG</Button>
          {canNativeShare && <Button type="button" variant="outline" onClick={shareImage}><HugeiconsIcon icon={Share08Icon} strokeWidth={2} /> Compartir…</Button>}
          <Button type="button" onClick={copyImage} disabled={!image}><HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Copiar imagen</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
}
