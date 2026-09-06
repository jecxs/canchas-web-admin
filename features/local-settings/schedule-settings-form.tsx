'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { saveScheduleSettingsAction } from './actions'
import { useSettingsFormFeedback } from './form-feedback'
import { initialSettingsActionState, type ScheduleRow } from './types'

const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const hours = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)

export function ScheduleSettingsForm({ localId, schedules }: { localId: string; schedules: ScheduleRow[] }) {
  const [openDays, setOpenDays] = useState<Set<number>>(() => new Set(schedules.map((row) => row.dia_semana)))
  const [state, action, pending] = useActionState(saveScheduleSettingsAction, initialSettingsActionState)
  useSettingsFormFeedback(state)

  function toggle(day: number) {
    setOpenDays((value) => {
      const next = new Set(value)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  return (
    <Card id="horarios" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Horarios de atención</CardTitle>
        <CardDescription>Un rango por día, usando horas completas para conservar la agenda por horas punto.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          <input type="hidden" name="localId" value={localId} />
          <div className="divide-y rounded-2xl border">
            {days.map((label, day) => {
              const schedule = schedules.find((row) => row.dia_semana === day)
              const open = openDays.has(day)
              return (
                <div key={label} className="grid gap-3 p-4 sm:grid-cols-[150px_1fr] sm:items-center">
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                    <input type="checkbox" name="openDay" value={day} checked={open} onChange={() => toggle(day)} className="size-4 accent-primary" />
                    {label}
                  </label>
                  {open ? (
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <select name={`opening_${day}`} defaultValue={schedule?.hora_apertura.slice(0, 5) ?? '07:00'} className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-3 focus:ring-ring/40">
                        {hours.slice(0, -1).map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                      </select>
                      <span className="text-xs text-muted-foreground">a</span>
                      <select name={`closing_${day}`} defaultValue={schedule?.hora_cierre.slice(0, 5) ?? '23:00'} className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-3 focus:ring-ring/40">
                        {hours.slice(1).map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                      </select>
                    </div>
                  ) : <span className="text-sm text-muted-foreground">Cerrado</span>}
                </div>
              )
            })}
          </div>
          <FieldError errors={state.fieldErrors?.schedules?.map((message) => ({ message }))} />
          <Button type="submit" disabled={pending}>{pending && <Spinner />}Guardar horarios</Button>
        </form>
      </CardContent>
    </Card>
  )
}
