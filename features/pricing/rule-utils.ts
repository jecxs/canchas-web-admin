import type { PricingRule, PricingRuleType } from './types'

export const pricingDays = [
  { value: 0, short: 'Dom', label: 'Domingo' },
  { value: 1, short: 'Lun', label: 'Lunes' },
  { value: 2, short: 'Mar', label: 'Martes' },
  { value: 3, short: 'Mié', label: 'Miércoles' },
  { value: 4, short: 'Jue', label: 'Jueves' },
  { value: 5, short: 'Vie', label: 'Viernes' },
  { value: 6, short: 'Sáb', label: 'Sábado' },
] as const

export function targetKey(target: { courtId: string; sportId: string }) {
  return `${target.courtId}:${target.sportId}`
}

export function hourNumber(value: string) {
  return Number(value.slice(0, 2))
}

export function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 }).format(value)
}

export function formatRuleDays(days: number[]) {
  const sorted = [...days].sort((a, b) => a - b)
  if (sorted.length === 7) return 'Todos los días'
  if (sorted.join(',') === '1,2,3,4,5') return 'Lun–Vie'
  return sorted.map((day) => pricingDays.find((item) => item.value === day)?.short).filter(Boolean).join(', ')
}

type ConflictCandidate = {
  id?: string | null
  type: PricingRuleType
  days: number[]
  startTime: string
  endTime: string
  startDate: string | null
  endDate: string | null
  targets: { courtId: string; sportId: string }[]
  active: boolean
}

export function findPricingConflicts(candidate: ConflictCandidate, rules: PricingRule[]) {
  if (!candidate.active) return []
  const candidateTargets = new Set(candidate.targets.map(targetKey))
  return rules.filter((rule) => {
    if (!rule.active || rule.id === candidate.id || rule.type !== candidate.type) return false
    if (!rule.days.some((day) => candidate.days.includes(day))) return false
    if (!(rule.startTime < candidate.endTime && candidate.startTime < rule.endTime)) return false
    if (!rule.targets.some((target) => candidateTargets.has(targetKey(target)))) return false
    if (candidate.type === 'recurrente') return true
    return Boolean(
      candidate.startDate && candidate.endDate && rule.startDate && rule.endDate
      && rule.startDate <= candidate.endDate && candidate.startDate <= rule.endDate,
    )
  })
}
