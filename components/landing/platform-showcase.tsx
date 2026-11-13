'use client'

import Image from 'next/image'
import {useEffect, useRef, useState} from 'react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {useGSAP} from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const slides = [
    {
        src: '/landing/capAgenda.png?v=20261113',
        alt: 'Agenda semanal de Grassly con reservas y estados de pago',
        title: 'Toda tu agenda, de un vistazo',
        description: 'Organiza las reservas por cancha, horario y estado de pago desde una sola vista.',
        width: 4320,
        height: 2486,
    },
    {
        src: '/landing/capCanchas.png?v=20261113',
        alt: 'Administracion de canchas, deportes y precios en Grassly',
        title: 'Administra tus canchas',
        description: 'Configura cada cancha, sus deportes y los precios por hora de tu complejo.',
        width: 4320,
        height: 2486,
    },
    {
        src: '/landing/capTarifas.png?v=20261112-2',
        alt: 'Tarifas dinamicas por horario y promociones',
        title: 'Define tarifas a tu medida',
        description: 'Combina precios semanales y promociones para cada horario y cancha.',
        width: 4320,
        height: 2486,
    },
    {
        src: '/landing/capClientes.png?v=20261112',
        alt: 'Base de clientes con historial y reservas',
        title: 'Conoce a tus clientes',
        description: 'Consulta su historial de reservas y el movimiento de cada cliente.',
        width: 4320,
        height: 2486,
    },
    {
        src: '/landing/capReportesFinanciero.png?v=20261112',
        alt: 'Reporte financiero de Grassly con ingresos y saldos',
        title: 'Decide con informacion clara',
        description: 'Revisa ingresos, saldos pendientes, reservas y ticket promedio.',
        width: 4320,
        height: 2486,
    },
]

