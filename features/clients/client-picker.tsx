'use client'

import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, CheckmarkCircle01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'

type PickerState = { fieldErrors?: Record<string, string[] | undefined> }

export type PickedClient = {
  clienteId: string | null
  name: string
  phone: string | null
  isAccount: boolean
  totalReservations: number
}

type ClientOption = PickedClient

type Warning = { kind: 'local' | 'account'; option: ClientOption } | null

function phoneDigits(value: string | null | undefined) {
  const digits = (value ?? '').replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('51') ? digits.slice(2) : digits
}

function FieldError({ state, field }: { state: PickerState; field: string }) {
  const message = state.fieldErrors?.[field]?.[0]
  return message ? <p className="text-xs font-semibold text-destructive">{message}</p> : null
}

export function ClientPicker({ localId, state, onBlockedChange, initial = null }: { localId: string; state: PickerState; onBlockedChange?: (blocked: boolean) => void; initial?: PickedClient | null }) {
  const [mode, setMode] = useState<'new' | 'local'>('local')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [selected, setSelected] = useState<ClientOption | null>(initial)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [warning, setWarning] = useState<Warning>(null)

  useEffect(() => {
    if (mode !== 'local' || selected || !resultsOpen) return
    let active = true
    const handle = window.setTimeout(() => {
      setLoading(true)
      const supabase = createClient()
      supabase.rpc('obtener_clientes_local_dueno', { p_local_id: localId, p_busqueda: query.trim() || undefined, p_limite: 10 }).then(({ data, error }) => {
        if (!active) return
        setLoading(false)
        if (error) {
          console.error('[client-picker:search]', { code: error.code, message: error.message })
          setResults([])
          return
        }
        setResults((data ?? []).map((client) => ({
          clienteId: client.cliente_id,
          name: client.nombre,
          phone: client.telefono,
          isAccount: client.es_cuenta,
          totalReservations: Number(client.total_reservas),
        })))
      })
    }, 250)
    return () => { active = false; window.clearTimeout(handle) }
  }, [mode, query, localId, selected, resultsOpen])

  useEffect(() => {
    if (mode !== 'new') return
    const digits = phoneDigits(phone)
    let active = true
    const handle = window.setTimeout(async () => {
      if (digits.length < 7) {
        if (active) { setWarning(null); onBlockedChange?.(false) }
        return
      }
      const supabase = createClient()
      const [localResult, accountResult] = await Promise.all([
        supabase.rpc('obtener_clientes_local_dueno', { p_local_id: localId, p_busqueda: digits, p_limite: 5 }),
        supabase.rpc('buscar_perfil_por_telefono_dueno', { p_telefono: digits }),
      ])
      if (!active) return
      const localMatch = (localResult.data ?? []).find((client) => phoneDigits(client.telefono) === digits)
      if (localMatch) {
        setWarning({ kind: 'local', option: { clienteId: localMatch.cliente_id, name: localMatch.nombre, phone: localMatch.telefono, isAccount: localMatch.es_cuenta, totalReservations: Number(localMatch.total_reservas) } })
        onBlockedChange?.(true)
        return
      }
      const accountMatch = (accountResult.data ?? []).find((profile) => phoneDigits(profile.telefono) === digits)
      if (accountMatch) {
        setWarning({ kind: 'account', option: { clienteId: accountMatch.perfil_id, name: accountMatch.nombre_completo, phone: accountMatch.telefono, isAccount: true, totalReservations: 0 } })
        onBlockedChange?.(true)
        return
      }
      setWarning(null)
      onBlockedChange?.(false)
    }, 400)
    return () => { active = false; window.clearTimeout(handle) }
  }, [mode, phone, localId, onBlockedChange])

  function selectExisting(option: ClientOption) {
    setSelected(option)
    setWarning(null)
    onBlockedChange?.(false)
    setMode('local')
    setQuery('')
    setResultsOpen(false)
  }

  function switchMode(next: 'new' | 'local') {
    setMode(next)
    setResultsOpen(false)
    setWarning(null)
    onBlockedChange?.(false)
    if (next === 'new') setSelected(null)
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-3.5">
      <p className="text-center text-[10px] font-extrabold uppercase tracking-[.12em] text-foreground">Clientes</p>

      <div className="flex gap-2 rounded-2xl bg-muted/60 p-1">
        <button type="button" onClick={() => switchMode('new')} className={cn('flex-1 rounded-xl px-3 py-2 text-xs font-extrabold transition-colors', mode === 'new' ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>Cliente nuevo</button>
        <button type="button" onClick={() => switchMode('local')} className={cn('flex-1 rounded-xl px-3 py-2 text-xs font-extrabold transition-colors', mode === 'local' ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>Clientes del local</button>
      </div>

      {mode === 'new' ? (
        <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-semibold">Nombre del cliente<Input name="customerName" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Carlos Quispe" autoComplete="off" /><FieldError state={state} field="customerName" /></label>
            <label className="space-y-1.5 text-sm font-semibold">Teléfono<Input name="customerPhone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="999 999 999" inputMode="tel" autoComplete="off" /><FieldError state={state} field="customerPhone" /></label>
          </div>
          {warning && (
            <div className="flex flex-col gap-2 rounded-xl border border-warning/40 bg-warning/12 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-warning-foreground">{warning.kind === 'local' ? `Ese celular ya está registrado como ${warning.option.name} en este local.` : `Ese celular pertenece a la cuenta de ${warning.option.name}.`}</p>
              <Button type="button" size="sm" variant="outline" onClick={() => selectExisting(warning.option)}>{warning.kind === 'local' ? 'Usar cliente del local' : 'Vincular a la cuenta'}</Button>
            </div>
          )}
        </div>
      ) : selected ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/8 p-3.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5"><p className="truncate text-sm font-extrabold">{selected.name}</p><Badge variant={selected.isAccount ? 'default' : 'neutral'}>{selected.isAccount ? 'Cuenta' : 'Externo'}</Badge></div>
            <p className="mt-1 text-xs text-muted-foreground">{selected.phone ?? 'Sin teléfono'} · {selected.totalReservations} reserva{selected.totalReservations === 1 ? '' : 's'}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)}><HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />Cambiar</Button>
        </div>
      ) : (
        <Popover open={resultsOpen} onOpenChange={setResultsOpen}>
          <PopoverAnchor asChild>
            <div className="relative"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setResultsOpen(true) }} onFocus={() => setResultsOpen(true)} placeholder="Busca por nombre o celular" className="pl-10" /></div>
          </PopoverAnchor>
          <PopoverContent align="start" side="bottom" className="w-[var(--radix-popover-trigger-width)] min-w-72 p-1.5">
            <p className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">{query.trim() ? 'Resultados' : 'Últimos clientes'}</p>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {loading ? <p className="px-2.5 py-3 text-xs text-muted-foreground">Buscando clientes…</p> : results.length ? results.map((option) => (
                <button key={option.clienteId ?? `ext:${option.phone}`} type="button" onClick={() => selectExisting(option)} className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent">
                  <span className="min-w-0"><span className="flex items-center gap-1.5"><span className="truncate text-sm font-bold">{option.name}</span><Badge variant={option.isAccount ? 'default' : 'neutral'}>{option.isAccount ? 'Cuenta' : 'Externo'}</Badge></span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{option.phone ?? 'Sin teléfono'} · {option.totalReservations} reserva{option.totalReservations === 1 ? '' : 's'}</span></span>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4 shrink-0 text-primary" />
                </button>
              )) : <p className="px-2.5 py-3 text-xs text-muted-foreground">{query.trim() ? 'No se encontraron clientes con ese nombre o celular.' : 'Este local todavía no tiene clientes registrados.'}</p>}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {mode === 'local' && selected && <input type="hidden" name="clienteId" value={selected.clienteId ?? ''} />}
      {mode === 'local' && selected && <input type="hidden" name="customerName" value={selected.name} />}
      {mode === 'local' && selected && <input type="hidden" name="customerPhone" value={selected.phone ?? ''} />}
      {mode === 'local' && !selected && (state.fieldErrors?.customerName || state.fieldErrors?.customerPhone) && <p className="text-xs font-semibold text-destructive">Busca y selecciona un cliente del local, o cambia a “Cliente nuevo”.</p>}
    </section>
  )
}
