import 'server-only'

import { requireAdmin } from '@/lib/auth/dal'
import { parsePaymentMethods } from '@/features/local-settings/types'
import type { PublicationChecklist } from '@/features/local-publication/types'
import type { Enums } from '@/types/database.types'
import { createClient } from '@/utils/supabase/server'
import { ADMIN_LOCAL_STATES, isAdminLocalState } from './types'
import type {
  AdminLocalAuditEntry,
  AdminLocalCourt,
  AdminLocalDetail,
  AdminLocalFilters,
  AdminLocalListItem,
  AdminLocalPayment,
  AdminLocalReview,
  AdminLocalState,
  AdminLocalesData,
  AdminLocalSummary,
} from './types'

function emptySummary(): AdminLocalSummary {
  const byState = {} as Record<AdminLocalState, number>
  for (const state of ADMIN_LOCAL_STATES) byState[state] = 0
  return { total: 0, published: 0, byState }
}

function sanitizeSearch(value: string) {
  return value.replace(/[%,()*]/g, ' ').replace(/\s+/g, ' ').trim()
}

type LocalListRow = {
  id: string
  nombre: string
  direccion: string
  ruc: string | null
  logo: string | null
  estado: AdminLocalState
  publicado: boolean
  publicado_at: string | null
  created_at: string
  fecha_fin_trial: string | null
  dueno_id: string
  propietario: { nombre_completo: string; email: string | null } | null
}

