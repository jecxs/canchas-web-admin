import 'server-only'

import { requireAdmin } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'
import type {
  AdminOwnerDetail,
  AdminOwnerListItem,
  AdminOwnerPayment,
  AdminOwnerSummary,
  AdminOwnerSubscription,
  AdminOwnersData,
} from './types'

type OwnerRow = {
  id: string
  nombre_completo: string
  email: string | null
  telefono: string | null
  dni: string | null
  created_at: string
}

type OwnerLocalRow = {
  id: string
  dueno_id: string
  nombre: string
  direccion: string
  ruc: string | null
  logo: string | null
  estado: AdminOwnerListItem['locals'][number]['state']
  publicado: boolean
  created_at: string
  fecha_fin_trial: string | null
}

function buildSummary(owners: OwnerRow[], locals: OwnerLocalRow[], subscriptions: Map<string, { estado: string; monto: number }>): AdminOwnerSummary {
  const publishedByOwner = new Set(locals.filter((local) => local.publicado).map((local) => local.dueno_id))
  let withActiveSubscription = 0
  for (const owner of owners) {
    if (subscriptions.get(owner.id)?.estado === 'activa') withActiveSubscription += 1
  }
  return {
    total: owners.length,
    withActiveSubscription,
    withPublishedLocals: publishedByOwner.size,
  }
}

