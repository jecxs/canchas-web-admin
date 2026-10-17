'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Home01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Paleta "día de partido": césped iluminado, cal (yeso), tinta y lima de marca.
const C = {
  turfHi: '#37AC55',
  turf: '#2E9B49',
  turfLo: '#268A3E',
  cal: '#F4FAEC',
  tinta: '#0D1B0E',
  lima: '#C9F42D',
  senal: '#E32729',
} as const

// Zona de tiro (normalizada 0..1 sobre la cancha): interior del arco.
const TARGET = { xMin: 0.16, xMax: 0.84, yTop: 0.16, yBottom: 0.46 } as const
// Punto de penal donde descansa el balón.
const BALL_REST = { x: 0.5, y: 0.85 } as const
// Patrullaje del arquero a lo largo de la línea de gol.
const KEEPER = { min: 0.22, max: 0.78, sweepMs: 2400 } as const
// Dificultad progresiva: cada gol reduce el tiempo de barrido del arquero (va más rápido), con tope.
const KEEPER_SWEEP_STEP = 130
const KEEPER_SWEEP_MIN = 1100
const FLIGHT_MS = 720
const RESET_MS = 1500
const DIVE_MS = 400
const MAX_DIVE = 0.17
const HIT_RANGE = 0.055
const MIN_POWER = 0.14
const MAX_POWER_PX = 190
const BEST_KEY = 'grassly:penales:record'

type Aim = { x: number; y: number; power: number }

// Red que vibra al entrar el gol (único movimiento no provocado por el usuario).
const GAME_CSS = `
@keyframes gs-netwave { 0% { transform: translateY(0) scale(1) } 25% { transform: translateY(5px) scale(1.07) } 55% { transform: translateY(-3px) scale(.96) } 80% { transform: translateY(1px) scale(1.02) } 100% { transform: translateY(0) scale(1) } }
.gs-net-wave { animation: gs-netwave .8s ease-out; transform-box: border-box; transform-origin: center; }

.gs-mesh {
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='8'%20height='8'%3E%3Cpath%20d='M0%200L8%208M8%200L0%208'%20fill='none'%20stroke='%23ffffff'%20stroke-opacity='0.42'%20stroke-width='1'/%3E%3C/svg%3E");
  background-size: 8px 8px;
}

@media (prefers-reduced-motion: reduce) {
  .gs-net-wave { animation: none; }
}
`

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

// Pseudo-aleatorio determinista (puro).
function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return value - Math.floor(value)
}

// Acepta SOLO rutas internas. Evita open redirects (http:, //host, javascript:,
// /\host, etc.). Si no es una ruta interna válida, cae al inicio seguro.
function safeInternalHref(href: string): string {
  if (typeof href !== 'string') return '/'
  const value = href.trim()
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  if (/[\s:]/.test(value)) return '/'
  return value
}

// Tablero de marcador: el elemento memorable del juego.
function Scoreboard({
  left,
  right,
}: {
  left: { label: string; value: number }
  right: { label: string; value: number }
}) {
  const label = 'text-[10px] font-semibold'
  const labelColor = { color: 'rgba(244,250,236,.6)' }
  return (
    <div style={{ background: C.tinta, color: C.cal, borderBottom: `3px solid ${C.lima}` }}>
      <div className="flex items-center gap-2 px-3 py-1.5" style={{ borderBottom: '1px solid rgba(244,250,236,.14)' }}>
        <span className={label} style={labelColor}>
          Cancha 404
        </span>
      </div>
      <div className="grid grid-cols-2">
        <div className="px-3 py-2">
          <p className={label} style={labelColor}>
            {left.label}
          </p>
          <p className="font-display text-4xl leading-none font-bold tabular-nums" style={{ color: C.lima }}>
            {left.value}
          </p>
        </div>
        <div className="px-3 py-2" style={{ borderLeft: '1px solid rgba(244,250,236,.14)' }}>
          <p className={label} style={labelColor}>
            {right.label}
          </p>
          <p className="font-display text-4xl leading-none font-bold tabular-nums">{right.value}</p>
        </div>
      </div>
    </div>
  )
}

