export type CajaMedioTipo =
  | 'mercadopago'
  | 'yape'
  | 'plin'
  | 'transferencia'
  | 'efectivo'
  | 'comprobante'
  | 'manual'
  | 'otro'
  | 'reembolso'

export type CajaMovement = {
  movimiento_id: string
  reserva_id: string | null
  cancha_id: string | null
  cancha_nombre: string
  cliente: string
  fecha: string
  created_at: string
  tipo: 'adelanto' | 'saldo' | 'reembolso' | 'excepcional' | 'anulacion'
  monto: number
  deducciones?: number | null
  netoRecibido?: number | null
  medio_tipo: CajaMedioTipo
  referencia: string | null
  notas: string | null
  ingreso_excepcional_id?: string | null
  fecha_actividad?: string | null
  anulado?: boolean
}

export type CajaMethodItem = {
  id: string
  label: string
  amount: number
  count: number
}

export type CajaReport = {
  localId: string
  localName: string
  start: string
  end: string
  today: string
  totals: {
    collected: number
    mercadopago: number
    comprobante: number
    reembolsos: number
    anulaciones: number
    excepcionales: number
    neto: number
    count: number
  }
  mercadoPago: MercadoPagoTotals
  byMethod: CajaMethodItem[]
  movements: CajaMovement[]
  paymentMethods: Array<{ id: string; type: string; name: string }>
  courts: Array<{ id: string; name: string }>
}
import type { MercadoPagoTotals } from './mercadopago-settlements'

