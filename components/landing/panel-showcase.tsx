'use client'

import Image from 'next/image'
import {useEffect, useRef, useState} from 'react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {useGSAP} from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const slides = [
    {
        src: '/landing/capCanchas.png',
        alt: 'Canchas de Grassly con sus deportes y su precio por hora',
        caption: 'Una cancha puede tener fútbol, vóley y básquet, cada uno con su precio por hora.',
    },
    {
        src: '/landing/capTarifas.png',
        alt: 'Tarifas de Grassly con precios por hora y por cancha',
        caption: 'Un precio por deporte y por cancha, con tarifas distintas de noche o en un día especial.',
    },
    {
        src: '/landing/capReportesFinanciero.png',
        alt: 'Reporte financiero de Grassly con cobros por día',
        caption: 'Cuánto cobraste y cuánto te falta cobrar, día a día.',
    },
]

// Altura de scroll dedicada a cada captura, en svh.
const PER_IMAGE = 80

// Posición de una tarjeta según su distancia a la central (0, 1 y 2 capturas).
// x está en % del ancho de la propia tarjeta.
const POSITIONS = [
    {x: 0, scale: 1, veil: 0},
    {x: 38, scale: 0.82, veil: 0.15},
    {x: 62, scale: 0.66, veil: 0.3},
]

const CARD_WIDTH = 'w-[min(80cqw,calc((100cqh_-_2.75rem)*1.6))] sm:w-[min(70cqw,calc((100cqh_-_2.75rem)*1.6))] lg:w-[min(62cqw,calc((100cqh_-_2.75rem)*1.6))]'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const positionAt = (distance: number) => {
    const absolute = clamp(Math.abs(distance), 0, 2)
    const index = Math.min(Math.floor(absolute), POSITIONS.length - 2)
    const from = POSITIONS[index]
    const to = POSITIONS[index + 1]
    const step = absolute - index

    return {
        x: from.x + (to.x - from.x) * step,
        scale: from.scale + (to.scale - from.scale) * step,
        veil: from.veil + (to.veil - from.veil) * step,
    }
}

function SectionBackground() {
    return (
        <>
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                <Image src="/cancha.png" alt="" fill sizes="100vw" className="object-cover opacity-[.16] mix-blend-multiply"/>
                <div className="absolute inset-0 bg-surface/55"/>
            </div>
            <div className="absolute left-[7%] top-0 h-full border-l border-dashed border-border" aria-hidden/>
            <div className="absolute right-[12%] top-0 h-full border-l border-dashed border-border" aria-hidden/>
        </>
    )
}

function SectionHeader() {
    return (
        <div className="grid shrink-0 gap-4 lg:grid-cols-2 lg:items-end">
            <h2 className="text-balance font-display text-[clamp(1.75rem,min(4.2vw,7.5vh),3.75rem)] font-black uppercase leading-[.92] tracking-[-.022em]">
                Tu negocio deja de ser una intuición.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground lg:justify-self-end lg:text-base lg:leading-7 [@media(max-height:700px)]:hidden">
                Mira lo que ocurre antes de que termine el día. Desde el estado de cada cancha hasta las horas que merecen una promoción.
            </p>
        </div>
    )
}

function SlideFrame({slide}: {slide: (typeof slides)[number]}) {
    return (
        <div className="relative aspect-[16/10]">
            <Image src={slide.src} alt={slide.alt} fill
                   sizes="(min-width:1024px) 680px, 80vw"
                   quality={90}
                   className="object-cover object-top"/>
        </div>
    )
}

