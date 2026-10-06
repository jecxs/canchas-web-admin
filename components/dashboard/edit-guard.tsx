'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Edit02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Button, buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUnsavedChanges, type Change } from './unsaved-changes'

type GuardContextValue = {
  editing: boolean
  startEditing: () => void
  cancelEditing: () => void
  discardChanges: () => void
  saveChanges: () => void
  reportStatus: (status: { pending: boolean; success: boolean }) => void
}

const GuardContext = createContext<GuardContextValue | null>(null)

export function useEditGuard() {
  return useContext(GuardContext)
}

function readValues(form: HTMLFormElement) {
  const map = new Map<string, string[]>()
  const push = (name: string, value: string) => {
    if (!name) return
    const list = map.get(name) ?? []
    list.push(value)
    map.set(name, list)
  }

  for (const element of Array.from(form.elements)) {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        if (element.checked) push(element.name, element.value)
      } else if (element.type === 'file') {
        continue
      } else if (element.type !== 'submit' && element.type !== 'button' && element.type !== 'reset') {
        push(element.name, element.value)
      }
    } else if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      push(element.name, element.value)
    }
  }

  return map
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function formatValue(value: string) {
  if (!value) return '—'
  return UUID.test(value) ? '•' : value
}

function labelFor(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name)
  const element = field instanceof RadioNodeList ? field[0] : field
  if (element instanceof HTMLElement) {
    const dataLabel = element.dataset.label
    if (dataLabel) return dataLabel
    if (element.id) {
      const label = form.querySelector(`label[for="${CSS.escape(element.id)}"]`)
      const text = label?.textContent?.trim()
      if (text) return text
    }
  }
  return name
}

function computeChanges(
  initial: Map<string, string[]>,
  current: Map<string, string[]>,
  form: HTMLFormElement,
): Change[] {
  const keys = new Set([...initial.keys(), ...current.keys()])
  const changes: Change[] = []
  for (const key of keys) {
    const before = (initial.get(key) ?? []).map(formatValue).join(', ')
    const after = (current.get(key) ?? []).map(formatValue).join(', ')
    if (before !== after) {
      changes.push({ label: labelFor(form, key), from: before, to: after })
    }
  }
  return changes
}

