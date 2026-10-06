'use client'

import { useSyncExternalStore } from 'react'

let entityLabel: string | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return entityLabel
}

function getServerSnapshot() {
  return null
}

export function setEntityBreadcrumb(label: string | null) {
  if (entityLabel === label) return
  entityLabel = label
  for (const listener of listeners) listener()
}

export function useEntityBreadcrumb() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