// Balón clásico blanco y negro, dibujado con tinta.
function BallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill={C.cal} stroke={C.tinta} strokeWidth="3" />
      <polygon points="50,33 66.2,44.8 60,63.8 40,63.8 33.8,44.8" fill={C.tinta} />
      <g stroke={C.tinta} strokeWidth="3" strokeLinecap="round">
        <line x1="50" y1="33" x2="50" y2="4" />
        <line x1="66.2" y1="44.8" x2="94" y2="36" />
        <line x1="60" y1="63.8" x2="77.6" y2="88" />
        <line x1="40" y1="63.8" x2="22.4" y2="88" />
        <line x1="33.8" y1="44.8" x2="6" y2="36" />
      </g>
    </svg>
  )
}

// Césped: franjas de corte HORIZONTALES con perspectiva (como una cancha real).
// `stripesStart` (0..1): desde dónde hacia abajo se pintan las franjas; arriba queda césped liso.
function PitchFloor({ stripesStart = 0 }: { stripesStart?: number }) {
  const count = 14
  const start = clamp(stripesStart, 0, 1) * 100
  const span = 100 - start
  const bands = Array.from({ length: count }, (_, index) => {
    const t0 = index / count
    const t1 = (index + 1) / count
    const y0 = start + span * t0 * t0
    const y1 = start + span * t1 * t1
    return { id: index, y: y0, height: y1 - y0, light: index % 2 === 0 }
  })
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <rect width="100" height="100" fill={C.turf} />
      {bands.map((band) => (
        <rect key={band.id} x="0" y={band.y} width="100" height={band.height} fill={band.light ? C.turfHi : C.turf} />
      ))}
    </svg>
  )
}



// Confeti de papel.
const PIXEL_COLORS = [C.lima, C.cal, '#ffffff', C.lima, C.cal, C.lima]

function PixelConfetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, index) => ({
        id: index,
        color: PIXEL_COLORS[index % PIXEL_COLORS.length],
        x: (seededUnit(index + 1) - 0.5) * 380,
        drift: (seededUnit(index + 200) - 0.5) * 140,
        y: 90 + seededUnit(index + 91) * 320,
        rotate: seededUnit(index + 53) * 900 - 450,
        delay: seededUnit(index + 17) * 0.14,
        width: 4 + seededUnit(index + 131) * 4,
        height: 9 + seededUnit(index + 77) * 9,
      })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-[55] overflow-hidden">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute left-1/2 top-[28%] block rounded-[1px]"
          style={{ width: piece.width, height: piece.height, background: piece.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: piece.x + piece.drift, y: piece.y, opacity: 0, rotate: piece.rotate }}
          transition={{ duration: 1.25, ease: 'easeOut', delay: piece.delay }}
        />
      ))}
    </div>
  )
}

