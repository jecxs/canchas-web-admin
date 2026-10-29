'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BellIcon,
  Building03Icon,
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Globe02Icon,
  Notification01Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { loadOwnerNotificationsAction, markOwnerNotificationsReadAction } from '@/features/notifications/actions'
import { notify } from '@/lib/notifications/notify'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import type { OwnerNotification } from '@/features/notifications/queries'
import type { LocalSummary } from '@/lib/auth/access'

type NotificationsBellProps = {
  recipientId: string
  locals: LocalSummary[]
  activeLocalId: string | null
  activeLocalName: string | null
  initialNotifications: OwnerNotification[]
}

type NotificationScope = 'all' | 'active'

const NOTIFICATION_SCOPE_KEY = 'grassly_notification_scope'

const ownerNotificationTypes = new Set(['reserva_pendiente_validacion', 'moderacion_local'])

function relativeTime(value: string, nowMs: number) {
  const seconds = Math.max(0, Math.floor((nowMs - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'Ahora'
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' }).format(new Date(value))
}

function fromRealtime(record: Record<string, unknown>): OwnerNotification | null {
  if (typeof record.id !== 'string' || typeof record.destinatario_id !== 'string' || typeof record.titulo !== 'string' || typeof record.mensaje !== 'string' || typeof record.created_at !== 'string' || typeof record.tipo !== 'string' || !ownerNotificationTypes.has(record.tipo)) return null
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
    localId: typeof record.local_id === 'string' ? record.local_id : null,
  }
}

function notificationHref(item: OwnerNotification) {
  // El route handler valida propiedad, cambia la sede activa, marca como leída
  // y recién después redirige al destino real de la notificación.
  return `/panel/notificaciones/${encodeURIComponent(item.id)}`
}

function CountPill({ count }: { count: number }) {
  return (
    <span className="ml-0.5 rounded-full bg-primary/12 px-1.5 py-0.5 text-[9px] font-black leading-none text-primary">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function SegmentButton({
  active,
  children,
  disabled = false,
  onClick,
  title,
}: {
  active: boolean
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-bold transition-colors',
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      {children}
    </button>
  )
}

function NotificationRow({
  item,
  localName,
  nowMs,
}: {
  item: OwnerNotification
  localName: string | null
  nowMs: number
}) {
  return (
    <a
      href={notificationHref(item)}
      className={`flex gap-3 border-b px-4 py-3 transition-colors hover:bg-accent/70 ${item.readAt ? 'opacity-65' : 'bg-primary/5'}`}
    >
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-emerald-700 text-white shadow-sm">
        <HugeiconsIcon icon={Notification01Icon} strokeWidth={2.25} className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <strong className="text-sm">{item.title}</strong>
          <small className="shrink-0 text-[10px] text-muted-foreground">
            {nowMs ? relativeTime(item.createdAt, nowMs) : ''}
          </small>
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {localName ? <span className="font-semibold text-foreground">{localName} · </span> : null}
          {item.message}
        </span>
      </span>
    </a>
  )
}

export function NotificationsBell({
  recipientId,
  locals,
  activeLocalId,
  activeLocalName,
  initialNotifications,
}: NotificationsBellProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialNotifications)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [nowMs, setNowMs] = useState(0)
  const [view, setView] = useState<'all' | 'unread'>('all')
  // El primer render debe ser idéntico en servidor y cliente. La preferencia
  // guardada se aplica después de la hidratación para evitar mismatches.
  const [scope, setScope] = useState<NotificationScope>('all')
  const [hasMore, setHasMore] = useState(initialNotifications.length === 20)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // Evita repetir un aviso si Realtime y la reconciliación detectan la misma fila.
  const knownNotificationIds = useRef(new Set(initialNotifications.map((item) => item.id)))
  const localNames = useMemo(() => new Map(locals.map((local) => [local.id, local.nombre])), [locals])
  const localNameFor = useCallback(
    (item: OwnerNotification) => item.localId ? localNames.get(item.localId) ?? null : null,
    [localNames],
  )
  const showScopeFilter = locals.length > 1
  const canFilterByActive = Boolean(activeLocalId)
  const effectiveScope: NotificationScope = showScopeFilter && canFilterByActive ? scope : 'all'
  const totalUnread = useMemo(() => items.filter((item) => !item.readAt).length, [items])
  const activeUnread = useMemo(
    () => activeLocalId
      ? items.filter((item) => !item.readAt && item.localId === activeLocalId).length
      : 0,
    [activeLocalId, items],
  )
  const scopedItems = useMemo(
    () => effectiveScope === 'active' && activeLocalId
      ? items.filter((item) => item.localId === activeLocalId)
      : items,
    [activeLocalId, effectiveScope, items],
  )
  const scopedUnread = useMemo(
    () => scopedItems.filter((item) => !item.readAt).length,
    [scopedItems],
  )
  const visibleItems = useMemo(
    () => view === 'unread' ? scopedItems.filter((item) => !item.readAt) : scopedItems,
    [scopedItems, view],
  )

  useEffect(() => {
    const stored = window.localStorage.getItem(NOTIFICATION_SCOPE_KEY)
    if (stored !== 'active') return

    const frame = window.requestAnimationFrame(() => setScope('active'))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  function changeScope(next: NotificationScope) {
    setScope(next)
    window.localStorage.setItem(NOTIFICATION_SCOPE_KEY, next)
  }

  useEffect(() => {
    const refresh = () => setNowMs(Date.now())
    refresh()
    const interval = window.setInterval(refresh, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    // El permiso pertenece al navegador y sobrevive a una recarga. Consultarlo
    // al montar evita mostrar "Activar avisos" cuando ya fue concedido.
    const syncPermission = () => {
      setPermission('Notification' in window ? Notification.permission : 'unsupported')
    }
    const frame = window.requestAnimationFrame(syncPermission)
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const openNotification = useCallback((item: OwnerNotification) => {
    // Navegación completa: el route handler cambia la sede activa, marca como
    // leída y redirige al destino real.
    window.location.assign(notificationHref(item))
  }, [])

  const showIncomingNotificationToast = useCallback((item: OwnerNotification) => {
    const localName = localNameFor(item)
    notify.info({
      title: item.title,
      description: localName ? `${localName} · ${item.message}` : item.message,
      icon: <HugeiconsIcon icon={item.reservationId ? Calendar03Icon : Notification01Icon} strokeWidth={2.25} className="size-4 text-primary" />,
      button: { title: item.reservationId ? 'Abrir agenda' : 'Ver detalle', onClick: () => openNotification(item) },
      duration: 10_000,
      roundness: 18,
      autopilot: { expand: 0, collapse: 7_500 },
      styles: {
        title: 'font-sans font-extrabold text-sidebar-foreground!',
        description: 'font-sans text-sidebar-foreground/80!',
        button: 'font-sans font-extrabold text-xs!',
      },
    })
  }, [localNameFor, openNotification])

  const receiveIncomingNotification = useCallback((item: OwnerNotification) => {
    if (knownNotificationIds.current.has(item.id)) return false

    knownNotificationIds.current.add(item.id)
    setItems((current) => [item, ...current])

    // En modo "Sede actual" no interrumpimos con avisos de otras sedes. La fila
    // igual queda en la bandeja para verla al cambiar el filtro a Global.
    const belongsToActiveLocal = Boolean(activeLocalId) && item.localId === activeLocalId
    const shouldAnnounce = effectiveScope === 'all' || belongsToActiveLocal

    if (shouldAnnounce) {
      showIncomingNotificationToast(item)

      if ('Notification' in window && Notification.permission === 'granted') {
        const localName = localNameFor(item)
        const native = new Notification(item.title, {
          body: localName ? `${localName} · ${item.message}` : item.message,
          tag: item.id,
        })
        native.onclick = () => {
          window.focus()
          window.location.assign(notificationHref(item))
        }
      }
    }

    // La cabecera recibe el evento y refresca los Server Components de la ruta
    // actual. Así, si el dueño está en Agenda, el bloque aparece sin recargar.
    router.refresh()
    return true
  }, [activeLocalId, effectiveScope, localNameFor, router, showIncomingNotificationToast])

  const reconcileNotifications = useCallback(async () => {
    try {
      const latest = await loadOwnerNotificationsAction()
      // La consulta viene de más reciente a más antigua; se muestran en orden real
      // cuando hubo más de una llegada mientras el canal estaba reconectando.
      latest.toReversed().forEach(receiveIncomingNotification)
    } catch {
      // La siguiente ejecución vuelve a intentarlo. No interrumpimos al dueño con
      // un aviso técnico por una recuperación en segundo plano.
    }
  }, [receiveIncomingNotification])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`owner-notifications:${recipientId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `destinatario_id=eq.${recipientId}`,
      }, (payload) => {
        const item = fromRealtime(payload.new as Record<string, unknown>)
        if (!item) return
        receiveIncomingNotification(item)
      })
      .subscribe((status) => {
        // Supabase intenta reconectar por sí solo. Al detectar que el socket no
        // llegó a suscribirse, conciliamos de inmediato con la fuente de verdad.
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') void reconcileNotifications()
      })
    return () => { void supabase.removeChannel(channel) }
  }, [recipientId, receiveIncomingNotification, reconcileNotifications])

  useEffect(() => {
    // Respaldo ante pestañas suspendidas, cambios de red o una reconexión que el
    // navegador no llegó a notificar. Realtime sigue siendo la vía inmediata.
    const interval = window.setInterval(() => { void reconcileNotifications() }, 20_000)
    const onOnline = () => { void reconcileNotifications() }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void reconcileNotifications()
    }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [reconcileNotifications])

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
    setItems((current) => current.map((item) => {
      const inScope = effectiveScope !== 'active' || item.localId === activeLocalId
      return inScope && !item.readAt && (!id || item.id === id) ? { ...item, readAt } : item
    }))
    try {
      await markOwnerNotificationsReadAction(
        id,
        effectiveScope === 'active' ? activeLocalId ?? undefined : undefined,
      )
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

  const headerSummary = totalUnread === 0
    ? 'Todo al día'
    : effectiveScope === 'active'
      ? `${activeUnread} en esta sede · ${totalUnread} en total`
      : `${totalUnread} sin leer`
  const badgeUnread = effectiveScope === 'active' ? activeUnread : totalUnread

  return <Popover>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="relative rounded-xl"
        aria-label={
          badgeUnread
            ? `${badgeUnread} notificaciones sin leer`
            : effectiveScope === 'active' && totalUnread > 0
              ? `${totalUnread} notificaciones en otras sedes`
              : 'Notificaciones'
        }
      >
        <HugeiconsIcon icon={BellIcon} strokeWidth={2} className="size-5" />
        {badgeUnread > 0 ? (
          <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-black leading-4 text-primary-foreground">
            {badgeUnread > 9 ? '9+' : badgeUnread}
          </span>
        ) : effectiveScope === 'active' && totalUnread > 0 ? (
          <span className="absolute right-1 top-1 size-1.5 rounded-full bg-muted-foreground/60" aria-hidden />
        ) : null}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] p-0">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold">Notificaciones</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{headerSummary}</p>
        </div>
        {scopedUnread > 0 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="shrink-0"
            title={effectiveScope === 'active' ? 'Marcar leídas de esta sede' : 'Marcar todas como leídas'}
            onClick={() => void markRead()}
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} /> Marcar leídas
          </Button>
        )}
      </div>
      {permission !== 'granted' && <div className="border-b bg-muted/35 px-4 py-3"><p className="text-xs font-bold">Avisos del navegador</p><p className="mt-1 text-xs text-muted-foreground">Recibe un aviso del sistema cuando llegue una nueva reserva mientras el panel esté abierto.</p><Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => void requestBrowserPermission()} disabled={permission === 'denied'}>{permission === 'denied' ? 'Permiso bloqueado' : 'Activar avisos'}</Button></div>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        {showScopeFilter ? (
          <div className="flex rounded-lg bg-muted p-0.5" role="group" aria-label="Alcance de las notificaciones">
            <SegmentButton active={effectiveScope === 'all'} onClick={() => changeScope('all')}>
              <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} className="size-3.5" />
              Global
              {totalUnread > 0 ? <CountPill count={totalUnread} /> : null}
            </SegmentButton>
            <SegmentButton
              active={effectiveScope === 'active'}
              disabled={!canFilterByActive}
              onClick={() => changeScope('active')}
              title={activeLocalName ? `Notificaciones de ${activeLocalName}` : undefined}
            >
              <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-3.5" />
              Sede actual
              {activeUnread > 0 ? <CountPill count={activeUnread} /> : null}
            </SegmentButton>
          </div>
        ) : null}
        <div className="ml-auto flex rounded-lg bg-muted p-0.5" role="group" aria-label="Estado de lectura">
          <SegmentButton active={view === 'all'} onClick={() => setView('all')}>Todas</SegmentButton>
          <SegmentButton active={view === 'unread'} onClick={() => setView('unread')}>
            Sin leer
            {scopedUnread > 0 ? <CountPill count={scopedUnread} /> : null}
          </SegmentButton>
        </div>
      </div>
      <div className="max-h-[22rem] overflow-y-auto">
        {visibleItems.length ? (
          visibleItems.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              localName={localNameFor(item)}
              nowMs={nowMs}
            />
          ))
        ) : (
          <div className="px-4 py-10 text-center">
            <HugeiconsIcon icon={BellIcon} strokeWidth={1.5} className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-2 text-sm font-bold">
              {view === 'unread' && scopedItems.length
                ? 'No tienes notificaciones sin leer'
                : effectiveScope === 'active'
                  ? `No hay notificaciones en ${activeLocalName ?? 'esta sede'}`
                  : 'Aún no hay notificaciones'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {view === 'unread' && scopedItems.length
                ? 'Las nuevas aparecerán aquí.'
                : effectiveScope === 'active'
                  ? 'Cuando llegue una reserva o aviso para esta sede, aparecerá aquí.'
                  : 'Aquí verás las novedades de tus reservas y del estado de tus sedes.'}
            </p>
          </div>
        )}
        {hasMore && (
          <div className="p-3">
            <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => void loadMore()} disabled={isLoadingMore}>
              {isLoadingMore ? 'Cargando…' : 'Cargar historial'}
            </Button>
          </div>
        )}
      </div>
    </PopoverContent>
  </Popover>
}