function ChangesList({ changes }: { changes: Change[] }) {
  if (!changes.length) {
    return <p className="text-sm text-muted-foreground">No detectamos cambios en este formulario.</p>
  }

  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto">
      {changes.map((change, index) => (
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
  )
}

// Sección de formulario: bloquea los campos, detecta cambios y, al guardar o
// cancelar, pide confirmación mostrando exactamente qué cambió. Los botones se
// renderizan dentro de la propia card mediante <GuardActions>.
export function EditGuard({ title, children }: { title?: string; children: ReactNode }) {
  const unsaved = useUnsavedChanges()
  const sectionId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const initialRef = useRef<Map<string, string[]> | null>(null)
  const allowSubmitRef = useRef(false)
  const editingRef = useRef(false)
  const [editing, setEditing] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [discardPrompt, setDiscardPrompt] = useState(false)
  const [changes, setChanges] = useState<Change[]>([])

  useEffect(() => {
    editingRef.current = editing
  }, [editing])

  function currentDiff(): Change[] {
    const form = formRef.current
    const initial = initialRef.current
    if (!form || !initial) return []
    return computeChanges(initial, readValues(form), form)
  }

  const getChanges = useCallback((): Change[] => {
    if (!editingRef.current) return []
    const form = formRef.current
    const initial = initialRef.current
    if (!form || !initial) return []
    return computeChanges(initial, readValues(form), form)
  }, [])

  function openConfirmation(form: HTMLFormElement) {
    const current = readValues(form)
    const initial = initialRef.current ?? current
    setChanges(computeChanges(initial, current, form))
    setConfirming(true)
  }

  const discardChanges = useCallback(() => {
    setConfirming(false)
    setDiscardPrompt(false)
    setFormKey((key) => key + 1)
    setEditing(false)
    initialRef.current = null
    allowSubmitRef.current = false
    unsaved?.notify()
  }, [unsaved])

  useEffect(() => {
    const form = containerRef.current?.querySelector('form') ?? null
    formRef.current = form
    if (!form) return

    const handler = (event: Event) => {
      if (allowSubmitRef.current) {
        allowSubmitRef.current = false
        return
      }
      event.preventDefault()
      event.stopPropagation()
      openConfirmation(form)
    }

    form.addEventListener('submit', handler, true)
    return () => form.removeEventListener('submit', handler, true)
  }, [formKey])

  useEffect(() => {
    const form = formRef.current
    if (!form) return
    const handler = () => unsaved?.notify()
    form.addEventListener('input', handler)
    form.addEventListener('change', handler)
    return () => {
      form.removeEventListener('input', handler)
      form.removeEventListener('change', handler)
    }
  }, [unsaved, formKey])

  useEffect(() => {
    if (!unsaved) return
    return unsaved.register({
      id: sectionId,
      title: title ?? 'Sección',
      getChanges,
      save: () => {
        allowSubmitRef.current = true
        formRef.current?.requestSubmit()
      },
      discard: discardChanges,
    })
  }, [unsaved, sectionId, title, getChanges, discardChanges])

  function startEditing() {
    const form = formRef.current
    if (form) initialRef.current = readValues(form)
    setEditing(true)
  }

  function cancelEditing() {
    const diff = currentDiff()
    if (diff.length === 0) {
      setEditing(false)
      initialRef.current = null
      return
    }
    setChanges(diff)
    setDiscardPrompt(true)
  }

  function confirm() {
    allowSubmitRef.current = true
    setConfirming(false)
    formRef.current?.requestSubmit()
    setEditing(false)
  }

  function saveFromDiscard() {
    allowSubmitRef.current = true
    setDiscardPrompt(false)
    formRef.current?.requestSubmit()
    setEditing(false)
  }

  const reportStatus = useCallback(
    (status: { pending: boolean; success: boolean }) => {
      unsaved?.reportStatus(sectionId, status)
    },
    [unsaved, sectionId],
  )

  const value: GuardContextValue = {
    editing,
    startEditing,
    cancelEditing,
    discardChanges,
    saveChanges: saveFromDiscard,
    reportStatus,
  }

  return (
    <GuardContext.Provider value={value}>
      <div ref={containerRef} key={formKey}>
        <fieldset disabled={!editing} className="contents">
          {children}
        </fieldset>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="theme-admin sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5 text-warning-foreground" />
              Confirmar cambios
            </DialogTitle>
            <DialogDescription>
              Revisa lo que se va a modificar. Esta acción quedará registrada en la auditoría de Grassly.
            </DialogDescription>
          </DialogHeader>

          <ChangesList changes={changes} />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={confirm}>
              {changes.length ? 'Sí, guardar cambios' : 'Guardar de todos modos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discardPrompt} onOpenChange={setDiscardPrompt}>
        <DialogContent className="theme-admin sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5 text-warning-foreground" />
              Cambios sin guardar
            </DialogTitle>
            <DialogDescription>
              Si cancelas ahora, perderás estos cambios. Puedes descartarlos o guardarlos.
            </DialogDescription>
          </DialogHeader>

          <ChangesList changes={changes} />

          <DialogFooter className="gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="ghost">Seguir editando</Button>
            </DialogClose>
            <Button type="button" variant="outline" onClick={discardChanges}>
              Descartar cambios
            </Button>
            <Button type="button" onClick={saveFromDiscard}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GuardContext.Provider>
  )
}

// Sección sin formulario único (por ejemplo canchas): solo bloquea y expone el
// estado para que la card muestre su propio botón con <LockToggle>.
export function LockSection({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState(false)

  const value: GuardContextValue = {
    editing,
    startEditing: () => setEditing(true),
    cancelEditing: () => setEditing(false),
    discardChanges: () => setEditing(false),
    saveChanges: () => setEditing(false),
    reportStatus: () => {},
  }

  return (
    <GuardContext.Provider value={value}>
      <fieldset disabled={!editing} className="contents">
        {children}
      </fieldset>
    </GuardContext.Provider>
  )
}

// Reemplaza al botón de guardar de un formulario. Sin guardián (panel de
// dueños) se comporta como el submit normal.
export function GuardActions({
  pending,
  submitLabel,
  state,
}: {
  pending?: boolean
  submitLabel: string
  state?: { success: boolean }
}) {
  const guard = useEditGuard()
  const reportStatus = guard?.reportStatus

  useEffect(() => {
    reportStatus?.({ pending: Boolean(pending), success: Boolean(state?.success) })
  }, [reportStatus, pending, state?.success])

  if (!guard) {
    return (
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />}
        {submitLabel}
      </Button>
    )
  }

  if (!guard.editing) {
    return <LockedEditButton onActivate={guard.startEditing} />
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="ghost" onClick={guard.cancelEditing}>Cancelar</Button>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />}
        {submitLabel}
      </Button>
    </div>
  )
}

// Botón de bloqueo para secciones sin formulario único.
export function LockToggle() {
  const guard = useEditGuard()
  if (!guard) return null

  if (!guard.editing) {
    return <LockedEditButton onActivate={guard.startEditing} size="sm" />
  }

  return (
    <Button type="button" variant="soft" size="sm" onClick={guard.cancelEditing}>
      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
      Listo
    </Button>
  )
}

// Se renderiza como <span role="button"> y no como <button> porque dentro de un
// <fieldset disabled> un botón quedaría deshabilitado y no se podría activar la edición.
function LockedEditButton({
  onActivate,
  size = 'default',
}: {
  onActivate: () => void
  size?: 'default' | 'sm'
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onActivate()
        }
      }}
      className={cn(buttonVariants({ variant: 'outline', size }), 'cursor-pointer')}
    >
      <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
      Editar
    </span>
  )
}
