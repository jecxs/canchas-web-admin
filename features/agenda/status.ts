import type { ReservationStatus } from '@/features/reservations/types'

// Un único sistema de estados para la Agenda. Superficie tenue (no un mosaico
// saturado): el color se insinúa en el tinte y el borde, y el estado siempre va
// escrito. El único elemento a color pleno del tablero es el aviso de cobro.
export type StatusDesign = {
  label: string
  /** Superficie tenue de la tarjeta (borde + fondo). */
  card: string
  /** Punto de acento sólido (panel). */
  dot: string
}

export const maintenanceDesign: StatusDesign = {
  label: 'Mantenimiento',
  card: 'border-border bg-foreground/9 text-foreground',
  dot: 'bg-secondary',
}

const FALLBACK: StatusDesign = {
  label: 'Reserva',
  card: 'border-border bg-muted/60 text-foreground',
  dot: 'bg-secondary',
}

const STATUS_DESIGN: Record<ReservationStatus, StatusDesign> = {
  pendiente_pago: { label: 'Pendiente de pago', card: 'border-info/55 bg-info/20 text-foreground', dot: 'bg-info' },
  checkout_online: { label: 'Pago online pendiente', card: 'border-info/55 bg-info/20 text-foreground', dot: 'bg-info' },
  pago_en_proceso: { label: 'Pago en proceso', card: 'border-warning/60 bg-warning/24 text-foreground', dot: 'bg-warning' },
  pendiente_validacion: { label: 'Por validar', card: 'border-warning/60 bg-warning/24 text-foreground', dot: 'bg-warning' },
  rechazada_pago: { label: 'Pago rechazado', card: 'border-destructive/55 bg-destructive/20 text-foreground', dot: 'bg-destructive' },
  confirmada: { label: 'Confirmada', card: 'border-primary/70 bg-primary/35 text-foreground', dot: 'bg-primary' },
  completada: { label: 'Completada', card: 'border-success/55 bg-success/20 text-foreground', dot: 'bg-success' },
  no_show: { label: 'No se presentó', card: 'border-destructive/55 bg-destructive/20 text-foreground', dot: 'bg-destructive' },
  cancelada_cliente: { label: 'Cancelada', card: 'border-border bg-muted/75 text-muted-foreground', dot: 'bg-muted-foreground' },
  cancelada_local: { label: 'Cancelada', card: 'border-border bg-muted/75 text-muted-foreground', dot: 'bg-muted-foreground' },
  expirada: { label: 'Expirada', card: 'border-border bg-muted/75 text-muted-foreground', dot: 'bg-muted-foreground' },
}

export function reservationStatusDesign(status?: string): StatusDesign {
  return (status && STATUS_DESIGN[status as ReservationStatus]) || FALLBACK
}

export function reservationStatusLabel(status?: string) {
  return reservationStatusDesign(status).label
}
