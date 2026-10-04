import type { AgendaCourt, AgendaSport } from './types'

/**
 * The agenda filter is scoped to sports currently offered by the owner's
 * active courts. It must never expose the platform-wide sport catalog.
 */
export function getLocalAgendaSports(courts: Pick<AgendaCourt, 'sports'>[]): AgendaSport[] {
  const sports = new Map<string, AgendaSport>()

  for (const court of courts) {
    for (const sport of court.sports) {
      sports.set(sport.id, sport)
    }
  }

  return Array.from(sports.values()).sort((left, right) => left.name.localeCompare(right.name, 'es'))
}

/**
 * Query parameters are untrusted input. An invalid or stale sport filter is
 * treated as "all sports" instead of being forwarded to board RPCs.
 */
export function normalizeAgendaSportId(sportId: string | undefined, sports: AgendaSport[]): string {
  return sportId && sports.some((sport) => sport.id === sportId) ? sportId : ''
}
