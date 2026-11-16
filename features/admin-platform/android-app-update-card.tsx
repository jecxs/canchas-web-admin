'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  activateAndroidUpdateMinimumAction,
  deactivateAndroidUpdateMinimumAction,
} from './app-update-actions'
import { initialAppUpdateActionState } from './types'
import type { AndroidAppUpdatePolicy, AppUpdateActionState } from './types'

function ActionFeedback({ state }: { state: AppUpdateActionState }) {
  if (!state.message) return null
  return (
    <p className={state.success ? 'text-sm text-primary' : 'text-sm text-destructive'} role={state.success ? 'status' : 'alert'}>
      {state.message}
    </p>
  )
}

function formatDate(value: string | null) {
  if (!value) return 'Sin registro'
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(value))
}

export function AndroidAppUpdateCard({ policy }: { policy: AndroidAppUpdatePolicy }) {
  const router = useRouter()
  const [activateState, activateAction, activating] = useActionState(
    activateAndroidUpdateMinimumAction,
    initialAppUpdateActionState,
  )
  const [deactivateState, deactivateAction, deactivating] = useActionState(
    deactivateAndroidUpdateMinimumAction,
    initialAppUpdateActionState,
  )
  const [activationConfirmed, setActivationConfirmed] = useState(false)
  const [deactivationConfirmed, setDeactivationConfirmed] = useState(false)
  const hasCandidate = policy.version_codigo_candidata !== null
  const canActivate = hasCandidate && policy.version_codigo_candidata! > policy.version_codigo_minima

  useEffect(() => {
    if (activateState.success || deactivateState.success) router.refresh()
  }, [activateState.success, deactivateState.success, router])

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="android-update-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">Google Play</p>
          <h2 id="android-update-title" className="mt-1 text-xl font-black tracking-tight">Actualizaciones obligatorias</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            EAS registra una candidata al terminar la build de producción. El bloqueo solo entra en vigor cuando lo activas aquí, después de confirmar que Play Console ya la ofrece.
          </p>
        </div>
        <Badge variant={policy.version_codigo_minima > 0 ? 'destructive' : 'secondary'}>
          {policy.version_codigo_minima > 0 ? 'Bloqueo activo' : 'Bloqueo desactivado'}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-xs font-semibold text-muted-foreground">Versión mínima activa</p>
          <p className="mt-1 text-lg font-extrabold">
            {policy.version_codigo_minima > 0 ? `Android build ${policy.version_codigo_minima}` : 'Ninguna'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Activada: {formatDate(policy.minimo_activado_at)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-xs font-semibold text-muted-foreground">Build candidata de EAS</p>
          {hasCandidate ? (
            <>
              <p className="mt-1 text-lg font-extrabold">
                {policy.version_nombre_candidata} · build {policy.version_codigo_candidata}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Registrada {formatDate(policy.candidata_registrada_at)}
                {policy.eas_build_id ? ` · EAS ${policy.eas_build_id.slice(0, 8)}` : ''}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Aún no se registró una build. Usa el flujo de build Android de producción en EAS.</p>
          )}
        </div>
      </div>

      {canActivate ? (
        <form action={activateAction} className="mt-5 space-y-3 rounded-2xl border border-warning/40 bg-warning/5 p-4">
          <input type="hidden" name="version_code" value={policy.version_codigo_candidata ?? ''} />
          <input type="hidden" name="eas_build_id" value={policy.eas_build_id ?? ''} />
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-5">
            <input
              className="mt-1 size-4 shrink-0 accent-primary"
              type="checkbox"
              name="confirm"
              value="yes"
              checked={activationConfirmed}
              onChange={(event) => setActivationConfirmed(event.target.checked)}
              required
            />
            <span>
              Confirmo que Google Play Console ya muestra la versión {policy.version_nombre_candidata} (build {policy.version_codigo_candidata}) como disponible para los usuarios.
            </span>
          </label>
          <ActionFeedback state={activateState} />
          <Button type="submit" disabled={activating || !activationConfirmed}>
            {activating && <Spinner />}
            Activar bloqueo desde esta versión
          </Button>
        </form>
      ) : hasCandidate ? (
        <p className="mt-5 rounded-2xl border border-border bg-muted/35 p-4 text-sm text-muted-foreground">
          La candidata no supera el mínimo activo, así que no puede activarse. Una build posterior aparecerá aquí cuando termine en EAS.
        </p>
      ) : null}

      {policy.version_codigo_minima > 0 && (
        <form action={deactivateAction} className="mt-4 space-y-3 rounded-2xl border border-destructive/30 p-4">
          <p className="text-sm font-semibold">Desactivar por emergencia</p>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-muted-foreground">
            <input
              className="mt-1 size-4 shrink-0 accent-primary"
              type="checkbox"
              name="confirm"
              value="yes"
              checked={deactivationConfirmed}
              onChange={(event) => setDeactivationConfirmed(event.target.checked)}
              required
            />
            <span>Confirmo que las versiones anteriores volverán a poder abrir Grassly.</span>
          </label>
          <ActionFeedback state={deactivateState} />
          <Button type="submit" variant="destructive" disabled={deactivating || !deactivationConfirmed}>
            {deactivating && <Spinner />}
            Desactivar bloqueo
          </Button>
        </form>
      )}
    </section>
  )
}
