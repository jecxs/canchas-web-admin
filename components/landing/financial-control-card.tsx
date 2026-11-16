'use client'

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AnimatePresence, motion } from 'motion/react'

type ChartDatum = {
  label: string
  amount: number
}

const reports: {
  title: string
  summary: string
  data: ChartDatum[]
}[] = [
  {
    title: 'Ingresos por cancha',
    summary: 'La Cancha Principal lidera los ingresos de ejemplo con S/ 2,650.',
    data: [
      { label: 'Principal', amount: 2650 },
      { label: 'Multiuso', amount: 520 },
      { label: 'Cancha 2', amount: 380 },
    ],
  },
  {
    title: 'Ingresos de la semana',
    summary: 'El sábado registra el mayor ingreso de ejemplo con S/ 1,480.',
    data: [
      { label: 'Lun', amount: 640 },
      { label: 'Mar', amount: 820 },
      { label: 'Mié', amount: 710 },
      { label: 'Jue', amount: 1060 },
      { label: 'Vie', amount: 930 },
      { label: 'Sáb', amount: 1480 },
      { label: 'Dom', amount: 1210 },
    ],
  },
  {
    title: 'Cobros por deporte',
    summary: 'Fútbol concentra S/ 2,180 de los cobros de ejemplo.',
    data: [
      { label: 'Fútbol', amount: 2180 },
      { label: 'Vóley', amount: 940 },
      { label: 'Básquet', amount: 620 },
    ],
  },
]

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(value)

const formatCompact = (value: number) =>
  value >= 1000 ? `S/ ${(value / 1000).toFixed(1)}k` : `S/ ${value}`

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: ChartDatum }>
}) {
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  if (!datum) return null

  return (
    <div className="rounded-xl border border-[#151c16]/10 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs text-[#58635a]">{datum.label}</p>
      <p className="mt-1 text-sm font-bold text-[#151c16]">{formatMoney(datum.amount)}</p>
    </div>
  )
}

export function FinancialControlPreview({ autoRotate = true }: { autoRotate?: boolean }) {
  const [activeReport, setActiveReport] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const report = reports[activeReport]
  const total = report.data.reduce((sum, datum) => sum + datum.amount, 0)

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotionPreference = () => setPrefersReducedMotion(motionPreference.matches)

    syncMotionPreference()
    motionPreference.addEventListener('change', syncMotionPreference)
    return () => motionPreference.removeEventListener('change', syncMotionPreference)
  }, [])

  useEffect(() => {
    if (!autoRotate || isPaused || isInteracting || prefersReducedMotion) return

    const intervalId = window.setInterval(() => {
      setActiveReport((current) => (current + 1) % reports.length)
    }, 1500)

    return () => window.clearInterval(intervalId)
  }, [autoRotate, isPaused, isInteracting, prefersReducedMotion])

  return (
    <div className="min-h-[290px] bg-[#f8faf5] p-3 text-[#151c16] sm:min-h-[350px] sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#58635a]">Resumen de ingresos</p>
          <p className="mt-1 font-display text-2xl font-black tracking-[-.04em] sm:text-3xl">{formatMoney(total)}</p>
          <p className="mt-1 text-xs text-[#58635a]">Datos ilustrativos · esta semana</p>
        </div>
        {prefersReducedMotion ? (
          <span className="rounded-full bg-[#151c16]/5 px-3 py-2 text-xs font-semibold text-[#58635a]">
            Rotación pausada
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsPaused((current) => !current)}
            aria-pressed={isPaused}
            className="min-h-10 rounded-full border border-[#151c16]/20 px-3 text-xs font-bold text-[#151c16] transition hover:bg-[#151c16] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151c16] focus-visible:ring-offset-2"
          >
            {isPaused ? 'Reanudar' : 'Pausar'}
          </button>
        )}
      </div>

      <div
        className="mt-3 rounded-2xl border border-[#151c16]/10 bg-white p-2.5 sm:p-3"
        role="group"
        aria-label={`${report.title}. ${report.summary} Datos ficticios.`}
        tabIndex={0}
        onMouseEnter={() => setIsInteracting(true)}
        onMouseLeave={() => setIsInteracting(false)}
        onFocus={() => setIsInteracting(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsInteracting(false)
          }
        }}
      >
        <div className="mb-1 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold sm:text-base">{report.title}</h3>
          <span className="rounded-full bg-[#D7FF38]/45 px-2.5 py-1 text-[10px] font-bold text-[#151c16] sm:text-xs">
            {activeReport + 1} / {reports.length}
          </span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={report.title}
            className="h-[165px] w-full sm:h-[205px]"
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -16 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            role="img"
            aria-label={`${report.title}: ${report.summary}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={report.data}
                barCategoryGap="28%"
                margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="#dfe5d8" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={0}
                  tick={{ fill: '#58635a', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={58}
                  tickFormatter={formatCompact}
                  tick={{ fill: '#58635a', fontSize: 10 }}
                />
                <Tooltip cursor={{ fill: 'rgba(21, 28, 22, 0.05)' }} content={<ChartTooltip />} />
                <Bar dataKey="amount" name="Ingresos" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {report.data.map((datum, index) => (
                    <Cell key={datum.label} fill={index === 0 ? '#D7FF38' : '#A8D725'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
        <p className="sr-only">{report.summary} Datos ficticios.</p>
      </div>
    </div>
  )
}