// Chispas de impacto (cal y lima).
function Sparks({ x, y }: { x: number; y: number }) {
  const rays = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        angle: (i / 14) * Math.PI * 2,
        dist: 26 + seededUnit(i + 3) * 34,
        size: 3 + seededUnit(i + 9) * 4,
        color: i % 3 === 0 ? C.lima : C.cal,
      })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-[56]">
      <div className="absolute" style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
        <motion.span
          className="absolute block size-6 rounded-full"
          style={{ x: '-50%', y: '-50%', border: `2px solid ${C.lima}` }}
          initial={{ scale: 0.2, opacity: 1 }}
          animate={{ scale: 4.2, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {rays.map((ray) => (
          <motion.span
            key={ray.id}
            className="absolute block"
            style={{ width: ray.size, height: ray.size, background: ray.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(ray.angle) * ray.dist, y: Math.sin(ray.angle) * ray.dist, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </div>
    </div>
  )
}

export function NotFoundGame({ homeHref = '/' }: { homeHref?: string }) {
  const reduceMotion = useReducedMotion() ?? false
  const safeHome = safeInternalHref(homeHref)

  const [phase, setPhase] = useState<'ready' | 'aiming' | 'flying' | 'result'>('ready')
  const [aim, setAim] = useState<Aim | null>(null)
  const [outcome, setOutcome] = useState<'goal' | 'save' | null>(null)
  const [impact, setImpact] = useState<{ x: number; y: number } | null>(null)
  const [streak, setStreak] = useState(0)
  const [scored, setScored] = useState(0)
  const [best, setBest] = useState(0)
  const [celebrate, setCelebrate] = useState(false)

  const ballX = useMotionValue<number>(BALL_REST.x)
  const ballY = useMotionValue<number>(BALL_REST.y)
  const ballScale = useMotionValue<number>(1)
  const ballRotate = useMotionValue<number>(0)
  const keeperBase = useMotionValue<number>(0.5)
  const keeperDive = useMotionValue<number>(0)
  const keeperStretch = useMotionValue<number>(1)

  const ballLeft = useTransform(ballX, (value) => `${value * 100}%`)
  const ballTop = useTransform(ballY, (value) => `${value * 100}%`)
  // Posición real del portero = patrulla + lanzamiento (hitbox alineado).
  const keeperLeft = useTransform(() => `${(keeperBase.get() + keeperDive.get()) * 100}%`)
  const keeperTilt = useTransform(ballX, (value) => clamp((value - BALL_REST.x) * 26, -10, 10))
  // La sombra del balón se encoge y se desvanece cuando el balón vuela (se aleja/eleva).
  const ballShadowOpacity = useTransform(ballScale, (value) => clamp((value - 0.42) / 0.58, 0, 1) * 0.5)
  const ballShadowScale = useTransform(ballScale, (value) => 0.45 + clamp((value - 0.42) / 0.58, 0, 1) * 0.55)

  const phaseRef = useRef(phase)
  const aimRef = useRef<Aim | null>(null)
  const streakRef = useRef(0)
  const bestRef = useRef(0)
  const lastTargetRef = useRef<Aim | null>(null)
  const clockRef = useRef(0)
  const sweepMsRef = useRef<number>(KEEPER.sweepMs)
  const divingRef = useRef(false)
  const fieldRef = useRef<HTMLDivElement | null>(null)
  const resetTimerRef = useRef<number | null>(null)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // Dificultad: a más goles, menor tiempo de barrido (el arquero patrulla más rápido), con tope.
  useEffect(() => {
    sweepMsRef.current = Math.max(KEEPER_SWEEP_MIN, KEEPER.sweepMs - scored * KEEPER_SWEEP_STEP)
  }, [scored])

  // Récord persistente (localStorage).
  useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem(BEST_KEY))
      if (Number.isFinite(stored) && stored > 0) {
        // Lectura única de un store externo al montar.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBest(stored)
        bestRef.current = stored
      }
    } catch {
      /* almacenamiento no disponible */
    }
  }, [])

  useEffect(
    () => () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current)
    },
    [],
  )

  // Patrullaje continuo (se congela durante el lanzamiento).
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      if (!divingRef.current) {
        clockRef.current = (clockRef.current + dt / sweepMsRef.current) % 1
        const t = clockRef.current
        const triangle = t < 0.5 ? t * 2 : 2 - t * 2
        keeperBase.set(KEEPER.min + triangle * (KEEPER.max - KEEPER.min))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [keeperBase])

  const updateAim = useCallback((clientX: number, clientY: number) => {
    const field = fieldRef.current
    if (!field) return
    const rect = field.getBoundingClientRect()
    const pointerX = (clientX - rect.left) / rect.width
    const pointerY = (clientY - rect.top) / rect.height
    const target: Aim = {
      x: clamp(pointerX, TARGET.xMin, TARGET.xMax),
      y: clamp(pointerY, TARGET.yTop, TARGET.yBottom),
      power: clamp(
        Math.hypot(clientX - (BALL_REST.x * rect.width + rect.left), clientY - (BALL_REST.y * rect.height + rect.top)) /
          MAX_POWER_PX,
        0,
        1,
      ),
    }
    aimRef.current = target
    setAim(target)
  }, [])

  const reset = useCallback(() => {
    setCelebrate(false)
    setOutcome(null)
    setImpact(null)
    setAim(null)
    aimRef.current = null
    lastTargetRef.current = null
    const duration = reduceMotion ? 0.2 : 0.45
    animate(ballX, BALL_REST.x, { duration, ease: 'easeOut' })
    animate(ballY, BALL_REST.y, { duration, ease: 'easeOut' })
    animate(ballScale, 1, { duration, ease: 'easeOut' })
    animate(ballRotate, 0, { duration, ease: 'easeOut' })
    // Vuelve a su posición de patrulla.
    animate(keeperDive, 0, { duration: 0.35, ease: 'easeOut', onComplete: () => { divingRef.current = false } })
    animate(keeperStretch, 1, { duration: 0.3, ease: 'easeOut' })
    setPhase('ready')
  }, [ballRotate, ballScale, ballX, ballY, keeperDive, keeperStretch, reduceMotion])

  const onArrive = useCallback(() => {
    const target = lastTargetRef.current
    if (!target) return
    const keeperNow = keeperBase.get() + keeperDive.get()
    const saved = Math.abs(target.x - keeperNow) < HIT_RANGE
    setPhase('result')

    if (saved) {
      setOutcome('save')
      setImpact({ x: target.x, y: target.y })
      setStreak(0)
      streakRef.current = 0
      animate(ballScale, [0.42, 0.6, 0.42], { duration: 0.36, ease: 'easeOut' })
      animate(ballRotate, ballRotate.get() - 60, { duration: 0.36, ease: 'easeOut' })
    } else {
      setOutcome('goal')
      setCelebrate(true)
      setScored((value) => value + 1)
      const next = streakRef.current + 1
      setStreak(next)
      streakRef.current = next
      if (next > bestRef.current) {
        setBest(next)
        bestRef.current = next
        try {
          window.localStorage.setItem(BEST_KEY, String(next))
        } catch {
          /* almacenamiento no disponible */
        }
      }
    }

    resetTimerRef.current = window.setTimeout(reset, RESET_MS)
  }, [ballRotate, ballScale, keeperBase, keeperDive, reset])

  const shoot = useCallback(
    (target: Aim) => {
      lastTargetRef.current = target
      setPhase('flying')
      setAim(null)
      aimRef.current = null
      const duration = reduceMotion ? 0.25 : FLIGHT_MS / 1000

      // El portero se lanza hacia la trayectoria estimada (alcance limitado).
      const from = keeperBase.get()
      const diveDelta = clamp(target.x - from, -MAX_DIVE, MAX_DIVE)
      divingRef.current = true
      animate(keeperDive, diveDelta, { duration: reduceMotion ? 0.15 : DIVE_MS / 1000, ease: 'easeOut' })
      animate(keeperStretch, [1, 1.18, 1], { duration: 0.5, ease: 'easeOut' })

      animate(ballX, target.x, { duration, ease: 'easeOut' })
      animate(ballY, target.y, { duration, ease: 'easeOut' })
      animate(ballScale, reduceMotion ? 0.85 : 0.42, { duration, ease: 'easeOut' })
      animate(ballRotate, reduceMotion ? 120 : 720, { duration, ease: 'easeOut', onComplete: onArrive })
    },
    [ballRotate, ballScale, ballX, ballY, keeperBase, keeperDive, keeperStretch, onArrive, reduceMotion],
  )

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== 'ready') return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setPhase('aiming')
    updateAim(event.clientX, event.clientY)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== 'aiming') return
    updateAim(event.clientX, event.clientY)
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== 'aiming') return
    updateAim(event.clientX, event.clientY)
    const current = aimRef.current
    if (!current || current.power < MIN_POWER) {
      setAim(null)
      aimRef.current = null
      setPhase('ready')
      return
    }
    shoot(current)
  }

  const onPointerCancel = () => {
    if (phaseRef.current !== 'aiming') return
    setAim(null)
    aimRef.current = null
    setPhase('ready')
  }

  const frameGlow = outcome === 'goal' ? C.lima : outcome === 'save' ? C.senal : 'rgba(244,250,236,.5)'

  const outcomeText =
    outcome === 'goal'
      ? { title: '¡Gol!', sub: 'Racha +1', color: C.lima }
      : { title: '¡Atajada!', sub: 'Racha a cero', color: C.senal }

  return (
    <main className="fixed inset-0 z-[80] overflow-y-auto bg-background">
      <style>{GAME_CSS}</style>
      <div className="relative flex min-h-full items-center justify-center px-5 py-10">
        <div className="relative z-10 grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.35fr] lg:items-center">
          <section className="text-center lg:text-left">
            <h1 className="font-display text-6xl leading-[0.9] font-bold uppercase tracking-[-.01em] sm:text-7xl">
              ¡Mandaste la pelota <span className="text-primary">afuera</span>!
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground lg:mx-0">
              Esa página no está en la cancha. Mientras vuelves, tírate una tanda de penales.
            </p>
            <div className="mt-7 flex justify-center lg:justify-start">
              <Button asChild size="lg">
                <Link href={safeHome}>
                  <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
                  Volver al inicio
                </Link>
              </Button>
            </div>
          </section>

          <section className="relative">
            <Scoreboard left={{ label: 'Racha', value: streak }} right={{ label: 'Récord', value: best }} />

            <div
              ref={fieldRef}
              className="relative aspect-[5/4] w-full touch-none select-none overflow-hidden"
              style={{ background: `linear-gradient(180deg, ${C.turfHi} 0%, ${C.turf} 52%, ${C.turfLo} 100%)` }}
              aria-label="Penales: arrastra desde el balón hacia el arco y suelta para patear"
            >
              {/* Césped en perspectiva de fuga */}
              <PitchFloor stripesStart={0.54} />
              {/* Luz de reflector */}
              <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 44% at 50% 24%, rgba(255,255,255,.18), transparent 70%)' }} />
              {/* Marco de cancha: línea de cal en lugar de "card" redondeada con sombra */}
              <div className="pointer-events-none absolute inset-[2.5%] border-2" style={{ borderColor: 'rgba(243,248,234,.72)' }} />

              {/* Línea de meta (ancho completo) */}
                  <div className="pointer-events-none absolute inset-x-[2.5%] top-[54%] h-[4px] -translate-y-1/2" style={{ background: 'rgba(244,250,236,.92)' }} />
                  {/* Área de penal + arco + punto de penal */}
                  <div className="pointer-events-none absolute inset-x-[8%] top-[74%] h-[2px]" style={{ background: 'rgba(244,250,236,.5)' }} />
                  <div
                    className="pointer-events-none absolute left-1/2 top-[74%] h-[11%] w-[34%] -translate-x-1/2 rounded-b-full border-x-2 border-b-2"
                    style={{ borderColor: 'rgba(244,250,236,.5)' }}
                  />
                  <div className="pointer-events-none absolute left-1/2 top-[85%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'rgba(244,250,236,.9)' }} />
                  {/* Sombra de contacto del balón (se disipa al volar) */}
                  <motion.div
                    style={{ x: '-50%', y: '-50%', opacity: ballShadowOpacity, scaleX: ballShadowScale, background: 'rgba(13,27,14,.4)' }}
                    className="pointer-events-none absolute left-1/2 top-[90%] h-3 w-14 rounded-[50%] blur-md"
                  />

                  {/* Arco 3D (cal) */}
                  <div className="absolute left-[8%] right-[8%] top-[10%] h-[44%]">
                    <div className={cn('absolute inset-0', outcome === 'goal' && 'gs-net-wave')}>
                      <div className="gs-mesh absolute left-[16%] right-[16%] top-[14%] bottom-[24%] bg-[rgba(13,27,14,.22)]" />
                      <div className="gs-mesh absolute inset-y-0 left-0 w-[16%] bg-[rgba(13,27,14,.14)]" style={{ clipPath: 'polygon(0 0, 100% 14%, 100% 76%, 0 100%)' }} />
                      <div className="gs-mesh absolute inset-y-0 right-0 w-[16%] bg-[rgba(13,27,14,.14)]" style={{ clipPath: 'polygon(100% 0, 0 14%, 0 76%, 100% 100%)' }} />
                      <div className="gs-mesh absolute inset-x-0 top-0 h-[14%] bg-[rgba(13,27,14,.18)]" style={{ clipPath: 'polygon(0 0, 100% 0, 84% 100%, 16% 100%)' }} />
                      <div className="absolute left-[16%] right-[16%] top-[14%] bottom-[24%] border border-white/35" />
                    </div>
                    <div className="absolute inset-0 rounded-t-lg border-[3px] border-b-0 border-white" style={{ boxShadow: `0 0 16px ${frameGlow}` }} />
                  </div>

                  {/* Sombra de contacto que sigue al portero */}
                  <motion.div
                    style={{ left: keeperLeft, x: '-50%', bottom: '43%', background: 'radial-gradient(50% 50% at 50% 50%, rgba(13,27,14,.3), transparent 70%)' }}
                    className="pointer-events-none absolute z-[15] h-6 w-32 rounded-full blur-[6px]"
                  />

                  {/* Arquero: Grassy, el loro (imagen real de marca) */}
                  <motion.div style={{ left: keeperLeft, x: '-50%', bottom: '46%' }} className="absolute z-20 h-44 w-40 will-change-[left] sm:h-64 sm:w-60">
                    <motion.div style={{ rotate: keeperTilt, scaleX: keeperStretch, y: '17.5%' }} className="relative h-full w-full">
                      <Image
                        src="/mascota/grassy.png"
                        alt=""
                        fill
                        loading="eager"
                        sizes="(min-width: 640px) 13rem, 9rem"
                        className={cn(
                          'object-contain drop-shadow-[0_10px_10px_rgba(13,27,14,0.35)]',
                          outcome === 'save' && 'opacity-0',
                        )}
                      />
                      <Image
                        src="/mascota/grassyBalon.png"
                        alt=""
                        fill
                        loading="eager"
                        sizes="(min-width: 640px) 13rem, 9rem"
                        className={cn(
                          'object-contain drop-shadow-[0_10px_10px_rgba(13,27,14,0.35)]',
                          outcome !== 'save' && 'opacity-0',
                        )}
                      />
                      {outcome === 'save' && (
                        <span className="pointer-events-none absolute inset-[-12%] rounded-full border-2 border-primary/70" />
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Trayectoria (línea de cal) + mira */}
                  {aim && (
                    <>
                      <svg className="pointer-events-none absolute inset-0 z-[25] h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                        <line
                          x1={BALL_REST.x * 100}
                          y1={BALL_REST.y * 100}
                          x2={aim.x * 100}
                          y2={aim.y * 100}
                          stroke={C.lima}
                          strokeWidth={2 + aim.power * 2}
                          strokeLinecap="round"
                          strokeDasharray="1.5 7"
                          vectorEffect="non-scaling-stroke"
                          opacity={0.5 + aim.power * 0.45}
                        />
                      </svg>
                      <span
                        className="pointer-events-none absolute z-[26] grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                        style={{
                          left: `${aim.x * 100}%`,
                          top: `${aim.y * 100}%`,
                          width: 26 + aim.power * 16,
                          height: 26 + aim.power * 16,
                          border: `2px solid ${C.lima}`,
                          opacity: 0.55 + aim.power * 0.45,
                        }}
                      >
                        <span className="size-1.5 rounded-full" style={{ background: C.lima }} />
                      </span>
                    </>
                  )}

                  {/* Balón */}
                  <motion.div
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerCancel}
                    onLostPointerCapture={onPointerCancel}
                    style={{ left: ballLeft, top: ballTop, x: '-50%', y: '-50%', scale: ballScale, rotate: ballRotate, filter: 'drop-shadow(0 6px 8px rgba(13,27,14,.35))' }}
                    className={cn('absolute z-30 size-11 cursor-grab touch-none active:cursor-grabbing sm:size-12', outcome === 'save' && 'opacity-0')}
                  >
                    <BallIcon className="h-full w-full" />
                  </motion.div>

                  {/* Desenlace */}
                  {outcome && (
                    <motion.div
                      style={{ x: '-50%', y: '-50%', background: 'rgba(13,27,14,.86)' }}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                      className="pointer-events-none absolute left-1/2 top-[30%] z-[57] rounded-md px-4 py-1.5 text-center"
                    >
                      <p className="font-display text-3xl leading-none font-bold uppercase sm:text-4xl" style={{ color: outcomeText.color }}>
                        {outcomeText.title}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold" style={{ color: 'rgba(244,250,236,.75)' }}>
                        {outcomeText.sub}
                      </p>
                    </motion.div>
                  )}

                  {celebrate && <PixelConfetti />}
                  {impact && <Sparks x={impact.x} y={impact.y} />}

            </div>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Arrastra desde el balón y suelta para patear.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
