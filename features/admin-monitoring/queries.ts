import 'server-only'

import { requireAdmin } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type { Json } from '@/types/database.types'
import { actionLabel, entityLabel, roleLabel, ROLE_OPTIONS, buildOptions, PERSON_FIELDS } from './labels'
import type {
  MonitoringBreakdownItem,
  MonitoringChange,
  MonitoringData,
  MonitoringEvent,
  MonitoringFilters,
} from './types'

const PAGE_SIZE = 25
const KPIS_LIMIT = 5000

type RawEventRow = {
  id: string
  accion: string
  entidad_tipo: string
  entidad_id: string | null
  actor_id: string | null
  actor_rol: string | null
  created_at: string
  estado_anterior: Json | null
  estado_nuevo: Json | null
  metadata: Json
  local_id: string | null
  actor: { nombre_completo: string | null } | null
  local: { nombre: string } | null
}

function nextDay(value: string) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

function toBreakdown(rows: Array<{ value: string }>, labelOf: (value: string) => string): MonitoringBreakdownItem[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    counts.set(row.value, (counts.get(row.value) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: labelOf(value), count }))
    .sort((a, b) => b.count - a.count)
}

const SKIP_FIELDS = new Set(['updated_at'])
// Campos que se muestran cuando se CREA/elimina el registro (evita volcar todo el JSON).
const CREATION_FIELDS = ['nombre', 'direccion', 'ruc', 'telefono_contacto_principal', 'telefono', 'email', 'dni', 'estado', 'descripcion']

function isRecord(value: Json | null): value is Record<string, Json> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

// Diferencia campo a campo entre el estado anterior y el nuevo (el "antes → después").
// - Objeto → objeto: campos que cambiaron.
// - Creación/eliminación: solo los campos legibles.
// - Parámetros (escalar/array): un único cambio ("valor").
function diffChanges(previous: Json | null, next: Json | null, clave?: string): MonitoringChange[] {
  if (isRecord(previous) && isRecord(next)) {
    const keys = new Set([...Object.keys(previous), ...Object.keys(next)])
    const changes: MonitoringChange[] = []
    for (const key of keys) {
      if (SKIP_FIELDS.has(key)) continue
      const before = previous[key]
      const after = next[key]
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changes.push({ field: key, before, after })
      }
    }
    return changes
  }
  if (previous === null && isRecord(next)) {
    return CREATION_FIELDS.filter((field) => next[field] !== undefined && next[field] !== null).map((field) => ({
      field,
      before: null,
      after: next[field],
    }))
  }
  if (next === null && isRecord(previous)) {
    return CREATION_FIELDS.filter((field) => previous[field] !== undefined && previous[field] !== null).map((field) => ({
      field,
      before: previous[field],
      after: null,
    }))
  }
  if (previous === null && next === null) return []
  return [{ field: clave ?? 'valor', before: previous, after: next }]
}

function readClave(metadata: Json): string | undefined {
  return isRecord(metadata) && typeof metadata.clave === 'string' ? metadata.clave : undefined
}