export async function getAdminOwners(): Promise<AdminOwnersData> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('perfiles')
    .select('id,nombre_completo,email,telefono,dni,created_at')
    .eq('rol', 'dueno')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin-owners:list]', { code: error.code })
    throw new Error('No se pudieron cargar los propietarios.')
  }

  const owners = (data ?? []) as OwnerRow[]
  const ownerIds = owners.map((owner) => owner.id)

  const [localsResult, subscriptionsResult] = await Promise.all([
    ownerIds.length
      ? supabase
          .from('locales')
          .select('id,dueno_id,nombre,direccion,ruc,logo,estado,publicado,created_at,fecha_fin_trial')
          .in('dueno_id', ownerIds)
          .order('created_at')
      : Promise.resolve({ data: [], error: null }),
    ownerIds.length
      ? supabase
          .from('suscripciones')
          .select('dueno_id,estado,monto')
          .in('dueno_id', ownerIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (localsResult.error || subscriptionsResult.error) {
    console.error('[admin-owners:relations]', {
      code: localsResult.error?.code ?? subscriptionsResult.error?.code,
    })
  }

  const locals = (localsResult.data ?? []) as OwnerLocalRow[]
  const localsByOwner = new Map<string, OwnerLocalRow[]>()
  for (const local of locals) {
    const list = localsByOwner.get(local.dueno_id) ?? []
    list.push(local)
    localsByOwner.set(local.dueno_id, list)
  }

  const subscriptionByOwner = new Map(
    (subscriptionsResult.data ?? []).map((subscription) => [
      subscription.dueno_id,
      { estado: subscription.estado, monto: Number(subscription.monto) },
    ]),
  )

  const items = owners.map((owner): AdminOwnerListItem => {
    const ownerLocals = localsByOwner.get(owner.id) ?? []
    const subscription = subscriptionByOwner.get(owner.id) ?? null
    return {
      id: owner.id,
      name: owner.nombre_completo,
      email: owner.email,
      phone: owner.telefono,
      dni: owner.dni,
      avatarUrl: null,
      createdAt: owner.created_at,
      localsCount: ownerLocals.length,
      publishedCount: ownerLocals.filter((local) => local.publicado).length,
      subscriptionState: subscription?.estado ?? null,
      monthlyAmount: subscription?.monto ?? null,
      locals: ownerLocals.map((local) => ({
        id: local.id,
        name: local.nombre,
        address: local.direccion,
        ruc: local.ruc,
        logoUrl: local.logo
          ? supabase.storage.from('logos-locales').getPublicUrl(local.logo).data.publicUrl
          : null,
        state: local.estado,
        published: local.publicado,
        createdAt: local.created_at,
        trialEndsAt: local.fecha_fin_trial,
      })),
    }
  })

  return {
    owners: items,
    summary: buildSummary(owners, locals, subscriptionByOwner),
  }
}

export async function getAdminOwnerDetail(
  ownerId: string,
): Promise<AdminOwnerDetail | null> {
  await requireAdmin()
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('perfiles')
    .select('id,nombre_completo,email,telefono,dni,rol,created_at,updated_at')
    .eq('id', ownerId)
    .maybeSingle()

  if (error) {
    console.error('[admin-owners:detail]', { code: error.code })
    throw new Error('No se pudo cargar el propietario.')
  }
  if (!profile) return null

  const [localsResult, subscriptionResult, quotaResult] = await Promise.all([
    supabase
      .from('locales')
      .select('id,nombre,direccion,ruc,logo,estado,publicado,created_at,fecha_fin_trial')
      .eq('dueno_id', ownerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('suscripciones')
      .select('id,estado,monto,fecha_proximo_cobro,sedes_extra_contratadas')
      .eq('dueno_id', ownerId)
      .maybeSingle(),
    supabase.rpc('fn_cupo_locales', { p_dueno_id: ownerId }),
  ])

  if (localsResult.error || subscriptionResult.error) {
    console.error('[admin-owners:detail-relations]', {
      code: localsResult.error?.code ?? subscriptionResult.error?.code,
    })
  }

  const subscriptionRow = subscriptionResult.data
  let payments: AdminOwnerPayment[] = []

  if (subscriptionRow) {
    const { data: paymentRows, error: paymentsError } = await supabase
      .from('pagos_suscripcion')
      .select('id,estado,monto,fecha_pago,mercadopago_payment_id')
      .eq('suscripcion_id', subscriptionRow.id)
      .order('fecha_pago', { ascending: false })

    if (paymentsError) {
      console.error('[admin-owners:detail-payments]', { code: paymentsError.code })
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

  const subscription: AdminOwnerSubscription | null = subscriptionRow
    ? {
        id: subscriptionRow.id,
        state: subscriptionRow.estado,
        amount: Number(subscriptionRow.monto),
        nextChargeAt: subscriptionRow.fecha_proximo_cobro,
        extraSedes: subscriptionRow.sedes_extra_contratadas,
        payments,
      }
    : null

  return {
    id: profile.id,
    name: profile.nombre_completo,
    email: profile.email,
    phone: profile.telefono,
    dni: profile.dni,
    avatarUrl: null,
    role: profile.rol,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    quota: typeof quotaResult.data === 'number' ? quotaResult.data : null,
    locals: (localsResult.data ?? []).map((local) => ({
      id: local.id,
      name: local.nombre,
      address: local.direccion,
      ruc: local.ruc,
      logoUrl: local.logo
        ? supabase.storage.from('logos-locales').getPublicUrl(local.logo).data.publicUrl
        : null,
      state: local.estado,
      published: local.publicado,
      createdAt: local.created_at,
      trialEndsAt: local.fecha_fin_trial,
    })),
    subscription,
  }
}

export async function getAdminOwnerCard(
  ownerId: string,
): Promise<AdminOwnerListItem | null> {
  await requireAdmin()
  const supabase = await createClient()

  const { data: owner, error } = await supabase
    .from('perfiles')
    .select('id,nombre_completo,email,telefono,dni,created_at')
    .eq('id', ownerId)
    .maybeSingle()

  if (error) {
    console.error('[admin-owners:card]', { code: error.code })
    return null
  }
  if (!owner) return null

  const [localsResult, subscriptionResult] = await Promise.all([
    supabase
      .from('locales')
      .select('id,dueno_id,nombre,direccion,ruc,logo,estado,publicado,created_at,fecha_fin_trial')
      .eq('dueno_id', ownerId)
      .order('created_at'),
    supabase
      .from('suscripciones')
      .select('dueno_id,estado,monto')
      .eq('dueno_id', ownerId)
      .maybeSingle(),
  ])

  if (localsResult.error || subscriptionResult.error) {
    console.error('[admin-owners:card-relations]', {
      code: localsResult.error?.code ?? subscriptionResult.error?.code,
    })
  }

  const ownerLocals = (localsResult.data ?? []) as OwnerLocalRow[]
  const subscription = subscriptionResult.data

  return {
    id: owner.id,
    name: owner.nombre_completo,
    email: owner.email,
    phone: owner.telefono,
    dni: owner.dni,
    avatarUrl: null,
    createdAt: owner.created_at,
    localsCount: ownerLocals.length,
    publishedCount: ownerLocals.filter((local) => local.publicado).length,
    subscriptionState: subscription?.estado ?? null,
    monthlyAmount: subscription ? Number(subscription.monto) : null,
    locals: ownerLocals.map((local) => ({
      id: local.id,
      name: local.nombre,
      address: local.direccion,
      ruc: local.ruc,
      logoUrl: local.logo
        ? supabase.storage.from('logos-locales').getPublicUrl(local.logo).data.publicUrl
        : null,
      state: local.estado,
      published: local.publicado,
      createdAt: local.created_at,
      trialEndsAt: local.fecha_fin_trial,
    })),
  }
}
