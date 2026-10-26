'use client'

import Link from 'next/link'
import { Alert01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import type { LocalModeration } from '@/lib/auth/access'

const titles: Record<LocalModeration['type'], string> = {
  advertencia: 'Advertencia administrativa',
  pausa_reservas: 'Nuevas reservas pausadas',
  suspension_temporal: 'Operación suspendida temporalmente',
  retiro_definitivo: 'Local retirado de la plataforma',
}

function endsAtText(endsAt: string | null) {
  if (!endsAt) return 'Sin fecha de término.'
  return `Vigente hasta el ${new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(endsAt))}.`
}

export function LocalModerationIndicator({ moderation }: { moderation: LocalModeration | null | undefined }) {
  if (!moderation) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-xl text-warning-foreground hover:bg-warning/10 hover:text-warning-foreground"
          aria-label="Ver medida administrativa vigente"
        >
          <HugeiconsIcon icon={Alert01Icon} strokeWidth={2.2} className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))]">
        <PopoverHeader>
          <PopoverTitle>{titles[moderation.type]}</PopoverTitle>
          <PopoverDescription>{moderation.reason}</PopoverDescription>
        </PopoverHeader>
        <p className="mt-3 text-xs font-medium text-muted-foreground">{endsAtText(moderation.endsAt)}</p>
        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link href="/panel/estado-local">Ver detalle</Link>
        </Button>
      </PopoverContent>
    </Popover>
  )
}
