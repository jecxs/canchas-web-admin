import { HugeiconsIcon } from '@hugeicons/react'
import { Money03Icon, PaymentSuccess01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { formatMoney, formatMoneyShort } from '@/lib/format'
import type { AgendaOccupation } from './types'

// La Agenda muestra el cobro como una señal operativa: solo importa en estados
// donde todavía se puede cobrar. Cancelaciones, rechazos, expiraciones e
// inasistencias ya cerraron su ciclo de caja y no deben pedir dinero.
const CHARGE_STATUSES = new Set<string>([
  'pendiente_pago',
  'checkout_online',
  'pago_en_proceso',
  'pendiente_validacion',
  'confirmada',
  'completada',
])

export type ChargeState = { kind: 'pending' | 'paid'; amount: number }

export function formatChargeAmount(amount: number) {
  return formatMoney(amount)
}

// Resolver puro: recibe la ocupación y decide si falta cobrar, ya se cobró o no
// aplica. Separarlo del render lo hace testeable y reutilizable.
export function resolveChargeState(occupation: AgendaOccupation): ChargeState | null {
  if (occupation.type !== 'reserva') return null
  if (!occupation.reservationStatus || !CHARGE_STATUSES.has(occupation.reservationStatus)) return null

  const total = occupation.totalAmount ?? 0
  const paid = occupation.paidAmount ?? 0
  const outstanding = occupation.outstandingAmount ?? Math.max(total - paid, 0)

  // Tolerancia de medio centavo para no marcar "falta cobrar" por redondeo.
  if (outstanding > 0.005) return { kind: 'pending', amount: outstanding }
  if (total > 0) return { kind: 'paid', amount: paid }
  return null
}

export function chargeStateLabel(state: ChargeState) {
  return state.kind === 'pending' ? `Falta cobrar ${formatMoney(state.amount)}` : `Cobro completo ${formatMoney(state.amount)}`
}

// Icono de dinero con el "!" pegado a la moneda (no al borde de la tarjeta),
// para que el aviso nunca quede recortado por la esquina redondeada.
function MoneyGlyph({ pending, className }: { pending: boolean; className?: string }) {
  return (
    <span className={cn('relative grid shrink-0 place-items-center', className)}>
      <HugeiconsIcon icon={pending ? Money03Icon : PaymentSuccess01Icon} strokeWidth={2} className="size-2.5 sm:size-3.5" />
      {pending && (
        <span className="absolute -right-1 -top-1 grid size-2 place-items-center rounded-full bg-destructive text-[7px] font-black leading-none text-destructive-foreground motion-safe:animate-pulse sm:size-2.5 sm:text-[8px]">
          !
        </span>
      )}
    </span>
  )
}

// Aviso de cobro dentro de la tarjeta de la reserva.
// - Falta cobrar: una moneda ámbar con un "!" rojo (dinero + alerta).
// - Cobrado: un pago con check verde.
// Es decorativo: el texto accesible viaja en el resumen `sr-only` de la celda.
export function ChargeBadge({ state, showAmount = false, className }: { state: ChargeState | null; showAmount?: boolean; className?: string }) {
  if (!state) return null

  const pending = state.kind === 'pending'
  const tone = pending ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'

  if (showAmount) {
    return (
      <span
        aria-hidden="true"
        title={chargeStateLabel(state)}
        className={cn('flex h-4 shrink-0 items-center gap-1.5 rounded-full pl-1 pr-1.5 text-[9px] font-extrabold leading-none tabular-nums shadow-sm ring-2 ring-background sm:h-5 sm:text-[10px]', tone, className)}
      >
        <MoneyGlyph pending={pending} />
        {formatMoneyShort(state.amount)}
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      title={chargeStateLabel(state)}
      className={cn('grid size-4 shrink-0 place-items-center rounded-full shadow-sm ring-2 ring-background sm:size-5', tone, className)}
    >
      <MoneyGlyph pending={pending} />
    </span>
  )
}