export function PanelShowcase() {
    const sectionRef = useRef<HTMLElement>(null)
    const slideRefs = useRef<Array<HTMLDivElement | null>>([])
    const veilRefs = useRef<Array<HTMLSpanElement | null>>([])
    const [reduced, setReduced] = useState(false)
    const [active, setActive] = useState(0)

    useEffect(() => {
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
        const sync = () => setReduced(motion.matches)
        sync()
        motion.addEventListener('change', sync)
        return () => motion.removeEventListener('change', sync)
    }, [])

    useGSAP(() => {
        if (reduced) return

        const section = sectionRef.current
        if (!section) return

        const cards = slideRefs.current.filter((slide): slide is HTMLDivElement => slide !== null)
        const veils = veilRefs.current.filter((veil): veil is HTMLSpanElement => veil !== null)
        if (cards.length !== slides.length || veils.length !== slides.length) return

        const setX = cards.map((card) => gsap.quickSetter(card, 'xPercent'))
        const setScale = cards.map((card) => gsap.quickSetter(card, 'scale'))
        const setVeilOpacity = veils.map((veil) => gsap.quickSetter(veil, 'opacity'))
        const lastZIndexes = cards.map(() => -1)
        let currentActive = -1

        const renderProgress = (progress: number) => {
            const bounded = clamp(progress, 0, slides.length - 1)
            const nextActive = Math.round(bounded)

            if (nextActive !== currentActive) {
                currentActive = nextActive
                setActive(nextActive)
            }

            cards.forEach((_, index) => {
                const distance = index - bounded
                const {x, scale, veil} = positionAt(distance)
                const zIndex = 100 - Math.round(Math.abs(distance) * 10)
                if (lastZIndexes[index] !== zIndex) {
                    cards[index].style.zIndex = String(zIndex)
                    lastZIndexes[index] = zIndex
                }
                setX[index](-50 + Math.sign(distance) * x)
                setScale[index](scale)
                setVeilOpacity[index](veil)
            })
        }

        cards.forEach((card) => {
            gsap.set(card, {xPercent: -50, yPercent: -50, willChange: 'transform'})
        })

        const trigger = ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => renderProgress(self.progress * (slides.length - 1)),
            onRefresh: (self) => renderProgress(self.progress * (slides.length - 1)),
        })

        renderProgress(trigger.progress * (slides.length - 1))
    }, {scope: sectionRef, dependencies: [reduced], revertOnUpdate: true})

    return (
        <section id="panel" ref={sectionRef} className="relative bg-surface"
                 style={reduced ? undefined : {height: `calc(100svh + ${(slides.length - 1) * PER_IMAGE}svh)`}}>
            {reduced
                ? <div className="relative overflow-hidden">
                    <SectionBackground/>
                    <div className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
                        <SectionHeader/>
                        <div role="region" aria-label="Capturas del panel de Grassly"
                             className="mt-12 grid gap-8 lg:grid-cols-3">
                            {slides.map((slide) => (
                                <figure key={slide.src}>
                                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-floating">
                                        <SlideFrame slide={slide}/>
                                    </div>
                                    <figcaption className="mt-4 text-center text-sm leading-6 text-muted-foreground">
                                        {slide.caption}
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    </div>
                </div>
                : <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
                    <SectionBackground/>
                    <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-5 pb-6 pt-24 lg:px-8">
                        <SectionHeader/>
                        <div role="region" aria-roledescription="carrusel" aria-label="Capturas del panel de Grassly"
                             className="relative mt-6 min-h-0 flex-1" style={{containerType: 'size'}}>
                            {slides.map((slide, index) => {
                                return (
                                    <div key={slide.src}
                                         ref={(element) => { slideRefs.current[index] = element }}
                                         className={`absolute left-1/2 top-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-floating ${CARD_WIDTH}`}>
                                        <SlideFrame slide={slide}/>
                                        <span ref={(element) => { veilRefs.current[index] = element }}
                                              aria-hidden="true"
                                              className="pointer-events-none absolute inset-0 bg-foreground"/>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="shrink-0 pt-4">
                            <div className="grid text-center">
                                {slides.map((slide, index) => (
                                    <p key={slide.src} aria-hidden={index !== active}
                                       className={`col-start-1 row-start-1 mx-auto max-w-xl text-sm leading-6 text-muted-foreground transition-opacity duration-[250ms] ${index === active ? 'opacity-100' : 'opacity-0'}`}>
                                        {slide.caption}
                                    </p>
                                ))}
                            </div>
                            <div aria-hidden="true" className="mt-3 flex items-center justify-center gap-1.5">
                                {slides.map((slide, index) => (
                                    <span key={slide.src}
                                          className={`h-1 rounded-full transition-[width,background-color] duration-200 ${index === active ? 'w-6 bg-sidebar' : 'w-2.5 bg-muted-foreground/30'}`}/>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>}
        </section>
    )
}
