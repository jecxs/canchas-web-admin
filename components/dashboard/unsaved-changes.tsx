'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type Change = { label: string; from: string; to: string }

type UnsavedSection = {
  id: string
  title: string
  getChanges: () => Change[]
  save: () => void
  discard: () => void
}

type SectionStatus = { pending: boolean; success: boolean }

type UnsavedChangesContextValue = {
  register: (section: UnsavedSection) => () => void
  notify: () => void
  reportStatus: (id: string, status: SectionStatus) => void
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null)

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext)
}

type SaveJob = {
  target: string | null
  awaiting: Set<string>
  started: Set<string>
  failed: Set<string>
}

// Coordina el aviso de cambios sin guardar entre todas las secciones de una
// página. Intercepta la navegación interna y el cierre/recarga de la pestaña.
export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sections, setSections] = useState<UnsavedSection[]>([])
  const jobRef = useRef<SaveJob | null>(null)
  const [revision, setRevision] = useState(0)
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const notify = useCallback(() => setRevision((value) => value + 1), [])

  const register = useCallback((section: UnsavedSection) => {
    setSections((current) => [...current.filter((item) => item.id !== section.id), section])
    return () => {
      setSections((current) => current.filter((item) => item.id !== section.id))
    }
  }, [])

  const reportStatus = useCallback(
    (id: string, status: SectionStatus) => {
      const job = jobRef.current
      if (!job || !job.awaiting.has(id)) return
      if (status.pending) {
        job.started.add(id)
        return
      }
      if (!job.started.has(id)) return
      job.awaiting.delete(id)
      if (!status.success) job.failed.add(id)
      if (job.awaiting.size > 0) return

      jobRef.current = null
      setSaving(false)
      if (job.failed.size > 0) {
        setError('No se pudieron guardar todos los cambios. Revisa cada sección e inténtalo otra vez.')
        return
      }
      setOpen(false)
      if (job.target) router.push(job.target)
    },
    [router],
  )

  const contextValue = useMemo(
    () => ({ register, notify, reportStatus }),
    [register, notify, reportStatus],
  )

  // `revision` solo fuerza el recálculo de las secciones sucias.
  void revision

  const dirtySections: UnsavedSection[] = []
  for (const section of sections) {
    if (section.getChanges().length > 0) dirtySections.push(section)
  }
  const hasUnsaved = dirtySections.length > 0

  useEffect(() => {
    if (!hasUnsaved) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsaved])

  useEffect(() => {
    if (!hasUnsaved) return
    const handler = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }
      const anchor = (event.target as HTMLElement | null)?.closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return
      }
      const url = new URL(anchor.href, window.location.href)
      if (url.pathname === window.location.pathname) return

      event.preventDefault()
      event.stopPropagation()
      setError(null)
      setSaving(false)
      setTarget(url.pathname + url.search + url.hash)
      setOpen(true)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [hasUnsaved])

  function discardAndLeave() {
    for (const section of dirtySections) section.discard()
    setOpen(false)
    if (target) router.push(target)
  }

  function saveAndLeave() {
    setError(null)
    setSaving(true)
    jobRef.current = {
      target,
      awaiting: new Set(dirtySections.map((section) => section.id)),
      started: new Set(),
      failed: new Set(),
    }
    if (jobRef.current.awaiting.size === 0) {
      jobRef.current = null
      setSaving(false)
      setOpen(false)
      if (target) router.push(target)
      return
    }
    for (const section of dirtySections) section.save()
  }

  return (
    <UnsavedChangesContext.Provider value={contextValue}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!saving) setOpen(next)
        }}
      >
        <DialogContent className="theme-admin sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5 text-warning-foreground" />
              Cambios sin guardar
            </DialogTitle>
            <DialogDescription>
              Tienes cambios que no se guardaron. Puedes descartarlos o guardarlos antes de salir.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 space-y-4 overflow-y-auto">
            {dirtySections.map((section) => (
              <div key={section.id}>
                <p className="text-xs font-extrabold uppercase tracking-[.12em] text-muted-foreground">
                  {section.title}
                </p>
                <ul className="mt-2 space-y-2">
                  {section.getChanges().map((change, index) => (
                    <li key={`${change.label}-${index}`} className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
                      <p className="font-bold">{change.label}</p>
                      <p className="mt-0.5 break-words text-xs text-muted-foreground">
                        <span className="line-through">{change.from}</span>
                        <span className="mx-1.5 text-foreground">→</span>
                        <span className="font-semibold text-foreground">{change.to}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="ghost" disabled={saving} onClick={() => setOpen(false)}>
              Quedarme
            </Button>
            <Button type="button" variant="outline" disabled={saving} onClick={discardAndLeave}>
              Descartar y salir
            </Button>
            <Button type="button" disabled={saving} onClick={saveAndLeave}>
              {saving ? <Spinner /> : null}
              Guardar todas y salir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UnsavedChangesContext.Provider>
  )
}
