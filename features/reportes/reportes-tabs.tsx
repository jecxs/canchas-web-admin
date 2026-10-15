'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()

  return (
    <nav className="rp-tabs" aria-label="Secciones de reportes">
      {TABS.map((tab) => {
        const params = new URLSearchParams({ start, end })
        if (tab.value !== 'financiero') params.set('tab', tab.value)
        const active = activeTab === tab.value
        return (
          <Link
            key={tab.value}
            href={`${pathname}?${params.toString()}`}
            className="rp-tab"
            aria-current={active ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
