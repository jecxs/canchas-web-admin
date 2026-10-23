export type ReservationExportRow = {
  reserva_id: string
  inicio: string
  fin: string
  cancha: string
  deporte: string
  cliente: string
  telefono: string | null
  estado: string
  canal: string
  monto_total: number
  monto_adelanto: number
  monto_cobrado: number
  monto_reembolsado: number
  saldo_pendiente: number
  extension_monto: number
  tiene_comprobante: boolean
  notas: string | null
  created_at: string
  cancelada_at: string | null
  motivo_cancelacion: string | null
  reembolso_resultado: string
  motivo_rechazo: string | null
}

export type CajaExportRow = {
  movimiento_id: string
  reserva_id: string
  cancha_id: string
  cancha_nombre: string
  cliente: string
  fecha: string
  created_at: string
  tipo: string
  monto: number
  medio_tipo: string
  referencia: string | null
  notas: string | null
}

export type OwnerDataRange = { from?: string; to?: string }

export type OwnerDataContext = { localId: string; localName: string }
