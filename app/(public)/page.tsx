'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { AppShowcase } from '@/components/landing/app-showcase'
import { PanelShowcase } from '@/components/landing/panel-showcase'
import { PaymentsFlow } from '@/components/landing/payments-flow'
import { RegistrationSteps } from '@/components/landing/registration-steps'
import { Footer } from '@/components/landing/footer'
import { FeaturesBento } from '@/components/landing/features-bento'
import { LandingManifesto } from '@/components/landing/landing-manifesto'
import { MagazineHero } from '@/components/landing/magazine-hero'
import { Navbar } from '@/components/landing/navbar'
import { FAQSection } from '@/components/landing/faq-section'
import { Preloader } from '@/components/landing/preloader'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function LandingPage() {
    const [isHeroReady, setIsHeroReady] = useState(false)
    const priceSectionRef = useRef<HTMLElement>(null)
    const priceOfferRef = useRef<HTMLDivElement>(null)
    const priceDigitRefs = useRef<Array<HTMLSpanElement | null>>([])

    useGSAP(() => {
        const priceSection = priceSectionRef.current
        const priceOffer = priceOfferRef.current
        const priceReels = priceDigitRefs.current.filter((reel): reel is HTMLSpanElement => reel !== null)
        if (!priceSection || !priceOffer || priceReels.length !== 2) return

        const media = gsap.matchMedia()
        media.add('(prefers-reduced-motion: no-preference)', () => {
            const titleLines = priceSection.querySelectorAll<HTMLElement>('[data-price-title-line]')

            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: priceSection,
                    start: 'top 78%',
                    toggleActions: 'play none none reverse',
                },
            })

            timeline.fromTo(
                titleLines,
                { yPercent: 110, autoAlpha: 0 },
                {
                    yPercent: 0,
                    autoAlpha: 1,
                    duration: 0.85,
                    stagger: 0.15,
                    ease: 'power4.out',
                },
            )
            timeline.fromTo(
                priceOffer,
                { x: 40, autoAlpha: 0 },
                { x: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' },
                '>-0.45',
            )
            timeline.to(
                priceReels,
                {
                    y: (_, reel) => {
                        const digitHeight = reel.children[0]?.getBoundingClientRect().height ?? 0
                        return -digitHeight * 50
                    },
                    duration: 2,
                    ease: 'power4.out',
                },
                0.2,
            )
        })

        return () => media.revert()
    }, { scope: priceSectionRef })

    return <main className="site-shell overflow-x-clip bg-background text-foreground">
        <Preloader onComplete={() => setIsHeroReady(true)}/>
        <Navbar/>
        <MagazineHero isReady={isHeroReady}/>
        <LandingManifesto/>
        <FeaturesBento/>
        <PaymentsFlow/>
        <PanelShowcase/>
        <AppShowcase/>
        <RegistrationSteps/>
        <section ref={priceSectionRef} id="precio" className="scroll-mt-24 bg-[#151C16] px-6 py-24 text-white md:px-16 md:py-32">
            <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-16">
                <div>
                    <h2 className="max-w-4xl font-display text-5xl font-black uppercase leading-[.9] tracking-tight md:text-7xl">
                        <span className="block overflow-hidden pb-[.04em]">
                            <span data-price-title-line className="block">PON TU</span>
                        </span>
                        <span className="block overflow-hidden pb-[.04em]">
                            <span data-price-title-line className="block">CANCHA</span>
                        </span>
                        <span className="block overflow-hidden pb-[.04em]">
                            <span data-price-title-line className="block text-[#6E4BFF]">A FACTURAR.</span>
                        </span>
                    </h2>
                    <p className="mt-8 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg sm:leading-8">
                        Crea tu cuenta, registra tu primer local y comienza a ordenar tus reservas desde hoy con el control total de tu complejo.
                    </p>
                </div>
                <div ref={priceOfferRef} className="flex flex-col items-start gap-6 lg:items-end lg:pt-1 lg:text-right">
                    <p className="flex items-baseline font-display text-6xl font-black leading-none tracking-tight md:text-7xl">
                        S/<span className="inline-flex tabular-nums" aria-label="80">
                            <span className="sr-only">80</span>
                            {[8, 0].map((digit, index) => (
                                <span key={index} aria-hidden="true" className="relative inline-block h-[1em] w-[0.62em] overflow-hidden">
                                    <span
                                        ref={(element) => { priceDigitRefs.current[index] = element }}
                                        className="flex flex-col leading-none"
                                    >
                                        {Array.from({ length: 51 }, (_, step) => (
                                            <span key={step} className="h-[1em] shrink-0 leading-[1em]">
                                                {(digit + step) % 10}
                                            </span>
                                        ))}
                                    </span>
                                </span>
                            ))}
                        </span><span className="ml-2 font-sans text-xl font-bold text-gray-500">/mes</span>
                    </p>
                    <p className="inline-flex min-h-12 items-center rounded-full border-2 border-black bg-[#D7FF38] px-6 py-3 text-center text-sm font-extrabold uppercase tracking-wide text-[#151C16] shadow-[4px_4px_0px_#000000] transition duration-300 hover:scale-[1.02] hover:bg-[#6E4BFF] hover:text-white">
                        14 DÍAS DE PRUEBA GRATIS
                    </p>
                    <Link href="/registro"
                          className="inline-flex min-h-14 w-full max-w-[18rem] items-center justify-center rounded-full border border-white/15 bg-[#151C16] px-8 py-4 text-base font-bold tracking-wide text-white shadow-lg transition-transform duration-300 hover:scale-[1.02] hover:bg-[#6E4BFF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#151C16]">
                        Registrar mi local
                    </Link>
                </div>
            </div>
        </section>
        <FAQSection/>
        <Footer/>
    </main>
}
