import { NextResponse } from 'next/server'
import {
  ACTIVE_LOCAL_COOKIE,
  ACTIVE_LOCAL_COOKIE_OPTIONS,
  getAccessContext,
} from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'

function safePanelHref(value: string | null) {
  if (!value) return '/panel/agenda'
  if (!/^\/panel(?:[/?#]|$)/.test(value)) return '/panel/agenda'
  return value
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getAccessContext()

  if (!context) {
    return NextResponse.redirect(new URL('/registro', request.url))
  }

  if (context.profile.rol === 'super_admin') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  if (context.profile.rol !== 'dueno') {
    return NextResponse.redirect(new URL('/panel', request.url))
  }

  const { id } = await params
  const supabase = await createClient()
  const { data: notification, error } = await supabase
    .from('notificaciones')
    .select('id,local_id,reserva_id,href,leida_at,tipo')
    .eq('id', id)
    .eq('destinatario_id', context.userId)
    .in('tipo', ['reserva_pendiente_validacion', 'moderacion_local'])
    .maybeSingle()

  if (error) {
    console.error('[notifications:open]', { code: error.code })
    return NextResponse.redirect(new URL('/panel', request.url))
  }

  if (!notification) {
    return NextResponse.redirect(new URL('/panel', request.url))
  }

  if (!notification.leida_at) {
    const { error: readError } = await supabase.rpc('marcar_notificaciones_leidas_dueno', {
      p_notificacion_id: notification.id,
    })
    if (readError) {
      console.error('[notifications:open-read]', { code: readError.code })
    }
  }

  const activeLocal = notification.local_id
    ? context.locals.find((local) => local.id === notification.local_id)
    : null

  const targetUrl = new URL(safePanelHref(notification.href), request.url)
  if (notification.reserva_id && !targetUrl.searchParams.has('reservation')) {
    targetUrl.searchParams.set('reservation', notification.reserva_id)
  }

  const response = NextResponse.redirect(targetUrl)
  if (activeLocal) {
    response.cookies.set(ACTIVE_LOCAL_COOKIE, activeLocal.id, ACTIVE_LOCAL_COOKIE_OPTIONS)
  }

  return response
}
