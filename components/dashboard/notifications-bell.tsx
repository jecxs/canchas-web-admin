'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { BellIcon, Calendar03Icon, CheckmarkCircle01Icon, Notification01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { loadOwnerNotificationsAction, markOwnerNotificationsReadAction } from '@/features/notifications/actions'
import { notify } from '@/lib/notifications/notify'
import { createClient } from '@/utils/supabase/client'
import type { OwnerNotification } from '@/features/notifications/queries'

type NotificationsBellProps = {
  recipientId: string
  initialNotifications: OwnerNotification[]
}

function relativeTime(value: string, nowMs: number) {
  const seconds = Math.max(0, Math.floor((nowMs - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'Ahora'
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' }).format(new Date(value))
}

function fromRealtime(record: Record<string, unknown>): OwnerNotification | null {
  if (typeof record.id !== 'string' || typeof record.destinatario_id !== 'string' || typeof record.titulo !== 'string' || typeof record.mensaje !== 'string' || typeof record.created_at !== 'string' || typeof record.tipo !== 'string') return null
  return {
    id: record.id,
    recipientId: record.destinatario_id,
    title: record.titulo,
    message: record.mensaje,
    href: typeof record.href === 'string' ? record.href : null,
    readAt: typeof record.leida_at === 'string' ? record.leida_at : null,
    createdAt: record.created_at,
    type: record.tipo,
    reservationId: typeof record.reserva_id === 'string' ? record.reserva_id : null,
  }
}

function agendaHref(item: OwnerNotification) {
  const href = item.href ?? '/panel/agenda'
  if (!item.reservationId || href.includes('reservation=')) return href
  return `${href}${href.includes('?') ? '&' : '?'}reservation=${encodeURIComponent(item.reservationId)}`
}

export function NotificationsBell({ recipientId, initialNotifications }: NotificationsBellProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialNotifications)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [nowMs, setNowMs] = useState(0)
  const [view, setView] = useState<'all' | 'unread'>('all')
  const [hasMore, setHasMore] = useState(initialNotifications.length === 20)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const unreadCount = useMemo(() => items.filter((item) => !item.readAt).length, [items])
  const visibleItems = useMemo(() => view === 'unread' ? items.filter((item) => !item.readAt) : items, [items, view])

  useEffect(() => {
    const refresh = () => setNowMs(Date.now())
    refresh()
    const interval = window.setInterval(refresh, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const openNotification = useCallback((item: OwnerNotification) => {
    router.push(agendaHref(item))
  }, [router])

  const showIncomingReservationToast = useCallback((item: OwnerNotification) => {
    notify.info({
      title: item.title,
      description: item.message,
      icon: <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2.25} className="size-4 text-primary" />,
      button: { title: 'Abrir Agenda', onClick: () => openNotification(item) },
      duration: 10_000,
      roundness: 18,
      autopilot: { expand: 0, collapse: 7_500 },
      styles: {
        title: 'font-sans font-extrabold text-sidebar-foreground!',
        description: 'font-sans text-sidebar-foreground/80!',
        button: 'font-sans font-extrabold text-xs!',
      },
    })
  }, [openNotification])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`owner-notifications:${recipientId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `destinatario_id=eq.${recipientId}`,
      }, (payload) => {
        const item = fromRealtime(payload.new as Record<string, unknown>)
        if (!item) return
        setItems((current) => current.some((existing) => existing.id === item.id) ? current : [item, ...current])
        showIncomingReservationToast(item)
        if ('Notification' in window && Notification.permission === 'granted') {
          const native = new Notification(item.title, { body: item.message, tag: item.id })
          native.onclick = () => {
            window.focus()
            window.location.assign(agendaHref(item))
          }
        }
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [recipientId, showIncomingReservationToast])

  async function requestBrowserPermission() {
    if (!('Notification' in window)) {
      notify.warning({ description: 'Este navegador no admite notificaciones del sistema.' })
      return
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') notify.success({ description: 'Los avisos del navegador están activados.' })
    else notify.warning({ description: 'No se concedió permiso. Puedes activarlo luego desde la configuración del navegador.' })
  }

  async function markRead(id?: string) {
    const previous = items
    const readAt = new Date().toISOString()
    setItems((current) => current.map((item) => !item.readAt && (!id || item.id === id) ? { ...item, readAt } : item))
    try {
      await markOwnerNotificationsReadAction(id)
    } catch {
      setItems(previous)
      notify.error({ description: 'No se pudo guardar el estado de lectura.' })
    }
  }

  async function loadMore() {
    const oldest = items.at(-1)?.createdAt
    if (!oldest || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const page = await loadOwnerNotificationsAction(oldest)
      setItems((current) => [...current, ...page.filter((item) => !current.some((existing) => existing.id === item.id))])
      setHasMore(page.length === 20)
    } catch {
      notify.error({ description: 'No se pudo cargar el historial de notificaciones.' })
    } finally {
      setIsLoadingMore(false)
    }
  }

  return <Popover>
    <PopoverTrigger asChild>
      <Button type="button" variant="ghost" size="icon-sm" className="relative rounded-xl" aria-label={unreadCount ? `${unreadCount} notificaciones sin leer` : 'Notificaciones'}>
        <HugeiconsIcon icon={BellIcon} strokeWidth={2} className="size-5" />
        {unreadCount > 0 && <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-black leading-4 text-primary-foreground">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] p-0">
      <div className="flex items-center justify-between border-b px-4 py-3"><div><p className="text-sm font-extrabold">Notificaciones</p><p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} sin leer` : 'Todo al día'}</p></div>{unreadCount > 0 && <Button type="button" size="sm" variant="ghost" onClick={() => void markRead()}><HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} /> Marcar leídas</Button>}</div>
      {permission !== 'granted' && <div className="border-b bg-muted/35 px-4 py-3"><p className="text-xs font-bold">Avisos del navegador</p><p className="mt-1 text-xs text-muted-foreground">Recibe un aviso del sistema cuando llegue una nueva reserva mientras el panel esté abierto.</p><Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => void requestBrowserPermission()} disabled={permission === 'denied'}>{permission === 'denied' ? 'Permiso bloqueado' : 'Activar avisos'}</Button></div>}
      <div className="flex gap-1 border-b px-4 py-2"><Button type="button" size="xs" variant={view === 'all' ? 'secondary' : 'ghost'} onClick={() => setView('all')}>Todas</Button><Button type="button" size="xs" variant={view === 'unread' ? 'secondary' : 'ghost'} onClick={() => setView('unread')}>Sin leer{unreadCount ? ` (${unreadCount})` : ''}</Button></div>
      <div className="max-h-[22rem] overflow-y-auto">{visibleItems.length ? visibleItems.map((item) => <Link key={item.id} href={agendaHref(item)} onClick={() => { if (!item.readAt) void markRead(item.id) }} className={`flex gap-3 border-b px-4 py-3 transition-colors hover:bg-accent/70 ${item.readAt ? 'opacity-65' : 'bg-primary/5'}`}><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-emerald-700 text-white shadow-sm"><HugeiconsIcon icon={Notification01Icon} strokeWidth={2.25} className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><strong className="text-sm">{item.title}</strong><small className="shrink-0 text-[10px] text-muted-foreground">{nowMs ? relativeTime(item.createdAt, nowMs) : ''}</small></span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{item.message}</span></span></Link>) : <div className="px-4 py-10 text-center"><HugeiconsIcon icon={BellIcon} strokeWidth={1.5} className="mx-auto size-7 text-muted-foreground" /><p className="mt-2 text-sm font-bold">{items.length && view === 'unread' ? 'No tienes notificaciones sin leer' : 'Aún no hay notificaciones'}</p><p className="mt-1 text-xs text-muted-foreground">{items.length && view === 'unread' ? 'Las nuevas aparecerán aquí.' : 'Aquí verás las reservas con comprobante por validar.'}</p></div>}{hasMore && <div className="p-3"><Button type="button" size="sm" variant="outline" className="w-full" onClick={() => void loadMore()} disabled={isLoadingMore}>{isLoadingMore ? 'Cargando…' : 'Cargar historial'}</Button></div>}</div>
    </PopoverContent>
  </Popover>
}
