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
  reserva_id: string
  cancha_id: string
  cancha_nombre: string
  cliente: string
  fecha: string
  created_at: string
  tipo: 'adelanto' | 'saldo' | 'reembolso'
  monto: number
  medio_tipo: CajaMedioTipo
  referencia: string | null
  notas: string | null
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
    neto: number
    count: number
  }
  byMethod: CajaMethodItem[]
  movements: CajaMovement[]
}
