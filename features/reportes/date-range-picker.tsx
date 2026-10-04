'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { DateRange } from 'react-day-picker'
import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatRangeLabel, shiftDate, startOfMonth } from './date-utils'
import type { ReportTab } from './types'

function toIso(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromIso(value: string) {
  return new Date(`${value}T12:00:00`)
}

type Preset = { label: string; range: { start: string; end: string } }

function buildPresets(today: string): Preset[] {
  const firstOfMonth = startOfMonth(today)
  const lastMonthEnd = shiftDate(firstOfMonth, -1)
  return [
    { label: 'Hoy', range: { start: today, end: today } },
    { label: 'Últimos 7 días', range: { start: shiftDate(today, -6), end: today } },
    { label: 'Este mes', range: { start: firstOfMonth, end: today } },
    { label: 'Mes pasado', range: { start: startOfMonth(lastMonthEnd), end: lastMonthEnd } },
    { label: 'Este año', range: { start: `${today.slice(0, 4)}-01-01`, end: today } },
  ]
}

export function DateRangePicker({
  start,
  end,
  today,
  tab,
}: {
  start: string
  end: string
  today: string
  tab?: ReportTab
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>({
    from: fromIso(start),
    to: fromIso(end),
  })
  const presets = buildPresets(today)

  function commit(next: DateRange | undefined) {
    if (!next?.from || !next?.to) return
    const search = new URLSearchParams({ start: toIso(next.from), end: toIso(next.to) })
    if (tab && tab !== 'financiero') search.set('tab', tab)
    setOpen(false)
    router.replace(`${pathname}?${search.toString()}`)
  }

  function applyPreset(preset: Preset) {
    const next = { from: fromIso(preset.range.start), to: fromIso(preset.range.end) }
    setRange(next)
    commit(next)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-11 justify-start gap-2 rounded-xl px-3.5 font-semibold"
        >
          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
          <span className="truncate">{formatRangeLabel(start, end)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto! max-w-[calc(100vw-1.5rem)] overflow-x-auto p-0!">
        <div className="flex flex-col md:flex-row">
          <div className="flex flex-row gap-1 overflow-x-auto border-b p-3 [scrollbar-width:none] md:min-w-44 md:flex-col md:overflow-visible md:border-r md:border-b-0">
            {presets.map((preset) => {
              const active = preset.range.start === start && preset.range.end === end
              return (
                <Button
                  key={preset.label}
                  type="button"
                  size="sm"
                  variant={active ? 'default' : 'ghost'}
                  className="justify-start whitespace-nowrap"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </Button>
              )
            })}
          </div>
          <Calendar
            mode="range"
            selected={range}
            onSelect={(next) => {
              setRange(next)
              if (next?.from && next?.to) commit(next)
            }}
            numberOfMonths={2}
            defaultMonth={range?.from}
            className="bg-transparent!"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
