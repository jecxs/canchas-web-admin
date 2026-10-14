'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Home01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Paleta cyber-arcade.
const C = {
  grass: '#0a1f0c',
  green: '#10b981',
  greenBright: '#34f5a0',
  cyan: '#22d3ee',
  violet: '#a855f7',
  blue: '#3b82f6',
  gold: '#fbbf24',
  rose: '#fb7185',
  steel: '#94a3b8',
  ink: '#060f16',
} as const

// Zona de tiro (normalizada 0..1 sobre la cancha): interior del arco.
const TARGET = { xMin: 0.16, xMax: 0.84, yTop: 0.16, yBottom: 0.46 } as const
// Punto de penal donde descansa el balón.
const BALL_REST = { x: 0.5, y: 0.85 } as const
// Patrullaje del arquero a lo largo de la línea de gol.
const KEEPER = { min: 0.22, max: 0.78, sweepMs: 2400 } as const
const FLIGHT_MS = 720
const RESET_MS = 1500
const DIVE_MS = 400
const MAX_DIVE = 0.17
const HIT_RANGE = 0.055
const MIN_POWER = 0.14
const MAX_POWER_PX = 190
const BEST_KEY = 'grassly:penales:record'

type Aim = { x: number; y: number; power: number }

// Efectos CSS nativos (LED, flicker, dash, red, glow).
const GAME_CSS = `
@keyframes ck-led { 0%, 100% { opacity: .45 } 50% { opacity: 1 } }
.gs-led { animation: ck-led 1.5s ease-in-out infinite; }

@keyframes ck-flicker { 0%,19%,21%,23%,25%,54%,56%,100% { opacity: 1 } 20%,22%,24%,55% { opacity: .35 } }
.gs-flicker { animation: ck-flicker 3.2s linear infinite; }

@keyframes ck-dash { to { stroke-dashoffset: -64 } }
.gs-dash { animation: ck-dash .55s linear infinite; }

@keyframes ck-netpulse { 0%, 100% { opacity: .45 } 50% { opacity: .85 } }
.gs-net { animation: ck-netpulse 2.4s ease-in-out infinite; }

@keyframes ck-netwave { 0% { transform: translateY(0) scale(1) } 30% { transform: translateY(4px) scale(1.06) } 60% { transform: translateY(-3px) scale(.97) } 100% { transform: translateY(0) scale(1) } }
.gs-net-wave { animation: ck-netwave .7s ease-out; transform-box: border-box; transform-origin: center; }

.gs-clip { clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }

.gs-mesh {
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='10'%20height='10'%3E%3Cpath%20d='M0%200L10%2010M10%200L0%2010'%20fill='none'%20stroke='%23ffffff'%20stroke-opacity='0.7'%20stroke-width='1'/%3E%3C/svg%3E");
  background-size: 10px 10px;
}

@media (prefers-reduced-motion: reduce) {
  .gs-led, .gs-flicker, .gs-net { animation-duration: 8s; }
  .gs-dash { animation: none; }
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

function HudStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="gs-clip relative min-w-24 border px-3 py-2 backdrop-blur-[2px]"
      style={{ borderColor: `${accent}99`, background: 'rgba(2,12,10,.6)', boxShadow: `0 0 14px ${accent}44, inset 0 0 12px ${accent}22` }}
    >
      <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full gs-led" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
      <p className="font-mono text-[9px] font-bold uppercase tracking-[.22em]" style={{ color: accent, textShadow: `0 0 8px ${accent}` }}>
        {label}
      </p>
      <p className="font-mono text-2xl leading-none font-black tabular-nums text-white" style={{ textShadow: `0 0 10px ${accent}` }}>
        {value}
      </p>
    </div>
  )
}

// Balón vectorial con contorno neón.
function BallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill="#f4fbff" stroke={C.cyan} strokeWidth="3" />
      <polygon points="50,33 66.2,44.8 60,63.8 40,63.8 33.8,44.8" fill="#0a1120" />
      <g stroke="#0a1120" strokeWidth="3" strokeLinecap="round">
        <line x1="50" y1="33" x2="50" y2="3" />
        <line x1="66.2" y1="44.8" x2="94.7" y2="35.5" />
        <line x1="60" y1="63.8" x2="77.6" y2="88" />
        <line x1="40" y1="63.8" x2="22.4" y2="88" />
        <line x1="33.8" y1="44.8" x2="5.3" y2="35.5" />
      </g>
    </svg>
  )
}

// Césped con perspectiva de fuga: líneas y franjas que convergen hacia el fondo.
function PitchFloor() {
  const vanishingX = 50
  const vanishingY = -30
  const bottom = Array.from({ length: 11 }, (_, index) => -14 + index * 13.2)
  const wedges = bottom.slice(0, -1).map((x, index) => ({
    id: index,
    points: `${vanishingX},${vanishingY} ${x},112 ${bottom[index + 1]},112`,
    light: index % 2 === 0,
  }))
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <rect width="100" height="100" fill="#2b8a44" />
      {wedges.map((wedge) => (
        <polygon key={wedge.id} points={wedge.points} fill={wedge.light ? '#33984c' : '#2b8a44'} />
      ))}
      <g stroke="rgba(255,255,255,.07)" strokeWidth="0.3">
        {bottom.map((x, index) => (
          <line key={index} x1={vanishingX} y1={vanishingY} x2={x} y2={112} />
        ))}
      </g>
    </svg>
  )
}

// Cyber-portero: armadura de placas, visor de escaneo, guantes biónicos con aura y campo de fuerza.
function CyberKeeper({ saved, charging }: { saved: boolean; charging: boolean }) {
  const ff = saved ? C.greenBright : charging ? C.violet : C.cyan
  return (
    <svg viewBox="0 0 140 200" className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="ck-armor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3a63" />
          <stop offset="0.5" stopColor="#141d33" />
          <stop offset="1" stopColor="#0a1120" />
        </linearGradient>
        <linearGradient id="ck-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#cbd5e1" />
          <stop offset="0.5" stopColor="#7b8aa6" />
          <stop offset="1" stopColor="#3b4761" />
        </linearGradient>
        <linearGradient id="ck-circuit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.green} />
          <stop offset="1" stopColor={C.cyan} />
        </linearGradient>
        <linearGradient id="ck-glove" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.violet} />
          <stop offset="1" stopColor={C.blue} />
        </linearGradient>
        <linearGradient id="ck-visor" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.cyan} />
          <stop offset="1" stopColor={C.violet} />
        </linearGradient>
        <filter id="ck-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ck-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* Sombras de contacto bajo los dos pies */}
      <g fill="#000" opacity="0.5" filter="url(#ck-soft)">
        <ellipse cx="46" cy="190" rx="20" ry="5" />
        <ellipse cx="94" cy="190" rx="20" ry="5" />
      </g>

      {/* Piernas articuladas */}
      <g strokeLinecap="round" fill="none">
        <path d="M58 122 L50 150" stroke="url(#ck-armor)" strokeWidth="15" />
        <path d="M50 150 L42 178" stroke="url(#ck-armor)" strokeWidth="13" />
        <path d="M82 122 L90 150" stroke="url(#ck-armor)" strokeWidth="15" />
        <path d="M90 150 L98 178" stroke="url(#ck-armor)" strokeWidth="13" />
        <path d="M58 122 L50 150 L42 178" stroke="url(#ck-circuit)" strokeWidth="1.6" strokeDasharray="3 6" />
        <path d="M82 122 L90 150 L98 178" stroke="url(#ck-circuit)" strokeWidth="1.6" strokeDasharray="3 6" />
      </g>
      {/* Rodilleras */}
      <rect x="43" y="141" width="15" height="15" rx="5" fill="url(#ck-metal)" stroke={C.cyan} strokeWidth="1.2" transform="rotate(-8 50 148)" />
      <rect x="82" y="141" width="15" height="15" rx="5" fill="url(#ck-metal)" stroke={C.cyan} strokeWidth="1.2" transform="rotate(8 90 148)" />
      {/* Botines */}
      <path d="M34 187 L58 187 L56 176 L44 176 Z" fill="#0a1120" stroke={C.cyan} strokeWidth="1.3" />
      <path d="M106 187 L82 187 L84 176 L96 176 Z" fill="#0a1120" stroke={C.cyan} strokeWidth="1.3" />
      <rect x="34" y="185" width="24" height="3" rx="1.5" fill={C.green} filter="url(#ck-glow)" />
      <rect x="82" y="185" width="24" height="3" rx="1.5" fill={C.green} filter="url(#ck-glow)" />

      {/* Pelvis */}
      <rect x="52" y="110" width="36" height="20" rx="7" fill="url(#ck-armor)" stroke={C.steel} strokeWidth="1.2" />
      <path d="M54 126 H86" stroke={C.green} strokeWidth="1.4" opacity="0.85" />

      {/* Brazos */}
      <g strokeLinecap="round" fill="none">
        <path d="M46 74 L28 92" stroke="url(#ck-armor)" strokeWidth="11" />
        <path d="M28 92 L14 110" stroke="url(#ck-armor)" strokeWidth="10" />
        <path d="M94 74 L112 92" stroke="url(#ck-armor)" strokeWidth="11" />
        <path d="M112 92 L126 110" stroke="url(#ck-armor)" strokeWidth="10" />
        <path d="M46 74 L28 92 L14 110" stroke={C.green} strokeWidth="1.3" strokeDasharray="3 6" />
        <path d="M94 74 L112 92 L126 110" stroke={C.green} strokeWidth="1.3" strokeDasharray="3 6" />
      </g>
      <circle cx="28" cy="92" r="5" fill="url(#ck-metal)" stroke={C.cyan} strokeWidth="1.2" />
      <circle cx="112" cy="92" r="5" fill="url(#ck-metal)" stroke={C.cyan} strokeWidth="1.2" />

      {/* Campos de fuerza (escudos) alrededor de los guantes */}
      <g fill="none" stroke={ff} strokeWidth="1.4">
        <circle cx="15" cy="114" r="18">
          <animate attributeName="r" values="15;27;15" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="15" cy="114" r="18">
          <animate attributeName="r" values="15;27;15" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="125" cy="114" r="18">
          <animate attributeName="r" values="15;27;15" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="125" cy="114" r="18">
          <animate attributeName="r" values="15;27;15" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
        </circle>
      </g>
      {saved && (
        <g fill={C.greenBright} filter="url(#ck-soft)">
          <circle cx="15" cy="114" r="30">
            <animate attributeName="opacity" values="0;0.7;0" dur="0.5s" fill="freeze" />
          </circle>
          <circle cx="125" cy="114" r="30">
            <animate attributeName="opacity" values="0;0.7;0" dur="0.5s" fill="freeze" />
          </circle>
        </g>
      )}

      {/* Guantes biónicos */}
      <g filter="url(#ck-glow)">
        <ellipse cx="15" cy="114" rx="13" ry="15" fill="url(#ck-glove)" stroke={C.violet} strokeWidth="1.4" />
        <ellipse cx="125" cy="114" rx="13" ry="15" fill="url(#ck-glove)" stroke={C.violet} strokeWidth="1.4" />
      </g>
      <g stroke="#0a1120" strokeWidth="1.3" opacity="0.5" strokeLinecap="round">
        <line x1="10" y1="102" x2="10" y2="112" />
        <line x1="15" y1="101" x2="15" y2="112" />
        <line x1="20" y1="102" x2="20" y2="112" />
        <line x1="120" y1="102" x2="120" y2="112" />
        <line x1="125" y1="101" x2="125" y2="112" />
        <line x1="130" y1="102" x2="130" y2="112" />
      </g>

      {/* Partículas flotantes alrededor de los guantes */}
      <g fill={C.cyan}>
        <circle cx="15" cy="114" r="1.7"><animate attributeName="cy" values="116;104;116" dur="2.2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;1;0" dur="2.2s" repeatCount="indefinite" /></circle>
        <circle cx="15" cy="114" r="1.4"><animate attributeName="cy" values="110;122;110" dur="1.9s" begin="0.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;0.9;0" dur="1.9s" begin="0.4s" repeatCount="indefinite" /></circle>
        <circle cx="125" cy="114" r="1.7"><animate attributeName="cy" values="116;104;116" dur="2.2s" begin="0.3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;1;0" dur="2.2s" begin="0.3s" repeatCount="indefinite" /></circle>
        <circle cx="125" cy="114" r="1.4"><animate attributeName="cy" values="110;122;110" dur="1.9s" begin="0.7s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;0.9;0" dur="1.9s" begin="0.7s" repeatCount="indefinite" /></circle>
      </g>

      {/* Torso con respiración */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 2; 0 0" dur="2s" repeatCount="indefinite" />
        <rect x="54" y="92" width="32" height="24" rx="7" fill="url(#ck-armor)" stroke={C.steel} strokeWidth="1.2" />
        <path d="M48 62 Q70 53 92 62 L88 94 Q70 101 52 94 Z" fill="url(#ck-armor)" stroke={C.steel} strokeWidth="1.4" />
        <path d="M54 66 Q70 60 86 66" stroke={C.green} strokeWidth="1.4" fill="none" opacity="0.85" />
        <path d="M56 72 H64 M76 72 H84 M60 86 H80" stroke="url(#ck-circuit)" strokeWidth="1.6" strokeLinecap="round" filter="url(#ck-glow)" />
        <circle cx="70" cy="79" r="6.5" fill={C.cyan} filter="url(#ck-glow)">
          <animate attributeName="opacity" values="1;0.5;1" dur="1.4s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Hombreras robóticas */}
      <path d="M46 60 Q33 62 31 75 Q44 77 51 70 Z" fill="url(#ck-metal)" stroke={C.cyan} strokeWidth="1.2" />
      <path d="M94 60 Q107 62 109 75 Q96 77 89 70 Z" fill="url(#ck-metal)" stroke={C.cyan} strokeWidth="1.2" />

      {/* Casco con visor de escaneo */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 2; 0 0" dur="2s" repeatCount="indefinite" />
        <rect x="64" y="56" width="12" height="8" rx="3" fill="url(#ck-metal)" />
        <path d="M54 40 Q54 20 70 20 Q86 20 86 40 L86 52 Q70 60 54 52 Z" fill="#0a1120" stroke={C.cyan} strokeWidth="2" />
        <path d="M54 44 H49 M86 44 H91" stroke={C.cyan} strokeWidth="1.4" strokeLinecap="round" />
        <rect x="58" y="36" width="24" height="8" rx="4" fill="url(#ck-visor)" filter="url(#ck-glow)" />
        <rect x="59" y="37" width="4" height="6" rx="2" fill="#ffffff" opacity="0.95">
          <animate attributeName="x" values="59;77;59" dur="1.8s" repeatCount="indefinite" />
        </rect>
        <path d="M70 20 L70 12" stroke={C.green} strokeWidth="2" strokeLinecap="round" />
        <circle cx="70" cy="11" r="2.6" fill={C.green} filter="url(#ck-glow)">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  )
}

// Confeti de píxeles.
const PIXEL_COLORS = [C.greenBright, C.cyan, C.violet, C.gold, '#ffffff', C.blue]

function PixelConfetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, index) => ({
        id: index,
        color: PIXEL_COLORS[index % PIXEL_COLORS.length],
        x: (seededUnit(index + 1) - 0.5) * 360,
        y: 80 + seededUnit(index + 91) * 300,
        rotate: seededUnit(index + 53) * 720 - 360,
        delay: seededUnit(index + 17) * 0.12,
        size: 5 + seededUnit(index + 131) * 7,
      })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-[55] overflow-hidden">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute left-1/2 top-[30%] block"
          style={{ width: piece.size, height: piece.size, background: piece.color, boxShadow: `0 0 6px ${piece.color}` }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: piece.x, y: piece.y, opacity: 0, rotate: piece.rotate }}
          transition={{ duration: 1.15, ease: 'easeOut', delay: piece.delay }}
        />
      ))}
    </div>
  )
}

// Chispas digitales de impacto.
function Sparks({ x, y }: { x: number; y: number }) {
  const rays = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        angle: (i / 14) * Math.PI * 2,
        dist: 26 + seededUnit(i + 3) * 34,
        size: 3 + seededUnit(i + 9) * 4,
        color: i % 3 === 0 ? C.violet : i % 2 === 0 ? C.cyan : '#ffffff',
      })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-[56]">
      <div className="absolute" style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
        <motion.span
          className="absolute block size-6 rounded-full"
          style={{ x: '-50%', y: '-50%', border: `2px solid ${C.cyan}`, boxShadow: `0 0 18px ${C.cyan}` }}
          initial={{ scale: 0.2, opacity: 1 }}
          animate={{ scale: 4.2, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {rays.map((ray) => (
          <motion.span
            key={ray.id}
            className="absolute block"
            style={{ width: ray.size, height: ray.size, background: ray.color, boxShadow: `0 0 8px ${ray.color}` }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(ray.angle) * ray.dist, y: Math.sin(ray.angle) * ray.dist, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </div>
    </div>
  )
}

// Minijuego 2: dominadas (keepie-uppies).
const JUGGLE_GROUND = 0.84
const JUGGLE_GRAVITY = 1.7
const JUGGLE_IMPULSE = -1.55
const JUGGLE_REACH = 0.42
const JUGGLE_X_MIN = 0.12
const JUGGLE_X_MAX = 0.88
const JUGGLE_Y_MIN = 0.08
const JUGGLE_SIDE = 1
const JUGGLE_FRICTION = 1.2
// Altura (normalizada) del límite de suelo: al tocar esta línea se pierde.
const JUGGLE_LIMIT_Y = 0.89

export function NotFoundGame({ homeHref = '/' }: { homeHref?: string }) {
  const reduceMotion = useReducedMotion() ?? false
  const safeHome = safeInternalHref(homeHref)

  const [phase, setPhase] = useState<'ready' | 'aiming' | 'flying' | 'result'>('ready')
  const [aim, setAim] = useState<Aim | null>(null)
  const [outcome, setOutcome] = useState<'goal' | 'save' | null>(null)
  const [impact, setImpact] = useState<{ x: number; y: number } | null>(null)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [celebrate, setCelebrate] = useState(false)
  const [mode, setMode] = useState<'penales' | 'dominadas'>('penales')
  const [juggles, setJuggles] = useState(0)
  const [juggleBest, setJuggleBest] = useState(0)
  const [juggleMsg, setJuggleMsg] = useState<'idle' | 'drop'>('idle')

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
  const ballShadowOpacity = useTransform(ballScale, (value) => clamp((value - 0.42) / 0.58, 0, 1) * 0.55)
  const ballShadowScale = useTransform(ballScale, (value) => 0.45 + clamp((value - 0.42) / 0.58, 0, 1) * 0.55)

  const juggleY = useMotionValue<number>(JUGGLE_GROUND)
  const juggleX = useMotionValue<number>(0.5)
  const juggleTop = useTransform(juggleY, (value) => `${value * 100}%`)
  const juggleLeft = useTransform(juggleX, (value) => `${value * 100}%`)
  const juggleSpin = useTransform(() => (JUGGLE_GROUND - juggleY.get()) * 700 + (juggleX.get() - 0.5) * 420)
  const juggleShadowOpacity = useTransform(juggleY, (value) => clamp((value - 0.25) / (JUGGLE_GROUND - 0.25), 0, 1) * 0.5)
  const juggleShadowScale = useTransform(juggleY, (value) => 0.5 + clamp((value - 0.25) / (JUGGLE_GROUND - 0.25), 0, 1) * 0.5)

  const phaseRef = useRef(phase)
  const aimRef = useRef<Aim | null>(null)
  const streakRef = useRef(0)
  const bestRef = useRef(0)
  const lastTargetRef = useRef<Aim | null>(null)
  const clockRef = useRef(0)
  const divingRef = useRef(false)
  const fieldRef = useRef<HTMLDivElement | null>(null)
  const resetTimerRef = useRef<number | null>(null)
  const juggleYRef = useRef(JUGGLE_GROUND)
  const juggleXRef = useRef(0.5)
  const juggleVyRef = useRef(0)
  const juggleVxRef = useRef(0)
  const jugglePlayingRef = useRef(false)
  const jugglesRef = useRef(0)
  const juggleBestRef = useRef(0)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

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
    if (mode !== 'penales') return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      if (!divingRef.current) {
        clockRef.current = (clockRef.current + dt) % KEEPER.sweepMs
        const t = clockRef.current / KEEPER.sweepMs
        const triangle = t < 0.5 ? t * 2 : 2 - t * 2
        keeperBase.set(KEEPER.min + triangle * (KEEPER.max - KEEPER.min))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [keeperBase, mode])

  // Física del minijuego de dominadas (solo activo en ese modo).
  useEffect(() => {
    if (mode !== 'dominadas') return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (jugglePlayingRef.current) {
        // Horizontal: derive lateral con fricción y rebote en los bordes.
        juggleVxRef.current *= Math.max(0, 1 - JUGGLE_FRICTION * dt)
        let nx = juggleXRef.current + juggleVxRef.current * dt
        if (nx <= JUGGLE_X_MIN) {
          nx = JUGGLE_X_MIN
          juggleVxRef.current = Math.abs(juggleVxRef.current) * 0.6
        } else if (nx >= JUGGLE_X_MAX) {
          nx = JUGGLE_X_MAX
          juggleVxRef.current = -Math.abs(juggleVxRef.current) * 0.6
        }
        juggleXRef.current = nx
        juggleX.set(nx)

        // Vertical: gravedad y rebote en el techo.
        juggleVyRef.current += JUGGLE_GRAVITY * dt
        let next = juggleYRef.current + juggleVyRef.current * dt
        if (next <= JUGGLE_Y_MIN) {
          next = JUGGLE_Y_MIN
          juggleVyRef.current = Math.abs(juggleVyRef.current) * 0.5
        }
        if (next >= JUGGLE_GROUND) {
          next = JUGGLE_GROUND
          juggleVyRef.current = 0
          jugglePlayingRef.current = false
          juggleYRef.current = next
          juggleY.set(next)
          jugglesRef.current = 0
          setJuggles(0)
          setJuggleMsg('drop')
        } else {
          juggleYRef.current = next
          juggleY.set(next)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mode, juggleX, juggleY])

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

  // Botón temporal para alternar entre minijuegos.
  const switchMode = () => {
    if (mode === 'penales') {
      jugglePlayingRef.current = false
      juggleVyRef.current = 0
      juggleVxRef.current = 0
      juggleYRef.current = JUGGLE_GROUND
      juggleY.set(JUGGLE_GROUND)
      juggleXRef.current = 0.5
      juggleX.set(0.5)
      jugglesRef.current = 0
      setJuggles(0)
      setJuggleMsg('idle')
      setMode('dominadas')
    } else {
      setMode('penales')
    }
  }

  // Una "dominada": toca el balón (solo si está a altura alcanzable).
  // El punto donde toques marca la dirección lateral del balón.
  const handleJuggleTap = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const offset = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2), -1, 1)
    const sideKick = offset * JUGGLE_SIDE
    if (!jugglePlayingRef.current) {
      jugglePlayingRef.current = true
      juggleVyRef.current = JUGGLE_IMPULSE
      juggleVxRef.current = sideKick
      setJuggleMsg('idle')
      jugglesRef.current = 1
      setJuggles(1)
      if (1 > juggleBestRef.current) {
        juggleBestRef.current = 1
        setJuggleBest(1)
      }
      return
    }
    if (juggleYRef.current < JUGGLE_REACH) return
    juggleVyRef.current = JUGGLE_IMPULSE
    juggleVxRef.current = sideKick
    const next = jugglesRef.current + 1
    jugglesRef.current = next
    setJuggles(next)
    if (next > juggleBestRef.current) {
      juggleBestRef.current = next
      setJuggleBest(next)
    }
  }

  const frameGlow = outcome === 'goal' ? C.gold : outcome === 'save' ? C.violet : 'rgba(255,255,255,.5)'

  const outcomeText =
    outcome === 'goal'
      ? { title: '¡GOL! +1', sub: 'RACHA +1', color: C.greenBright }
      : { title: '¡ATAJADA!', sub: 'RACHA PERDIDA', color: C.rose }

  return (
    <main className="fixed inset-0 z-[80] overflow-y-auto bg-background">
      <style>{GAME_CSS}</style>
      <div className="relative flex min-h-full items-center justify-center px-5 py-10">
        <div className="pointer-events-none absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 size-80 rounded-full bg-chart-3/10 blur-3xl" />

        <div className="relative z-10 grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <section className="text-center lg:text-left">
          <p className="eyebrow">Error 404</p>
          <h1 className="mt-4 font-display text-6xl leading-[0.88] font-black uppercase tracking-[-.03em] sm:text-7xl">
            ¡Mandaste la pelota <em className="text-primary not-italic">afuera</em>!
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground lg:mx-0">
            La página que buscas no está en el campo de juego. Mientras vuelves, tírate una tanda de penales.
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

        <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-md">
          <div className="mb-3 flex items-end justify-between gap-2">
            <HudStat label="Racha" value={mode === 'penales' ? streak : juggles} accent={C.green} />
            <div className="hidden text-center sm:block">
              <p className="font-mono text-[10px] tracking-[.3em] text-muted-foreground">{mode === 'penales' ? 'PENALTY.EXE' : 'JUGGLE.EXE'}</p>
              <p className="font-mono text-[8px] tracking-[.22em] text-muted-foreground/70">CYBER-ARENA // v4</p>
            </div>
            <HudStat label="Récord" value={mode === 'penales' ? best : juggleBest} accent={C.violet} />
          </div>

          <div className="mb-2 flex justify-center">
            <button
              type="button"
              onClick={switchMode}
              className="rounded-full border border-border bg-muted/50 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {mode === 'penales' ? '⇄ Probar: Dominadas' : '⇄ Probar: Penales'}
            </button>
          </div>

          <div
            ref={fieldRef}
            className="relative aspect-[5/4] w-full select-none overflow-hidden rounded-2xl shadow-inner"
            style={{ background: 'linear-gradient(180deg, #3aa655 0%, #2c8a44 48%, #1f6b34 100%)' }}
            aria-label={mode === 'penales' ? 'Cyber-penales: arrastra desde el balón hacia el arco y suelta para patear' : 'Dominadas: toca el balón para mantenerlo en el aire'}
          >
            {/* Césped en perspectiva de fuga */}
            <PitchFloor />
            {/* Luz central y sombra de horizonte */}
            <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(58% 46% at 50% 34%, rgba(255,255,255,.14), transparent 72%)' }} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[40%]" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.3), transparent)' }} />
            {/* Marco interior de la cancha */}
            <div className="pointer-events-none absolute inset-[2.5%] rounded-xl border border-white/25" />
            {/* Cartel holográfico */}
            <div
              className="gs-flicker absolute left-1/2 top-[3%] z-30 -translate-x-1/2 whitespace-nowrap rounded-sm border px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[.24em]"
              style={{ borderColor: `${C.cyan}88`, color: C.cyan, background: 'rgba(2,10,16,.7)', textShadow: `0 0 10px ${C.cyan}`, boxShadow: `0 0 18px ${C.cyan}44` }}
            >
              404 :: ENLACE FUERA DE JUEGO
            </div>

            {mode === 'penales' ? (
              <>
                {/* Línea de meta (ancho completo) */}
                <div className="pointer-events-none absolute inset-x-[2.5%] top-[54%] h-[4px] -translate-y-1/2" style={{ background: 'rgba(255,255,255,.9)', boxShadow: '0 0 10px rgba(255,255,255,.55)' }} />
                {/* Área de penal + punto de penal */}
                <div className="pointer-events-none absolute inset-x-[8%] top-[74%] h-[2px]" style={{ background: 'rgba(255,255,255,.5)' }} />
                <div className="pointer-events-none absolute left-1/2 top-[85%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'rgba(255,255,255,.85)' }} />
                {/* Sombra de contacto del balón (se disipa al volar) */}
                <motion.div
                  style={{ x: '-50%', y: '-50%', opacity: ballShadowOpacity, scaleX: ballShadowScale, background: 'rgba(0,0,0,.5)' }}
                  className="pointer-events-none absolute left-1/2 top-[90%] h-3 w-14 rounded-[50%] blur-md"
                />

                {/* Arco 3D (blanco) */}
                <div className="absolute left-[8%] right-[8%] top-[10%] h-[44%]">
                  <div className={cn('absolute inset-0', outcome === 'goal' && 'gs-net-wave')}>
                    <div className="gs-mesh absolute left-[16%] right-[16%] top-[14%] bottom-[24%] bg-[rgba(6,20,12,.3)]" />
                    <div className="gs-mesh absolute inset-y-0 left-0 w-[16%] bg-[rgba(6,20,12,.2)]" style={{ clipPath: 'polygon(0 0, 100% 14%, 100% 76%, 0 100%)' }} />
                    <div className="gs-mesh absolute inset-y-0 right-0 w-[16%] bg-[rgba(6,20,12,.2)]" style={{ clipPath: 'polygon(100% 0, 0 14%, 0 76%, 100% 100%)' }} />
                    <div className="gs-mesh absolute inset-x-0 top-0 h-[14%] bg-[rgba(6,20,12,.26)]" style={{ clipPath: 'polygon(0 0, 100% 0, 84% 100%, 16% 100%)' }} />
                    <div className="absolute left-[16%] right-[16%] top-[14%] bottom-[24%] border border-white/40" />
                  </div>
                  <div className="absolute inset-0 rounded-t-md border-2 border-b-0 border-white" style={{ boxShadow: `0 0 16px ${frameGlow}, inset 0 0 34px rgba(0,0,0,.38)` }} />
                </div>

                {/* Destello en el césped que sigue al portero */}
                <motion.div
                  style={{ left: keeperLeft, x: '-50%', bottom: '43%', background: `radial-gradient(50% 50% at 50% 50%, ${C.cyan}55, transparent 70%)` }}
                  className="pointer-events-none absolute z-[15] h-6 w-32 rounded-full blur-[7px]"
                />

                {/* Cyber-portero */}
                <motion.div
                  style={{ left: keeperLeft, x: '-50%', bottom: '46%' }}
                  className="absolute z-20 h-32 w-22 will-change-[left] sm:h-40 sm:w-28"
                >
                  <motion.div style={{ rotate: keeperTilt, scaleX: keeperStretch }} className="h-full w-full">
                    <CyberKeeper saved={outcome === 'save'} charging={phase === 'flying'} />
                  </motion.div>
                </motion.div>

                {/* Trayectoria neón + mira */}
                {aim && (
                  <>
                    <svg className="pointer-events-none absolute inset-0 z-[25] h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                      <line
                        x1={BALL_REST.x * 100}
                        y1={BALL_REST.y * 100}
                        x2={aim.x * 100}
                        y2={aim.y * 100}
                        stroke={C.cyan}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="0.1 7"
                        vectorEffect="non-scaling-stroke"
                        className="gs-dash"
                        opacity={0.4 + aim.power * 0.6}
                        style={{ filter: `drop-shadow(0 0 6px ${C.cyan})` }}
                      />
                    </svg>
                    <span
                      className="pointer-events-none absolute z-[26] -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        left: `${aim.x * 100}%`,
                        top: `${aim.y * 100}%`,
                        width: 24 + aim.power * 14,
                        height: 24 + aim.power * 14,
                        border: `2px solid ${C.cyan}`,
                        boxShadow: `0 0 14px ${C.cyan}99`,
                        opacity: 0.5 + aim.power * 0.5,
                      }}
                    />
                  </>
                )}

                {/* Balón */}
                <motion.div
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerCancel}
                  onLostPointerCapture={onPointerCancel}
                  style={{ left: ballLeft, top: ballTop, x: '-50%', y: '-50%', scale: ballScale, rotate: ballRotate, filter: `drop-shadow(-4px -5px 11px ${C.cyan}) drop-shadow(4px -5px 11px ${C.cyan})` }}
                  className="absolute z-30 size-11 cursor-grab touch-none active:cursor-grabbing sm:size-12"
                >
                  <BallIcon className="h-full w-full" />
                </motion.div>

                {/* Desenlace */}
                {outcome && (
                  <motion.div
                    style={{ x: '-50%', y: '-50%', color: outcomeText.color, textShadow: `0 0 18px ${outcomeText.color}` }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                    className="pointer-events-none absolute left-1/2 top-[30%] z-[57] text-center"
                  >
                    <p className="font-mono text-3xl font-black uppercase sm:text-4xl">{outcomeText.title}</p>
                    <p className="mt-1 font-mono text-[10px] tracking-[.3em] text-white/70">{outcomeText.sub}</p>
                  </motion.div>
                )}

                {celebrate && <PixelConfetti />}
                {impact && <Sparks x={impact.x} y={impact.y} />}
              </>
            ) : (
              <>
                {/* Límite de suelo: si el balón lo toca, pierdes */}
                <div className="pointer-events-none absolute inset-x-[6%] border-t-2 border-dashed" style={{ top: `${JUGGLE_LIMIT_Y * 100}%`, borderColor: `${C.rose}cc`, boxShadow: `0 0 8px ${C.rose}66` }} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: `${JUGGLE_LIMIT_Y * 100}%`, background: `linear-gradient(180deg, ${C.rose}24, transparent)` }} />
                <span className="pointer-events-none absolute right-[6%] font-mono text-[8px] font-bold tracking-[.2em]" style={{ top: `${JUGGLE_LIMIT_Y * 100 + 1.5}%`, color: C.rose }}>
                  LÍMITE · PIERDES
                </span>

                {/* Sombra de contacto del balón */}
                <motion.div
                  style={{ left: juggleLeft, top: `${JUGGLE_LIMIT_Y * 100}%`, x: '-50%', y: '-50%', opacity: juggleShadowOpacity, scaleX: juggleShadowScale, background: 'rgba(0,0,0,.5)' }}
                  className="pointer-events-none absolute h-3 w-14 rounded-[50%] blur-md"
                />

                {/* Balón para dominadas */}
                <motion.div
                  onPointerDown={handleJuggleTap}
                  style={{ left: juggleLeft, top: juggleTop, x: '-50%', y: '-50%', rotate: juggleSpin, filter: `drop-shadow(-4px -5px 11px ${C.cyan}) drop-shadow(4px -5px 11px ${C.cyan})` }}
                  className="absolute z-30 grid size-14 cursor-pointer touch-none place-items-center"
                >
                  <BallIcon className="size-11" />
                </motion.div>

                {/* Mensajes */}
                <div className="pointer-events-none absolute left-1/2 top-[40%] z-40 w-full -translate-x-1/2 text-center">
                  {juggleMsg === 'drop' && (
                    <p className="font-mono text-2xl font-black uppercase" style={{ color: C.rose, textShadow: `0 0 16px ${C.rose}` }}>
                      ¡Se cayó!
                    </p>
                  )}
                  {juggles === 0 && (
                    <p className="mt-1 font-mono text-[10px] tracking-[.25em] text-white/75">TOCA EL BALÓN PARA EMPEZAR</p>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="mt-3 text-center font-mono text-[10px] tracking-[.18em] text-muted-foreground">
            {mode === 'penales'
              ? 'ARRASTRA DESDE EL BALÓN Y SUELTA PARA PATEAR'
              : 'TOCA EL BALÓN PARA HACER UNA DOMINADA · SI CAE, VUELVES A CERO'}
          </p>
        </section>
        </div>
      </div>
    </main>
  )
}