export async function getAdminMonitoring(
  filters: MonitoringFilters,
  page: number,
): Promise<MonitoringData> {
  await requireAdmin()
  const supabase = await createClient()

  const desde = filters.desde ? `${filters.desde}T00:00:00-05:00` : undefined
  const hasta = filters.hasta ? `${nextDay(filters.hasta)}T00:00:00-05:00` : undefined

  const [localeRows, pageResult, aggregateResult, optionsResult] = await Promise.all([
    supabase.from('locales').select('id,nombre').order('nombre'),
    (async () => {
      let query = supabase
        .from('auditoria_administrativa')
        .select(
          'id,accion,entidad_tipo,entidad_id,actor_id,actor_rol,created_at,estado_anterior,estado_nuevo,metadata,local_id,actor:perfiles!auditoria_administrativa_actor_id_fkey(nombre_completo),local:locales!auditoria_administrativa_local_id_fkey(nombre)',
          { count: 'exact' },
        )
      if (desde) query = query.gte('created_at', desde)
      if (hasta) query = query.lt('created_at', hasta)
      if (filters.local) query = query.eq('local_id', filters.local)
      if (filters.rol) query = query.eq('actor_rol', filters.rol)
      if (filters.accion) query = query.eq('accion', filters.accion)
      if (filters.entidad) query = query.eq('entidad_tipo', filters.entidad)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      return query.order('created_at', { ascending: false }).range(from, to)
    })(),
    (async () => {
      let query = supabase.from('auditoria_administrativa').select('accion,entidad_tipo').limit(KPIS_LIMIT)
      if (desde) query = query.gte('created_at', desde)
      if (hasta) query = query.lt('created_at', hasta)
      if (filters.local) query = query.eq('local_id', filters.local)
      if (filters.rol) query = query.eq('actor_rol', filters.rol)
      if (filters.accion) query = query.eq('accion', filters.accion)
      if (filters.entidad) query = query.eq('entidad_tipo', filters.entidad)
      return query.order('created_at', { ascending: false })
    })(),
    supabase.from('auditoria_administrativa').select('accion,entidad_tipo').limit(2000),
  ])

  if (pageResult.error) {
    console.error('[admin-monitoring:list]', { code: pageResult.error.code, message: pageResult.error.message })
    throw new Error('No se pudieron cargar los eventos de monitoreo.')
  }

  if (aggregateResult.error) {
    console.error('[admin-monitoring:aggregate]', { code: aggregateResult.error.code })
  }

  const rows = (pageResult.data ?? []) as RawEventRow[]
  const totalCount = pageResult.count ?? 0

  const items: MonitoringEvent[] = rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    action: row.accion,
    actionLabel: actionLabel(row.accion),
    entityType: row.entidad_tipo,
    entityLabel: entityLabel(row.entidad_tipo),
    entityId: row.entidad_id,
    actorName: row.actor?.nombre_completo ?? 'Usuario eliminado',
    actorRole: row.actor_rol as MonitoringEvent['actorRole'],
    actorRoleLabel: roleLabel(row.actor_rol),
    localName: row.local?.nombre ?? null,
    changes: diffChanges(row.estado_anterior, row.estado_nuevo, readClave(row.metadata)),
    metadata: row.metadata,
  }))

  const aggregateRows = (aggregateResult.data ?? []) as Array<{ accion: string; entidad_tipo: string }>
  const byAction = toBreakdown(aggregateRows.map((row) => ({ value: row.accion })), actionLabel)
  const byEntity = toBreakdown(aggregateRows.map((row) => ({ value: row.entidad_tipo })), entityLabel)

  const optionRows = (optionsResult.data ?? []) as Array<{ accion: string; entidad_tipo: string }>

  // Resuelve ids de personas (aprobado_por, dueno_id, actor) a sus nombres.
  const personIds = new Set<string>()
  for (const row of rows) if (row.actor_id) personIds.add(row.actor_id)
  for (const item of items) {
    for (const change of item.changes) {
      if (!PERSON_FIELDS.has(change.field)) continue
      if (typeof change.before === 'string') personIds.add(change.before)
      if (typeof change.after === 'string') personIds.add(change.after)
    }
  }
  const people: Record<string, string> = {}
  if (personIds.size) {
    const { data: peopleRows, error: peopleError } = await supabase
      .from('perfiles')
      .select('id,nombre_completo')
      .in('id', [...personIds])
    if (peopleError) console.error('[admin-monitoring:people]', { code: peopleError.code })
    for (const person of peopleRows ?? []) people[person.id] = person.nombre_completo
  }

  return {
    items,
    summary: { total: totalCount, byAction, byEntity },
    filters,
    people,
    options: {
      locales: (localeRows.data ?? []).map((local) => ({ value: local.id, label: local.nombre })),
      actions: buildOptions(optionRows.map((row) => row.accion), actionLabel),
      entities: buildOptions(optionRows.map((row) => row.entidad_tipo), entityLabel),
      roles: ROLE_OPTIONS,
    },
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    },
  }
}