function PlatformHeading() {
    return (
        <header className="grid shrink-0 gap-3 md:grid-cols-2 md:items-end">
            <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[.18em] text-[#52604f]">PLATAFORMA GRASSLY</p>
                <h2 id="plataforma-title" className="text-balance font-display text-[clamp(2rem,min(4.5vw,7vh),4rem)] font-black uppercase leading-[.92] tracking-[-.03em]">
                    Tu complejo, bajo control.
                </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#465047] md:justify-self-end md:text-base md:leading-7 [@media(max-height:700px)]:hidden">
                Agenda, canchas, tarifas, clientes e ingresos: todo lo que necesitas para gestionar tu negocio en una sola plataforma.
            </p>
        </header>
    )
}

export function PlatformShowcase() {
    const sectionRef = useRef<HTMLElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLDivElement>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [reducedMotion, setReducedMotion] = useState(false)

    useEffect(() => {
        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
        const syncMotionPreference = () => setReducedMotion(motionPreference.matches)

        syncMotionPreference()
        motionPreference.addEventListener('change', syncMotionPreference)
        return () => motionPreference.removeEventListener('change', syncMotionPreference)
    }, [])

    useGSAP(() => {
        if (reducedMotion) return

        const section = sectionRef.current
        const stage = stageRef.current
        if (!section || !stage) return

        const scrollProgress = {value: 0}
        let currentIndex = -1

        const syncActiveSlide = () => {
            const nextIndex = Math.min(slides.length - 1, Math.round(scrollProgress.value))
            if (nextIndex === currentIndex) return
            currentIndex = nextIndex
            setActiveIndex(nextIndex)
        }

        gsap.to(scrollProgress, {
            value: slides.length - 1,
            ease: 'none',
            onUpdate: syncActiveSlide,
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: () => `+=${window.innerHeight * (slides.length - 1)}`,
                pin: stage,
                pinSpacing: true,
                scrub: true,
                anticipatePin: 1,
                snap: 1 / (slides.length - 1),
            },
        })

        syncActiveSlide()
    }, {scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true})

    useGSAP(() => {
        const image = imageRef.current
        if (!image || reducedMotion) return
        gsap.fromTo(image, {autoAlpha: 0, y: 12}, {autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out'})
    }, {scope: sectionRef, dependencies: [activeIndex, reducedMotion], revertOnUpdate: true})

    const activeSlide = slides[activeIndex]

    return (
        <section
            ref={sectionRef}
            id="plataforma"
            aria-labelledby="plataforma-title"
            className="scroll-mt-24 bg-[#eef0e9] text-[#151c16]"
        >
            {reducedMotion ? (
                <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
                    <PlatformHeading/>
                    <div className="mt-10 grid gap-8">
                        {slides.map((slide, index) => (
                            <figure key={slide.src} className="grid gap-4 rounded-2xl border border-[#151c16]/10 bg-white p-3 shadow-[0_16px_45px_rgba(21,28,22,0.08)] md:grid-cols-[1.4fr_.6fr] md:items-center md:p-5">
                                <div className="relative w-full overflow-hidden rounded-xl bg-[#f8faf5]" style={{aspectRatio: `${slide.width} / ${slide.height}`}}>
                                    <Image src={slide.src} alt={slide.alt} fill sizes="(min-width: 768px) 760px, 90vw" quality={90} className="object-contain"/>
                                </div>
                                <figcaption className="px-2 py-2 md:px-4">
                                    <p className="text-xs font-bold uppercase tracking-[.14em] text-[#58635a]">{String(index + 1).padStart(2, '0')} / {slides.length}</p>
                                    <h3 className="mt-2 font-display text-2xl font-black leading-tight">{slide.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-[#465047]">{slide.description}</p>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            ) : (
                <div ref={stageRef} className="relative flex h-svh min-h-[34rem] flex-col overflow-hidden">
                    <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-5 pb-5 pt-44 lg:px-8 lg:pt-28">
                        <PlatformHeading/>
                        <div className="relative mt-5 min-h-0 flex-1" style={{containerType: 'size'}}>
                            <div ref={imageRef} className="absolute inset-0 flex items-center justify-center">
                                <div
                                    className="relative overflow-hidden rounded-2xl bg-[#f8faf5] shadow-[0_24px_70px_rgba(21,28,22,0.14)]"
                                    style={{
                                        width: `min(100cqw, ${(100 * activeSlide.width) / activeSlide.height}cqh)`,
                                        height: `min(100cqh, ${(100 * activeSlide.height) / activeSlide.width}cqw)`,
                                    }}
                                >
                                    <Image
                                        key={activeSlide.src}
                                        src={activeSlide.src}
                                        alt={activeSlide.alt}
                                        fill
                                        sizes="(min-width: 1280px) 1120px, (min-width: 768px) 88vw, 94vw"
                                        quality={90}
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                        <footer className="flex shrink-0 items-end justify-between gap-5 pt-4 sm:pt-5">
                            <div aria-live="polite" aria-atomic="true">
                                <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#58635a] sm:text-xs">
                                    {String(activeIndex + 1).padStart(2, '0')} / {slides.length} · PLATAFORMA
                                </p>
                                <h3 className="mt-1 font-display text-xl font-black leading-tight sm:text-2xl">{activeSlide.title}</h3>
                                <p className="mt-1 max-w-2xl text-xs leading-5 text-[#465047] sm:text-sm sm:leading-6">{activeSlide.description}</p>
                            </div>
                            <ol aria-label="Progreso de capturas" className="hidden shrink-0 items-center gap-1.5 pb-1 sm:flex">
                                {slides.map((slide, index) => (
                                    <li
                                        key={slide.src}
                                        aria-current={index === activeIndex ? 'step' : undefined}
                                        className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${index === activeIndex ? 'w-7 bg-[#151c16]' : 'w-1.5 bg-[#151c16]/25'}`}
                                    />
                                ))}
                            </ol>
                        </footer>
                    </div>
                </div>
            )}
        </section>
    )
}
