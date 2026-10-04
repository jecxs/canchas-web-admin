export type ReportTab = 'financiero' | 'operativo' | 'auditoria'

export type ReportGranularity = 'dia' | 'semana' | 'mes'

export type ReportKpi = {
  value: number
  previous: number
  changePct: number | null
  goodWhenUp: boolean
}

export type ReportDailyPoint = {
  date: string
  income: number
  reservations: number
}

export type ReportSeriesPoint = {
  key: string
  label: string
  income: number
  reservations: number
}

export type ReportBreakdownItem = {
  id: string
  label: string
  income: number
  reservations: number
}

export type IncomeReport = {
  localId: string
  localName: string
  start: string
  end: string
  today: string
  totals: {
    income: number
    outstanding: number
    reservations: number
    averageTicket: number
  }
  kpis: {
    income: ReportKpi
    outstanding: ReportKpi
    reservations: ReportKpi
    averageTicket: ReportKpi
  }
  daily: ReportDailyPoint[]
  bySport: ReportBreakdownItem[]
  byCourt: ReportBreakdownItem[]
  byMethod: ReportBreakdownItem[]
}

export type OperativeHourPoint = {
  hour: string
  label: string
  reservations: number
}

export type OperativeWeekdayPoint = {
  weekday: number
  label: string
  reservations: number
}

export type OperativeSportItem = {
  id: string
  label: string
  reservations: number
  hours: number
}

export type OperativeSportSeries = {
  id: string
  label: string
}

// values: horas jugadas por id de deporte para esa cancha.
export type OperativeCourtSportRow = {
  id: string
  label: string
  values: Record<string, number>
}

export type OperativeInsight = {
  label: string
  detail: string
}

export type ChannelOriginItem = {
  name: string
  value: number
  fill: string
}

// Matriz día (fila) × hora (columna) con el conteo de reservas.
export type OperativeHeatmap = {
  weekdays: string[]
  hours: string[]
  values: number[][]
}

export type OperativeReport = {
  localId: string
  localName: string
  start: string
  end: string
  today: string
  totals: {
    reservations: number
    hours: number
  }
  insights: {
    busiestDay: OperativeInsight | null
    quietestDay: OperativeInsight | null
    peakHour: OperativeInsight | null
    deadHour: OperativeInsight | null
  }
  byWeekday: OperativeWeekdayPoint[]
  hourly: OperativeHourPoint[]
  heatmap: OperativeHeatmap
  bySport: OperativeSportItem[]
  sports: OperativeSportSeries[]
  byCourtSport: OperativeCourtSportRow[]
  byChannel: ChannelOriginItem[]
}

export type AuditIncidentType = 'cancelacion' | 'rechazo'

export type AuditIncidentActor = 'cliente' | 'dueno' | 'sistema'

export type AuditIncident = {
  id: string
  type: AuditIncidentType
  reservationId: string
  courtName: string
  sportName: string
  customerName: string
  eventAt: string
  eventDate: string
  gameDate: string
  actor: AuditIncidentActor
  reason: string | null
}

export type AuditSeriesPoint = {
  date: string
  label: string
  cancelaciones: number
  rechazos: number
}

export type AuditBreakdownItem = {
  id: string
  label: string
  count: number
}

export type AuditReport = {
  localId: string
  localName: string
  start: string
  end: string
  today: string
  totals: {
    cancelaciones: number
    rechazos: number
  }
  kpis: {
    cancelaciones: ReportKpi
    rechazos: ReportKpi
  }
  series: AuditSeriesPoint[]
  cancellationsByType: AuditBreakdownItem[]
  rejectionsByReason: AuditBreakdownItem[]
  incidents: AuditIncident[]
}
