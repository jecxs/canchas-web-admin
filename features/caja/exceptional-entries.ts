import 'server-only'

import type { createClient } from '@/utils/supabase/server'
import { limaDate, shiftDate } from '../reportes/date-utils'
import type { Tables } from '@/types/database.types'

type Client = Awaited<ReturnType<typeof createClient>>
export type ExceptionalEntry = Tables<'ingresos_excepcionales_caja'>

export type ExceptionalEvent = {
  id: string
  entryId: string
  at: string
  date: string
  amount: number
  type: 'excepcional' | 'anulacion'
  method: string
  methodName: string
  concept: string
  courtId: string | null
  activityDate: string | null
  voidReason: string | null
  voided: boolean
}

export async function getExceptionalEvents(client: Client, localId: string, start: string, end: string): Promise<ExceptionalEvent[]> {
  const from = new Date(`${start}T00:00:00-05:00`).toISOString()
  const until = new Date(`${shiftDate(end, 1)}T00:00:00-05:00`).toISOString()
  const rows: ExceptionalEntry[] = []

  for (let page = 0; page < 50; page += 1) {
    const { data, error } = await client
      .from('ingresos_excepcionales_caja')
      .select('*')
      .eq('local_id', localId)
      .or(`and(created_at.gte.${from},created_at.lt.${until}),and(anulado_at.gte.${from},anulado_at.lt.${until})`)
      .order('created_at', { ascending: false })
      .range(page * 1000, page * 1000 + 999)
    if (error) {
      console.error('[caja:excepcionales]', { code: error.code, message: error.message })
      throw new Error('No se pudieron cargar los ingresos excepcionales.')
    }
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }

  const events: ExceptionalEvent[] = []
  for (const row of rows) {
    const base = {
      entryId: row.id,
      method: row.medio_tipo_snapshot,
      methodName: row.medio_nombre_snapshot,
      concept: row.concepto,
      courtId: row.cancha_id,
      activityDate: row.fecha_actividad,
      voidReason: row.motivo_anulacion,
      voided: row.anulado_at !== null,
    }
    if (new Date(row.created_at).getTime() >= Date.parse(from) && new Date(row.created_at).getTime() < Date.parse(until)) {
      events.push({ ...base, id: row.id, at: row.created_at, date: limaDate(row.created_at), amount: Number(row.monto), type: 'excepcional' })
    }
    if (row.anulado_at && new Date(row.anulado_at).getTime() >= Date.parse(from) && new Date(row.anulado_at).getTime() < Date.parse(until)) {
      events.push({ ...base, id: `${row.id}:anulacion`, at: row.anulado_at, date: limaDate(row.anulado_at), amount: -Number(row.monto), type: 'anulacion' })
    }
  }
  return events.sort((a, b) => b.at.localeCompare(a.at))
}
