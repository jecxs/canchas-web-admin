'use client'

import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ReportTab } from './types'

const TABS: Array<{ value: ReportTab; label: string }> = [
  { value: 'financiero', label: 'Financiero' },
  { value: 'operativo', label: 'Operativo' },
  { value: 'auditoria', label: 'Auditoría' },
]

export function ReportesTabs({
  activeTab,
  start,
  end,
}: {
  activeTab: ReportTab
  start: string
  end: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  function select(tab: ReportTab) {
    if (tab === activeTab) return
    const params = new URLSearchParams({ start, end })
    if (tab !== 'financiero') params.set('tab', tab)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="mt-6 inline-flex items-center gap-1 self-start rounded-2xl border border-border/80 bg-card p-1.5 shadow-sm">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => select(tab.value)}
          aria-pressed={activeTab === tab.value}
          className={cn(
            'rounded-xl px-5 py-2 text-sm font-bold transition-colors',
            activeTab === tab.value
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
