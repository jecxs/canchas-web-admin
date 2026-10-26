import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { buildSubscriptionPdf } from '@/features/billing/subscription-pdf'
import { getAccessContext } from '@/lib/auth/dal'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

async function readLogo(request: Request) {
  try {
    const response = await fetch(new URL('/logo.png', request.url))
    if (response.ok) return new Uint8Array(await response.arrayBuffer())
  } catch {
    // En algunos despliegues el origen interno no es accesible; se usa el archivo.
  }

  try {
    return new Uint8Array(await readFile(path.join(process.cwd(), 'public', 'logo.png')))
  } catch {
    return null
  }
}

export async function GET(request: Request) {
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

  const supabase = await createClient()
  const { data: subscription, error: subscriptionError } = await supabase
    .from('suscripciones')
    .select('id,estado_facturacion,fecha_proximo_cobro,monto,sedes_extra_contratadas,periodo_actual_fin,proximo_cobro_at,metodo_pago_codigo,precio_version_id')
    .eq('dueno_id', context.userId)
    .maybeSingle()

  if (subscriptionError) {
    console.error('[billing:pdf-subscription]', { code: subscriptionError.code })
  }

  const invoicesResult = subscription
    ? await supabase
        .from('facturas_suscripcion')
        .select('id,estado,monto,periodo_inicio,periodo_fin,pagada_at')
        .eq('suscripcion_id', subscription.id)
        .order('periodo_inicio', { ascending: false })
        .limit(60)
    : { data: [], error: null }

  if (invoicesResult.error) {
    console.error('[billing:pdf-invoices]', { code: invoicesResult.error.code })
  }

  const priceResult = subscription?.precio_version_id
    ? await supabase
        .from('precios_suscripcion')
        .select('monto_base,monto_sede_extra,sedes_incluidas')
        .eq('id', subscription.precio_version_id)
        .maybeSingle()
    : { data: null, error: null }

  if (priceResult.error) {
    console.error('[billing:pdf-price]', { code: priceResult.error.code })
  }

  const pdfBytes = await buildSubscriptionPdf({
    owner: {
      name: context.profile.nombre_completo,
      email: context.profile.email,
      phone: context.profile.telefono,
      dni: context.profile.dni,
    },
    subscription: subscription
      ? {
          id: subscription.id,
          estado_facturacion: subscription.estado_facturacion,
          fecha_proximo_cobro: subscription.fecha_proximo_cobro,
          monto: Number(subscription.monto),
          sedes_extra_contratadas: subscription.sedes_extra_contratadas,
          periodo_actual_fin: subscription.periodo_actual_fin,
          proximo_cobro_at: subscription.proximo_cobro_at,
          metodo_pago_codigo: subscription.metodo_pago_codigo,
        }
      : null,
    invoices: (invoicesResult.data ?? []).map((invoice) => ({
      id: invoice.id,
      estado: invoice.estado,
      monto: Number(invoice.monto),
      periodo_inicio: invoice.periodo_inicio,
      periodo_fin: invoice.periodo_fin,
      pagada_at: invoice.pagada_at,
    })),
    price: priceResult.data
      ? {
          monto_base: Number(priceResult.data.monto_base),
          monto_sede_extra: Number(priceResult.data.monto_sede_extra),
          sedes_incluidas: priceResult.data.sedes_incluidas,
        }
      : null,
    logoBytes: await readLogo(request),
  })

  const month = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    timeZone: 'America/Lima',
  }).format(new Date())
  const filename = `grassly-resumen-suscripcion-${month}.pdf`
  const body = Buffer.from(pdfBytes)

  return new NextResponse(body, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(body.byteLength),
      'Content-Type': 'application/pdf',
    },
  })
}
