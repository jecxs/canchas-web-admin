'use client'

import {
  createContext,
  useContext,
  useEffect,
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

type Change = { label: string; from: string; to: string }

type GuardContextValue = {
  editing: boolean
  startEditing: () => void
  cancelEditing: () => void
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
  if (element instanceof HTMLElement && element.id) {
    const label = form.querySelector(`label[for="${CSS.escape(element.id)}"]`)
    const text = label?.textContent?.trim()
    if (text) return text
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

// Sección de formulario: bloquea los campos y, al guardar, pide confirmación
// mostrando exactamente qué cambió. Los botones se renderizan dentro de la
// propia card mediante <GuardActions>.
export function EditGuard({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const initialRef = useRef<Map<string, string[]> | null>(null)
  const allowSubmitRef = useRef(false)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [changes, setChanges] = useState<Change[]>([])

  function openConfirmation(form: HTMLFormElement) {
    const current = readValues(form)
    const initial = initialRef.current ?? current
    setChanges(computeChanges(initial, current, form))
    setConfirming(true)
  }

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
  }, [])

  function confirm() {
    allowSubmitRef.current = true
    setConfirming(false)
    formRef.current?.requestSubmit()
    setEditing(false)
  }

  const value: GuardContextValue = {
    editing,
    startEditing: () => {
      const form = formRef.current
      if (form) initialRef.current = readValues(form)
      setEditing(true)
    },
    cancelEditing: () => setEditing(false),
  }

  return (
    <GuardContext.Provider value={value}>
      <div ref={containerRef}>
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

          {changes.length ? (
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
          ) : (
            <p className="text-sm text-muted-foreground">No detectamos cambios en este formulario.</p>
          )}

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
export function GuardActions({ pending, submitLabel }: { pending?: boolean; submitLabel: string }) {
  const guard = useEditGuard()

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
