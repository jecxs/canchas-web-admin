'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { shiftDate, startOfMonth, todayLima } from '../reportes/date-utils'
import type { CajaReport } from './types'

const MEDIO_COLORS: Record<string, string> = {
  mercadopago: 'bg-sky-500',
  yape: 'bg-violet-500',
  plin: 'bg-violet-300',
  transferencia: 'bg-emerald-500',
  efectivo: 'bg-amber-500',
  comprobante: 'bg-slate-400',
  manual: 'bg-slate-300',
  otro: 'bg-slate-200',
  reembolso: 'bg-destructive',
}

function money(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(value))
}

function rangeLabel(start: string, end: string) {
  const fmt = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' })
  if (start === end) return fmt.format(new Date(`${start}T12:00:00-05:00`))
  return `${fmt.format(new Date(`${start}T12:00:00-05:00`))} — ${fmt.format(new Date(`${end}T12:00:00-05:00`))}`
}

type Preset = { label: string; start: string; end: string }

function presets(): Preset[] {
  const today = todayLima()
  return [
    { label: 'Hoy', start: today, end: today },
    { label: '7 días', start: shiftDate(today, -6), end: today },
    { label: '30 días', start: shiftDate(today, -29), end: today },
    { label: 'Este mes', start: startOfMonth(today), end: today },
  ]
}

function PeriodPicker({ start, end }: { start: string; end: string }) {
  const router = useRouter()

  return (
    <div className="flex flex-wrap gap-2">
      {presets().map((preset) => {
        const active = preset.start === start && preset.end === end
        return (
          <Button
            key={preset.label}
            type="button"
            variant={active ? 'default' : 'secondary'}
            size="sm"
            onClick={() => router.push(`/panel/caja?start=${preset.start}&end=${preset.end}`)}
          >
            {preset.label}
          </Button>
        )
      })}
    </div>
  )
}

export function CajaView({ data }: { data: CajaReport }) {
  const total = data.totals.collected
  const methodTotal = data.byMethod.reduce((sum, item) => sum + item.amount, 0) || 1

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Caja</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Caja del local</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.localName} · {rangeLabel(data.start, data.end)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodPicker start={data.start} end={data.end} />
          <a
            href="https://www.mercadopago.com.pe/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[#FFE600] px-3 text-sm font-bold text-[#191919] transition-colors hover:bg-[#f5da00]"
            aria-label="Abrir mi cuenta de Mercado Pago"
          >
            <Image src="/mplogo.png" width={22} height={16} alt="" />
            Ver Mercado Pago
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Cobrado menos reembolsos</p>
            <p className="mt-2 text-2xl font-black">{money(data.totals.neto)}</p>
            <p className="mt-1 text-xs text-muted-foreground">antes de deducciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ingresos brutos</p>
            <p className="mt-2 text-2xl font-black">{money(total)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{data.totals.count} cobro{data.totals.count === 1 ? '' : 's'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Mercado Pago · bruto</p>
            <p className="mt-2 text-2xl font-black">{money(data.mercadoPago.bruto)}</p>
            <div className="mt-3 space-y-1 border-t pt-2 text-xs">
              <div className="flex justify-between gap-2 text-muted-foreground">
                <span>Deducciones</span>
                <span>{data.mercadoPago.deducciones === null ? 'Pendiente' : `−${money(data.mercadoPago.deducciones)}`}</span>
              </div>
              <div className="flex justify-between gap-2 font-bold">
                <span>Recibido</span>
                <span>{data.mercadoPago.netoRecibido === null ? 'Pendiente' : money(data.mercadoPago.netoRecibido)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Comprobante / manual</p>
            <p className="mt-2 text-2xl font-black">{money(data.totals.comprobante)}</p>
            <p className="mt-1 text-xs text-muted-foreground">yape, plin, efectivo y otros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Reembolsos</p>
            <p className={cn('mt-2 text-2xl font-black', data.totals.reembolsos > 0 && 'text-destructive')}>
              {money(data.totals.reembolsos)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">devueltos en el periodo</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Desglose por medio de pago</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {data.byMethod.length ? (
            data.byMethod.map((item) => (
              <div key={item.id}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className={cn('size-2.5 rounded-full', MEDIO_COLORS[item.id] ?? 'bg-slate-400')} />
                    {item.label}
                  </span>
                  <span className="text-muted-foreground">
                    {money(item.amount)} · {item.count} cobro{item.count === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', MEDIO_COLORS[item.id] ?? 'bg-slate-400')}
                    style={{ width: `${Math.round((item.amount / methodTotal) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No hay cobros registrados en este periodo.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Movimientos</CardTitle></CardHeader>
        <CardContent>
          {data.movements.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-semibold">Fecha</th>
                    <th className="py-2 pr-4 font-semibold">Cliente</th>
                    <th className="py-2 pr-4 font-semibold">Cancha</th>
                    <th className="py-2 pr-4 font-semibold">Medio</th>
                    <th className="py-2 pr-4 font-semibold">Tipo</th>
                    <th className="py-2 text-right font-semibold">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.movements.map((movement) => (
                    <tr key={movement.movimiento_id}>
                      <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">{dateTime(movement.created_at)}</td>
                      <td className="py-3 pr-4 font-medium">{movement.cliente}</td>
                      <td className="py-3 pr-4">{movement.cancha_nombre}</td>
                      <td className="py-3 pr-4 capitalize">{movement.medio_tipo}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={movement.tipo === 'reembolso' ? 'destructive' : movement.tipo === 'saldo' ? 'neutral' : 'success'}>
                          {movement.tipo}
                        </Badge>
                      </td>
                      <td className={cn('py-3 text-right font-semibold whitespace-nowrap', movement.monto < 0 && 'text-destructive')}>
                        {money(movement.monto)}
                        {movement.medio_tipo === 'mercadopago' && movement.tipo === 'adelanto' ? (
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            {movement.netoRecibido === null || movement.netoRecibido === undefined || movement.deducciones === null || movement.deducciones === undefined
                              ? 'Recibido pendiente'
                              : `−${money(movement.deducciones)} · Recibido ${money(movement.netoRecibido)}`}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay movimientos en este periodo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
