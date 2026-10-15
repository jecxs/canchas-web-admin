'use client'

import { useState } from 'react'
import { Download01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { sectionsForTab } from './export-sections'
import type { ReportTab } from './types'

export function ExportMenu({ tab, start, end }: { tab: ReportTab; start: string; end: string }) {
  const sections = sectionsForTab(tab)
  const allIds = sections.map((section) => section.id)
  const [selected, setSelected] = useState<string[]>(allIds)
  const [open, setOpen] = useState(false)

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  const isAll = selected.length === allIds.length
  const params = new URLSearchParams({ tab, start, end })
  if (!isAll) params.set('sections', selected.join(','))
  const href = `/panel/reportes/export?${params.toString()}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="rp-btn">
          <HugeiconsIcon icon={Download01Icon} strokeWidth={2} className="size-4" aria-hidden="true" />
          Exportar
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72! p-3!">
        <p className="mb-2 text-xs font-bold text-muted-foreground">¿Qué quieres exportar?</p>
        <div className="space-y-0.5">
          {sections.map((section) => (
            <label
              key={section.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={selected.includes(section.id)}
                onChange={() => toggle(section.id)}
                className="size-4 accent-primary"
              />
              {section.label}
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
          <button
            type="button"
            onClick={() => setSelected(selected.length === allIds.length ? [] : allIds)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            {selected.length === allIds.length ? 'Quitar todo' : 'Seleccionar todo'}
          </button>
          {selected.length ? (
            <Button asChild size="sm">
              <a href={href} download onClick={() => setOpen(false)}>
                <HugeiconsIcon icon={Download01Icon} strokeWidth={2} className="size-4" aria-hidden="true" />
                Exportar ({selected.length})
              </a>
            </Button>
          ) : (
            <Button size="sm" disabled>
              <HugeiconsIcon icon={Download01Icon} strokeWidth={2} className="size-4" aria-hidden="true" />
              Exportar
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
