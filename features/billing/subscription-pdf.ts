import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'

export type SubscriptionPdfOwner = {
  name: string
  email: string | null
  phone: string | null
  dni: string | null
}

export type SubscriptionPdfSubscription = {
  id: string
  estado_facturacion: string
  fecha_proximo_cobro: string | null
  monto: number
  sedes_extra_contratadas: number
  periodo_actual_fin: string | null
  proximo_cobro_at: string | null
  metodo_pago_codigo: string | null
}

export type SubscriptionPdfInvoice = {
  id: string
  estado: string
  monto: number
  periodo_inicio: string
  periodo_fin: string
  pagada_at: string | null
}

export type SubscriptionPdfPrice = {
  monto_base: number
  monto_sede_extra: number
  sedes_incluidas: number
}

export type SubscriptionPdfData = {
  owner: SubscriptionPdfOwner
  subscription: SubscriptionPdfSubscription | null
  invoices: SubscriptionPdfInvoice[]
  price: SubscriptionPdfPrice | null
  logoBytes: Uint8Array | null
}

export async function buildSubscriptionPdf(data: SubscriptionPdfData): Promise<Uint8Array> {
  const { owner, subscription, invoices, price, logoBytes } = data

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 48
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const COLORS = {
  ink: rgb(0.105, 0.145, 0.125),
  muted: rgb(0.42, 0.455, 0.43),
  border: rgb(0.89, 0.91, 0.88),
  surface: rgb(0.973, 0.978, 0.965),
  lime: rgb(0.78, 0.95, 0.24),
  limeSoft: rgb(0.955, 0.992, 0.88),
  violet: rgb(0.486, 0.361, 1),
  violetSoft: rgb(0.95, 0.94, 1),
  success: rgb(0.31, 0.55, 0.24),
  successSoft: rgb(0.92, 0.97, 0.86),
  warning: rgb(0.72, 0.47, 0.12),
  warningSoft: rgb(1, 0.96, 0.86),
  danger: rgb(0.72, 0.22, 0.18),
  dangerSoft: rgb(1, 0.93, 0.92),
}

const statusLabels: Record<string, string> = {
  activa: 'Activa',
  en_gracia: 'En gracia',
  pendiente_alta: 'Pendiente',
  cancelacion_programada: 'Cancelación programada',
  suspendida: 'Suspendida',
  cancelada: 'Cancelada',
}

const invoiceStatusLabels: Record<string, string> = {
  pagada: 'Pagada',
  pendiente: 'Pendiente',
  fallida: 'Fallida',
  reembolsada: 'Reembolsada',
  requiere_revision: 'En revisión',
}

const paymentMethodLabels: Record<string, string> = {
  account_money: 'Dinero en cuenta de Mercado Pago',
  credit_card: 'Tarjeta de crédito',
  debit_card: 'Tarjeta de débito',
  debvisa: 'Visa débito',
  master: 'Mastercard',
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', {
    currency: 'PEN',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(value)
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(date)
}

function paymentMethodLabel(value: string | null | undefined) {
  if (!value) return 'Pendiente de confirmar'
  const normalized = value.toLowerCase()
  return paymentMethodLabels[normalized] ?? normalized.replaceAll('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase())
}

function invoiceStatusLabel(value: string) {
  return invoiceStatusLabels[value] ?? value.replaceAll('_', ' ')
}

function statusPalette(value: string) {
  if (value === 'activa') return { fill: COLORS.successSoft, text: COLORS.success, border: COLORS.success }
  if (value === 'en_gracia') return { fill: COLORS.warningSoft, text: COLORS.warning, border: COLORS.warning }
  if (value === 'pendiente_alta' || value === 'cancelacion_programada') {
    return { fill: COLORS.violetSoft, text: COLORS.violet, border: COLORS.violet }
  }
  return { fill: COLORS.surface, text: COLORS.muted, border: COLORS.border }
}

function invoiceDotColor(value: string) {
  if (value === 'pagada') return COLORS.success
  if (value === 'pendiente' || value === 'requiere_revision') return COLORS.warning
  if (value === 'fallida') return COLORS.danger
  if (value === 'reembolsada') return COLORS.violet
  return COLORS.muted
}

function fitText(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text
  let result = text
  while (result.length > 1 && font.widthOfTextAtSize(`${result}...`, size) > maxWidth) {
    result = result.slice(0, -1)
  }
  return `${result}...`
}


  const doc = await PDFDocument.create()
  doc.setTitle('Resumen de suscripción · Grassly')
  doc.setAuthor('Grassly')
  doc.setSubject('Resumen de suscripción y cobros')
  doc.setCreator('Grassly')
  doc.setProducer('Grassly')

  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let logo: PDFImage | null = null
  if (logoBytes) {
    try {
      logo = await doc.embedPng(logoBytes)
    } catch (error) {
      console.error('[billing:pdf-logo]', error instanceof Error ? error.message : 'unknown')
    }
  }

  const pages: PDFPage[] = []
  let page!: PDFPage
  let y = 0

  function addFirstPage() {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    pages.push(page)
    y = PAGE_HEIGHT - MARGIN
  }

  function addContinuationPage() {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    pages.push(page)
    y = PAGE_HEIGHT - MARGIN
    page.drawText('Grassly', { x: MARGIN, y: y - 10, size: 9, font: bold, color: COLORS.ink })
    page.drawText('Resumen de suscripción', { x: MARGIN + 50, y: y - 10, size: 9, font, color: COLORS.muted })
    page.drawLine({
      start: { x: MARGIN, y: y - 18 },
      end: { x: PAGE_WIDTH - MARGIN, y: y - 18 },
      thickness: 0.6,
      color: COLORS.border,
    })
    y -= 38
  }

  function ensureSpace(required: number) {
    if (y - required < MARGIN + 56) addContinuationPage()
  }

  function drawSectionLabel(label: string, top: number) {
    page.drawRectangle({ x: MARGIN, y: top - 6, width: 6, height: 6, color: COLORS.violet })
    page.drawText(label.toUpperCase(), {
      x: MARGIN + 12,
      y: top - 6,
      size: 8,
      font: bold,
      color: COLORS.muted,
    })
  }

  function drawRightText(
    text: string,
    options: { x: number; y: number; size: number; font: PDFFont; color: ReturnType<typeof rgb> },
  ) {
    const width = options.font.widthOfTextAtSize(text, options.size)
    page.drawText(text, {
      x: options.x - width,
      y: options.y,
      size: options.size,
      font: options.font,
      color: options.color,
    })
  }

  function drawCenteredText(
    text: string,
    options: { x: number; y: number; size: number; font: PDFFont; color: ReturnType<typeof rgb> },
  ) {
    const width = options.font.widthOfTextAtSize(text, options.size)
    page.drawText(text, {
      x: options.x - width / 2,
      y: options.y,
      size: options.size,
      font: options.font,
      color: options.color,
    })
  }

  function drawTableHeader(columns: { label: string; x: number; align?: 'left' | 'right' }[], top: number) {
    const height = 22
    page.drawRectangle({
      x: MARGIN,
      y: top - height,
      width: CONTENT_WIDTH,
      height,
      color: COLORS.ink,
    })
    page.drawRectangle({
      x: MARGIN,
      y: top - height,
      width: CONTENT_WIDTH,
      height: 2,
      color: COLORS.lime,
    })
    for (const column of columns) {
      const textX = column.align === 'right'
        ? column.x - bold.widthOfTextAtSize(column.label, 8)
        : column.x
      page.drawText(column.label, {
        x: textX,
        y: top - 15,
        size: 8,
        font: bold,
        color: rgb(1, 1, 1),
      })
    }
    return top - height
  }

  addFirstPage()

  const headerTop = PAGE_HEIGHT - MARGIN
  if (logo) {
    page.drawImage(logo, { x: MARGIN, y: headerTop - 58, width: 104, height: 58.5 })
  } else {
    page.drawRectangle({ x: MARGIN, y: headerTop - 22, width: 10, height: 10, color: COLORS.lime })
    page.drawText('GRASSLY', { x: MARGIN + 16, y: headerTop - 23, size: 18, font: bold, color: COLORS.ink })
  }

  drawRightText('RESUMEN DE SUSCRIPCIÓN', {
    x: PAGE_WIDTH - MARGIN,
    y: headerTop - 20,
    size: 8.5,
    font: bold,
    color: COLORS.muted,
  })
  drawRightText(`Emitido el ${formatDate(new Date())}`, {
    x: PAGE_WIDTH - MARGIN,
    y: headerTop - 33,
    size: 8.5,
    font,
    color: COLORS.muted,
  })
  page.drawLine({
    start: { x: MARGIN, y: headerTop - 74 },
    end: { x: PAGE_WIDTH - MARGIN, y: headerTop - 74 },
    thickness: 0.7,
    color: COLORS.border,
  })
  y = headerTop - 96

  drawSectionLabel('Facturado a', y)
  const ownerName = fitText(owner.name || 'Propietario', bold, 14, 250)
  page.drawText(ownerName, { x: MARGIN, y: y - 28, size: 14, font: bold, color: COLORS.ink })

  let ownerLineY = y - 44
  const ownerLines = [owner.email, owner.phone, owner.dni ? `DNI ${owner.dni}` : null]
    .filter((line): line is string => Boolean(line && line.trim()))
  for (const line of ownerLines) {
    page.drawText(fitText(line, font, 9, 250), { x: MARGIN, y: ownerLineY, size: 9, font, color: COLORS.muted })
    ownerLineY -= 13
  }

  drawRightText('ESTADO', {
    x: PAGE_WIDTH - MARGIN,
    y: y - 6,
    size: 8,
    font: bold,
    color: COLORS.muted,
  })

  const currentStatus = subscription?.estado_facturacion ?? 'sin_suscripcion'
  const status = statusPalette(currentStatus)
  const statusLabel = subscription ? (statusLabels[currentStatus] ?? currentStatus) : 'Sin suscripción'
  const badgeWidth = 92
  const badgeHeight = 20
  const badgeX = PAGE_WIDTH - MARGIN - badgeWidth
  const badgeY = y - 34
  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: badgeHeight,
    color: status.fill,
    borderColor: status.border,
    borderWidth: 0.6,
  })
  drawCenteredText(fitText(statusLabel, bold, 8, badgeWidth - 12), {
    x: badgeX + badgeWidth / 2,
    y: badgeY + 6,
    size: 8,
    font: bold,
    color: status.text,
  })
  if (subscription) {
    drawRightText(`Suscripción #${subscription.id.slice(0, 8).toUpperCase()}`, {
      x: PAGE_WIDTH - MARGIN,
      y: badgeY - 14,
      size: 8,
      font,
      color: COLORS.muted,
    })
  }

  const summaryTop = 625
  const summaryHeight = 92
  page.drawRectangle({
    x: MARGIN,
    y: summaryTop - summaryHeight,
    width: CONTENT_WIDTH,
    height: summaryHeight,
    color: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 0.6,
  })
  page.drawRectangle({
    x: MARGIN,
    y: summaryTop - summaryHeight,
    width: 3,
    height: summaryHeight,
    color: COLORS.violet,
  })
  page.drawLine({
    start: { x: MARGIN + CONTENT_WIDTH / 2, y: summaryTop - 14 },
    end: { x: MARGIN + CONTENT_WIDTH / 2, y: summaryTop - summaryHeight + 14 },
    thickness: 0.5,
    color: COLORS.border,
  })

  function drawSummaryItem(x: number, labelY: number, label: string, value: string, size = 10.5) {
    page.drawText(label.toUpperCase(), { x, y: labelY, size: 7.5, font: bold, color: COLORS.muted })
    page.drawText(fitText(value, bold, size, 210), { x, y: labelY - 15, size, font: bold, color: COLORS.ink })
  }

  if (subscription) {
    drawSummaryItem(
      MARGIN + 16,
      summaryTop - 22,
      'Importe mensual',
      formatMoney(Number(subscription.monto)),
      14,
    )
    drawSummaryItem(
      MARGIN + 16,
      summaryTop - 62,
      'Próximo cobro',
      formatDate(subscription.proximo_cobro_at ?? subscription.fecha_proximo_cobro),
    )
    drawSummaryItem(
      MARGIN + CONTENT_WIDTH / 2 + 16,
      summaryTop - 22,
      'Período pagado hasta',
      formatDate(subscription.periodo_actual_fin),
    )
    drawSummaryItem(
      MARGIN + CONTENT_WIDTH / 2 + 16,
      summaryTop - 62,
      'Medio de pago',
      paymentMethodLabel(subscription.metodo_pago_codigo),
    )
  } else {
    page.drawText('Todavía no tienes una suscripción registrada.', {
      x: MARGIN + 16,
      y: summaryTop - 40,
      size: 11,
      font,
      color: COLORS.muted,
    })
  }

  y = 515
  drawSectionLabel('Detalle del plan', y)
  y -= 18

  if (subscription) {
    const included = price?.sedes_incluidas ?? 1
    const extraCount = subscription.sedes_extra_contratadas ?? 0
    const baseAmount = price ? Number(price.monto_base) : Number(subscription.monto)
    const extraUnit = price ? Number(price.monto_sede_extra) : 0
    const extraAmount = extraCount * extraUnit
    const totalAmount = Number(subscription.monto)
    const adjustment = totalAmount - baseAmount - extraAmount
    const planRows: { concept: string; detail: string; amount: number }[] = [
      {
        concept: 'Plan base',
        detail: `${included} sede${included === 1 ? '' : 's'} incluida${included === 1 ? '' : 's'}`,
        amount: baseAmount,
      },
    ]
    if (extraCount > 0) {
      planRows.push({
        concept: 'Sedes adicionales',
        detail: `${extraCount} × ${formatMoney(extraUnit)}`,
        amount: extraAmount,
      })
    }
    if (Math.abs(adjustment) >= 0.01) {
      planRows.push({
        concept: 'Ajuste aplicado',
        detail: 'Diferencia entre plan y total cobrado',
        amount: adjustment,
      })
    }

    y = drawTableHeader([
      { label: 'Concepto', x: MARGIN + 12 },
      { label: 'Detalle', x: MARGIN + 220 },
      { label: 'Importe', x: PAGE_WIDTH - MARGIN - 12, align: 'right' },
    ], y)

    const rowHeight = 22
    planRows.forEach((row, index) => {
      page.drawRectangle({
        x: MARGIN,
        y: y - rowHeight,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: index % 2 === 0 ? rgb(0.985, 0.988, 0.98) : rgb(1, 1, 1),
      })
      page.drawText(fitText(row.concept, font, 9, 190), {
        x: MARGIN + 12,
        y: y - 14,
        size: 9,
        font,
        color: COLORS.ink,
      })
      page.drawText(fitText(row.detail, font, 9, 170), {
        x: MARGIN + 220,
        y: y - 14,
        size: 9,
        font,
        color: COLORS.muted,
      })
      drawRightText(formatMoney(row.amount), {
        x: PAGE_WIDTH - MARGIN - 12,
        y: y - 14,
        size: 9,
        font: bold,
        color: COLORS.ink,
      })
      page.drawLine({
        start: { x: MARGIN, y: y - rowHeight },
        end: { x: PAGE_WIDTH - MARGIN, y: y - rowHeight },
        thickness: 0.4,
        color: COLORS.border,
      })
      y -= rowHeight
    })

    page.drawRectangle({
      x: MARGIN,
      y: y - rowHeight,
      width: CONTENT_WIDTH,
      height: rowHeight,
      color: COLORS.limeSoft,
    })
    page.drawLine({
      start: { x: MARGIN, y: y },
      end: { x: PAGE_WIDTH - MARGIN, y: y },
      thickness: 0.8,
      color: COLORS.lime,
    })
    page.drawText('Total mensual', { x: MARGIN + 12, y: y - 14, size: 9, font: bold, color: COLORS.ink })
    page.drawText('Facturación recurrente', {
      x: MARGIN + 220,
      y: y - 14,
      size: 9,
      font,
      color: COLORS.muted,
    })
    drawRightText(formatMoney(totalAmount), {
      x: PAGE_WIDTH - MARGIN - 12,
      y: y - 14,
      size: 10,
      font: bold,
      color: COLORS.ink,
    })
    y -= rowHeight
  } else {
    page.drawText('No hay un plan contratado para mostrar.', { x: MARGIN, y: y - 16, size: 10, font, color: COLORS.muted })
    y -= 32
  }

  y -= 24
  ensureSpace(120)
  drawSectionLabel('Historial de cobros', y)
  y -= 18

  if (invoices.length === 0) {
    page.drawText('Aún no hay cobros registrados.', { x: MARGIN, y: y - 16, size: 10, font, color: COLORS.muted })
    y -= 30
  } else {
    const historyColumns = [
      { label: 'Período', x: MARGIN + 12 },
      { label: 'Estado', x: MARGIN + 218 },
      { label: 'Fecha de pago', x: MARGIN + 330 },
      { label: 'Importe', x: PAGE_WIDTH - MARGIN - 12, align: 'right' as const },
    ]

    const drawHistoryHeader = () => {
      y = drawTableHeader(historyColumns, y)
    }

    drawHistoryHeader()

    const rowHeight = 22
    invoices.forEach((invoice, index) => {
      if (y - rowHeight < MARGIN + 56) {
        addContinuationPage()
        drawHistoryHeader()
      }

      if (index % 2 === 0) {
        page.drawRectangle({
          x: MARGIN,
          y: y - rowHeight,
          width: CONTENT_WIDTH,
          height: rowHeight,
          color: rgb(0.985, 0.988, 0.98),
        })
      }

      const period = `${formatDate(invoice.periodo_inicio)} - ${formatDate(invoice.periodo_fin)}`
      page.drawText(fitText(period, font, 8.5, 190), {
        x: MARGIN + 12,
        y: y - 14,
        size: 8.5,
        font,
        color: COLORS.ink,
      })

      page.drawCircle({
        x: MARGIN + 217,
        y: y - 11,
        size: 2.2,
        color: invoiceDotColor(invoice.estado),
      })
      page.drawText(fitText(invoiceStatusLabel(invoice.estado), font, 8.5, 95), {
        x: MARGIN + 224,
        y: y - 14,
        size: 8.5,
        font,
        color: COLORS.ink,
      })
      page.drawText(formatDate(invoice.pagada_at), {
        x: MARGIN + 330,
        y: y - 14,
        size: 8.5,
        font,
        color: COLORS.muted,
      })
      drawRightText(formatMoney(Number(invoice.monto)), {
        x: PAGE_WIDTH - MARGIN - 12,
        y: y - 14,
        size: 8.5,
        font: bold,
        color: COLORS.ink,
      })
      page.drawLine({
        start: { x: MARGIN, y: y - rowHeight },
        end: { x: PAGE_WIDTH - MARGIN, y: y - rowHeight },
        thickness: 0.4,
        color: COLORS.border,
      })
      y -= rowHeight
    })
  }

  pages.forEach((currentPage, index) => {
    currentPage.drawLine({
      start: { x: MARGIN, y: MARGIN + 32 },
      end: { x: PAGE_WIDTH - MARGIN, y: MARGIN + 32 },
      thickness: 0.6,
      color: COLORS.border,
    })
    const footerSize = 7.2
    const footerLead = 'Resumen informativo generado por Grassly. El comprobante oficial es el emitido por Mercado Pago.'
    const footerLink = 'Ver los detalles de tu suscripción en tu cuenta de Mercado Pago.'
    const footerLeadY = MARGIN + 20
    const footerLinkY = MARGIN + 8
    currentPage.drawText(footerLead, {
      x: MARGIN,
      y: footerLeadY,
      size: footerSize,
      font,
      color: COLORS.muted,
    })
    currentPage.drawText(footerLink, {
      x: MARGIN,
      y: footerLinkY,
      size: footerSize,
      font,
      color: rgb(0.05, 0.34, 0.72),
    })
    const linkWidth = font.widthOfTextAtSize(footerLink, footerSize)
    const linkAnnotation = doc.context.register(doc.context.obj({
      Type: PDFName.of('Annot'),
      Subtype: PDFName.of('Link'),
      Rect: [MARGIN, footerLinkY - 1, MARGIN + linkWidth, footerLinkY + footerSize + 2],
      Border: [0, 0, 0],
      A: { Type: PDFName.of('Action'), S: PDFName.of('URI'), URI: PDFString.of('https://www.mercadopago.com.pe/') },
    }))
    currentPage.node.addAnnot(linkAnnotation)
    const pageLabel = `Página ${index + 1} de ${pages.length}`
    currentPage.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(pageLabel, 8),
      y: MARGIN + 18,
      size: 8,
      font,
      color: COLORS.muted,
    })
  })


  return doc.save()
}