export async function getAdminLocales(
  filters: AdminLocalFilters = {},
): Promise<AdminLocalesData> {
  await requireAdmin()
  const supabase = await createClient()

  const { data: stateRows, error: stateError } = await supabase
    .from('locales')
    .select('estado,publicado')

  if (stateError) {
    console.error('[admin-locales:summary]', { code: stateError.code })
    throw new Error('No se pudieron cargar los locales.')
  }

  const summary = emptySummary()
  for (const row of stateRows ?? []) {
    summary.total += 1
    if (isAdminLocalState(row.estado)) summary.byState[row.estado] += 1
    if (row.publicado) summary.published += 1
  }

  let query = supabase
    .from('locales')
    .select(
      'id,nombre,direccion,ruc,logo,estado,publicado,publicado_at,created_at,fecha_fin_trial,dueno_id,propietario:perfiles!locales_dueno_id_fkey(nombre_completo,email)',
    )

  if (filters.state) query = query.eq('estado', filters.state)
  if (typeof filters.published === 'boolean') query = query.eq('publicado', filters.published)
  if (filters.search) {
    const term = sanitizeSearch(filters.search)
    if (term) query = query.or(`nombre.ilike.%${term}%,direccion.ilike.%${term}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('[admin-locales:list]', { code: error.code })
    throw new Error('No se pudieron cargar los locales.')
  }

  const rows = (data ?? []) as unknown as LocalListRow[]
  const localIds = rows.map((row) => row.id)
  const ownerIds = [...new Set(rows.map((row) => row.dueno_id))]

  const [courtsResult, subscriptionsResult] = await Promise.all([
    localIds.length
      ? supabase.from('canchas').select('local_id').in('local_id', localIds)
      : Promise.resolve({ data: [], error: null }),
    ownerIds.length
      ? supabase
          .from('suscripciones')
          .select('dueno_id,estado')
          .in('dueno_id', ownerIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (courtsResult.error || subscriptionsResult.error) {
    console.error('[admin-locales:relations]', {
      code: courtsResult.error?.code ?? subscriptionsResult.error?.code,
    })
  }

  const courtsByLocal = new Map<string, number>()
  for (const court of courtsResult.data ?? []) {
    courtsByLocal.set(court.local_id, (courtsByLocal.get(court.local_id) ?? 0) + 1)
  }
  const subscriptionByOwner = new Map(
    (subscriptionsResult.data ?? []).map((subscription) => [
      subscription.dueno_id,
      subscription.estado,
    ]),
  )

  const locals = rows.map((row): AdminLocalListItem => ({
    id: row.id,
    name: row.nombre,
    address: row.direccion,
    ruc: row.ruc,
    logoUrl: row.logo
      ? supabase.storage.from('logos-locales').getPublicUrl(row.logo).data.publicUrl
      : null,
    state: row.estado,
    published: row.publicado,
    publishedAt: row.publicado_at,
    createdAt: row.created_at,
    trialEndsAt: row.fecha_fin_trial,
    ownerId: row.dueno_id,
    ownerName: row.propietario?.nombre_completo ?? 'Propietario sin nombre',
    ownerEmail: row.propietario?.email ?? null,
    ownerAvatarUrl: null,
    courtsCount: courtsByLocal.get(row.id) ?? 0,
    subscriptionState: subscriptionByOwner.get(row.dueno_id) ?? null,
  }))

  return { locals, summary, filters }
}

type LocalDetailRow = {
  id: string
  nombre: string
  descripcion: string | null
  ruc: string | null
  telefono_contacto_principal: string
  telefono_contacto_secundario: string | null
  direccion: string
  latitud: number | null
  longitud: number | null
  estado: AdminLocalState
  publicado: boolean
  publicado_at: string | null
  created_at: string
  updated_at: string
  fecha_aprobacion: string | null
  fecha_fin_trial: string | null
  motivo_rechazo: string | null
  porcentaje_adelanto: number | null
  medios_pago_adelanto: unknown
  politica_reembolso: string
  logo: string | null
  dueno_id: string
  propietario: {
    id: string
    nombre_completo: string
    email: string | null
    telefono: string | null
    dni: string | null
  } | null
}

function mapChecklist(row: {
  acceso_operativo: boolean
  datos_generales: boolean
  ubicacion: boolean
  logo: boolean
  galeria: boolean
  horarios: boolean
  canchas_y_tarifas: boolean
  adelanto: boolean
  medios_pago: boolean
  politica_reembolso: boolean
  listo_para_publicar: boolean
}): PublicationChecklist {
  return {
    access: row.acceso_operativo,
    generalData: row.datos_generales,
    location: row.ubicacion,
    logo: row.logo,
    gallery: row.galeria,
    schedules: row.horarios,
    courtsAndRates: row.canchas_y_tarifas,
    advance: row.adelanto,
    paymentMethods: row.medios_pago,
    refundPolicy: row.politica_reembolso,
    ready: row.listo_para_publicar,
  }
}

export async function getAdminLocalDetail(
  localId: string,
): Promise<AdminLocalDetail | null> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('locales')
    .select(
      'id,nombre,descripcion,ruc,telefono_contacto_principal,telefono_contacto_secundario,direccion,latitud,longitud,estado,publicado,publicado_at,created_at,updated_at,fecha_aprobacion,fecha_fin_trial,motivo_rechazo,porcentaje_adelanto,medios_pago_adelanto,politica_reembolso,logo,dueno_id,propietario:perfiles!locales_dueno_id_fkey(id,nombre_completo,email,telefono,dni)',
    )
    .eq('id', localId)
    .maybeSingle()

  if (error) {
    console.error('[admin-locales:detail]', { code: error.code })
    throw new Error('No se pudo cargar el local.')
  }
  if (!data) return null

  const local = data as unknown as LocalDetailRow

  const [courtsResult, sportsResult, schedulesResult, photosResult, benefitsResult, subscriptionResult, checklistResult, reviewsResult] =
    await Promise.all([
      supabase
        .from('canchas')
        .select(
          'id,nombre,superficie,activa,descripcion,cancha_deportes(deporte_id,tipo_soporte,precio_por_hora,deportes(nombre))',
        )
        .eq('local_id', localId)
        .order('created_at'),
      supabase.from('deportes').select('id,nombre,icono').order('nombre'),
      supabase
        .from('horarios_atencion')
        .select('dia_semana,hora_apertura,hora_cierre')
        .eq('local_id', localId)
        .order('dia_semana'),
      supabase
        .from('fotos')
        .select('id,storage_path,orden,oculta')
        .eq('local_id', localId)
        .order('orden'),
      supabase
        .from('local_beneficios')
        .select('id,nombre_personalizado,beneficios_catalogo(nombre,categoria)')
        .eq('local_id', localId)
        .order('created_at'),
      supabase
        .from('suscripciones')
        .select('id,estado,monto,fecha_proximo_cobro,sedes_extra_contratadas')
        .eq('dueno_id', local.dueno_id)
        .maybeSingle(),
      supabase.rpc('obtener_checklist_publicacion_local', { p_local_id: localId }),
      supabase
        .from('resenas')
        .select('id,calificacion,comentario,respuesta_dueno,created_at,estado,cliente:perfiles!resenas_cliente_id_fkey(nombre_completo)')
        .eq('local_id', localId)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

  if (courtsResult.error || schedulesResult.error || photosResult.error || benefitsResult.error || reviewsResult.error) {
    console.error('[admin-locales:detail-relations]', {
      code:
        courtsResult.error?.code ??
        schedulesResult.error?.code ??
        photosResult.error?.code ??
        benefitsResult.error?.code ??
        reviewsResult.error?.code,
      reviews: reviewsResult.error?.message,
    })
  }

  const subscriptionRow = subscriptionResult.data
  let payments: AdminLocalPayment[] = []

  if (subscriptionRow) {
    const { data: paymentRows, error: paymentsError } = await supabase
      .from('pagos_suscripcion')
      .select('id,estado,monto,fecha_pago,mercadopago_payment_id')
      .eq('suscripcion_id', subscriptionRow.id)
      .order('fecha_pago', { ascending: false })

    if (paymentsError) {
      console.error('[admin-locales:detail-payments]', { code: paymentsError.code })
    } else {
      payments = (paymentRows ?? []).map((payment) => ({
        id: payment.id,
        status: payment.estado,
        amount: Number(payment.monto),
        paidAt: payment.fecha_pago,
        reference: payment.mercadopago_payment_id,
      }))
    }
  }

  const logoUrl = local.logo
    ? supabase.storage.from('logos-locales').getPublicUrl(local.logo).data.publicUrl
    : null

  const courts = (courtsResult.data ?? []).map((court): AdminLocalCourt => ({
    id: court.id,
    name: court.nombre,
    surface: court.superficie,
    active: court.activa,
    description: court.descripcion,
    sports: court.cancha_deportes.map((relation) => ({
      sportId: relation.deporte_id,
      name: relation.deportes.nombre,
      support: relation.tipo_soporte,
      hourlyPrice: relation.precio_por_hora,
    })),
  }))

  const checklist = checklistResult.data?.[0] ? mapChecklist(checklistResult.data[0]) : null

  const reviews: AdminLocalReview[] = ((reviewsResult.data ?? []) as unknown as Array<{
    id: string
    calificacion: number
    comentario: string | null
    respuesta_dueno: string | null
    created_at: string
    estado: Enums<'estado_resena'>
    cliente: { nombre_completo: string } | null
  }>).map((review) => ({
    id: review.id,
    rating: review.calificacion,
    comment: review.comentario,
    ownerReply: review.respuesta_dueno,
    createdAt: review.created_at,
    clientName: review.cliente?.nombre_completo ?? 'Cliente',
    state: review.estado,
  }))

  return {
    id: local.id,
    name: local.nombre,
    description: local.descripcion,
    ruc: local.ruc,
    primaryPhone: local.telefono_contacto_principal,
    secondaryPhone: local.telefono_contacto_secundario,
    address: local.direccion,
    latitude: local.latitud,
    longitude: local.longitud,
    state: local.estado,
    published: local.publicado,
    publishedAt: local.publicado_at,
    createdAt: local.created_at,
    updatedAt: local.updated_at,
    approvedAt: local.fecha_aprobacion,
    trialEndsAt: local.fecha_fin_trial,
    rejectionReason: local.motivo_rechazo,
    advancePercentage: local.porcentaje_adelanto,
    refundPolicy: local.politica_reembolso,
    logoUrl,
    paymentMethods: parsePaymentMethods(local.medios_pago_adelanto as never),
    owner: {
      id: local.propietario?.id ?? local.dueno_id,
      name: local.propietario?.nombre_completo ?? 'Propietario sin nombre',
      email: local.propietario?.email ?? null,
      phone: local.propietario?.telefono ?? null,
      dni: local.propietario?.dni ?? null,
      avatarUrl: null,
    },
    courts,
    sports: (sportsResult.data ?? []).map((sport) => ({
      id: sport.id,
      name: sport.nombre,
      icon: sport.icono,
    })),
    schedules: (schedulesResult.data ?? []).map((schedule) => ({
      day: schedule.dia_semana,
      open: schedule.hora_apertura,
      close: schedule.hora_cierre,
    })),
    photos: (photosResult.data ?? []).map((photo) => ({
      id: photo.id,
      url: supabase.storage.from('fotos-locales').getPublicUrl(photo.storage_path).data.publicUrl,
      order: photo.orden,
      hidden: photo.oculta,
    })),
    benefits: (benefitsResult.data ?? []).map((benefit) => ({
      id: benefit.id,
      name: benefit.nombre_personalizado ?? benefit.beneficios_catalogo?.nombre ?? 'Beneficio',
      category: benefit.beneficios_catalogo?.categoria ?? null,
      custom: !benefit.beneficios_catalogo,
    })),
    subscription: subscriptionRow
      ? {
          id: subscriptionRow.id,
          state: subscriptionRow.estado,
          amount: Number(subscriptionRow.monto),
          nextChargeAt: subscriptionRow.fecha_proximo_cobro,
          extraSedes: subscriptionRow.sedes_extra_contratadas,
          payments,
        }
      : null,
    checklist,
    reviews,
  }
}

type AuditRow = {
  id: string
  accion: string
  actor_rol: string | null
  created_at: string
  actor: { nombre_completo: string } | null
}

export async function getAdminLocalAudit(
  localId: string,
  limit = 20,
): Promise<AdminLocalAuditEntry[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('auditoria_administrativa')
    .select(
      'id,accion,actor_rol,created_at,actor:perfiles!auditoria_administrativa_actor_id_fkey(nombre_completo)',
    )
    .eq('local_id', localId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[admin-locales:audit]', { code: error.code })
    return []
  }

  return ((data ?? []) as unknown as AuditRow[]).map((row) => ({
    id: row.id,
    action: row.accion,
    actorRole: row.actor_rol,
    actorName: row.actor?.nombre_completo ?? null,
    createdAt: row.created_at,
  }))
}
