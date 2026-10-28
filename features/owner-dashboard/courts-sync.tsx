'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type Court = {
  id: string
  name: string
  active: boolean
}

type CourtsSyncContextValue = {
  courts: Court[]
  activeCourtId: string | null
  paused: boolean
  setPaused: (paused: boolean) => void
}

const CourtsSyncContext = createContext<CourtsSyncContextValue | null>(null)

export function CourtsSyncProvider({
  courts,
  children,
}: {
  courts: Court[]
  children: ReactNode
}) {
  const [activeCourtId, setActiveCourtId] = useState<string | null>(courts[0]?.id ?? null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (courts.length <= 1 || paused) return

    const interval = window.setInterval(() => {
      setActiveCourtId((current) => {
        const currentIndex = courts.findIndex((court) => court.id === current)
        const nextIndex = (currentIndex + 1) % courts.length
        return courts[nextIndex]?.id ?? null
      })
    }, 2000)

    return () => window.clearInterval(interval)
  }, [courts, paused])

  const resolvedActiveCourtId =
    courts.find((court) => court.id === activeCourtId)?.id ?? courts[0]?.id ?? null

  return (
    <CourtsSyncContext.Provider
      value={{ courts, activeCourtId: resolvedActiveCourtId, paused, setPaused }}
    >
      {children}
    </CourtsSyncContext.Provider>
  )
}

export function useCourtsSync() {
  const context = useContext(CourtsSyncContext)
  if (!context) {
    throw new Error('useCourtsSync debe usarse dentro de CourtsSyncProvider.')
  }
  return context
}
