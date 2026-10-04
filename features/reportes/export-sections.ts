import type { ReportTab } from './types'

export type ExportSection = {
  id: string
  label: string
}

export const FINANCIAL_SECTIONS: ExportSection[] = [
  { id: 'resumen', label: 'Resumen (KPIs)' },
  { id: 'dia', label: 'Cobros por día' },
  { id: 'deporte', label: 'Cobros por deporte' },
  { id: 'cancha', label: 'Cobros por cancha' },
  { id: 'metodo', label: 'Cobros por método' },
  { id: 'detalle', label: 'Detalle de movimientos' },
]

export const OPERATIVE_SECTIONS: ExportSection[] = [
  { id: 'resumen', label: 'Resumen (KPIs)' },
  { id: 'calor', label: 'Mapa de calor' },
  { id: 'canchaDeporte', label: 'Cancha por deporte' },
  { id: 'deporte', label: 'Reservas por deporte' },
  { id: 'canal', label: 'Canal de origen' },
  { id: 'detalle', label: 'Detalle de reservas' },
]

export const AUDIT_SECTIONS: ExportSection[] = [
  { id: 'resumen', label: 'Resumen (KPIs)' },
  { id: 'incidencias', label: 'Incidencias por día' },
  { id: 'cancelaciones', label: 'Cancelaciones' },
  { id: 'rechazos', label: 'Rechazos de pago' },
  { id: 'detalle', label: 'Detalle de incidencias' },
]

export function sectionsForTab(tab: ReportTab): ExportSection[] {
  if (tab === 'operativo') return OPERATIVE_SECTIONS
  if (tab === 'auditoria') return AUDIT_SECTIONS
  return FINANCIAL_SECTIONS
}
