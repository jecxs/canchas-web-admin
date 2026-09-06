import type { LocalState, SubscriptionSummary } from '@/lib/auth/access'

type BadgeTone = 'success' | 'warning' | 'destructive' | 'info' | 'neutral'

export const localStatePresentation: Record<
  LocalState,
  { label: string; tone: BadgeTone }
> = {
  pendiente_aprobacion: { label: 'En revisión', tone: 'warning' },
  aprobado_pendiente_pago: { label: 'Pago pendiente', tone: 'info' },
  trial: { label: 'Periodo de prueba', tone: 'success' },
  activo: { label: 'Local activo', tone: 'success' },
  en_gracia: { label: 'Periodo de gracia', tone: 'warning' },
  suspendido: { label: 'Suspendido', tone: 'destructive' },
  rechazado: { label: 'Solicitud rechazada', tone: 'destructive' },
}

export function getSubscriptionPresentation(
  subscription: SubscriptionSummary | null | undefined,
) {
  if (!subscription) return { label: 'Sin suscripción', tone: 'neutral' as const }

  const presentation = {
    sin_metodo_pago: { label: 'Método de pago pendiente', tone: 'info' },
    activa: { label: 'Suscripción activa', tone: 'success' },
    pago_fallido: { label: 'Pago fallido', tone: 'destructive' },
    cancelada: { label: 'Suscripción cancelada', tone: 'neutral' },
  } as const

  return presentation[subscription.estado]
}
