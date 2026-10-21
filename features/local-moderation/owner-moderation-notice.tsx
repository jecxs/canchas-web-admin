import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { LocalModeration } from '@/lib/auth/access'

const titles: Record<LocalModeration['type'], string> = {
  advertencia: 'Tienes una advertencia administrativa',
  pausa_reservas: 'Las nuevas reservas están pausadas',
  suspension_temporal: 'Tu panel operativo está suspendido temporalmente',
  retiro_definitivo: 'Tu local fue retirado de la plataforma',
}

function endsAtText(endsAt: string | null) {
  if (!endsAt) return 'Sin fecha de término.'
  return `La medida termina el ${new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'long', timeStyle: 'short',
  }).format(new Date(endsAt))}.`
}

export function OwnerModerationNotice({ moderation }: { moderation: LocalModeration }) {
  return (
    <Alert variant={moderation.type === 'advertencia' ? 'warning' : 'destructive'}>
      <AlertTitle>{titles[moderation.type]}</AlertTitle>
      <AlertDescription>
        <p>{moderation.reason}</p>
        <p>{endsAtText(moderation.endsAt)}</p>
      </AlertDescription>
    </Alert>
  )
}

export function ModerationSupportAction({ localName }: { localName: string }) {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'soporte@grassly.pe'
  const subject = encodeURIComponent(`Consulta sobre la medida aplicada a ${localName}`)
  return (
    <Button asChild variant="outline" className="mt-4">
      <a href={`mailto:${email}?subject=${subject}`}>Contactar con soporte</a>
    </Button>
  )
}
