'use client'

import Link from 'next/link'
import {AppShowcase} from '@/components/app-showcase'
import {PanelShowcase} from '@/components/panel-showcase'
import {LocalesTree} from '@/components/locales-tree'
import {PaymentsFlow} from '@/components/payments-flow'
import {RegistrationSteps} from '@/components/registration-steps'
import {Footer} from '@/components/footer'
import {FeaturesBento} from '@/components/features-bento'
import {MagazineHero} from '@/components/magazine-hero'

export default function LandingPage() {
    return <main className="site-shell overflow-x-clip bg-background text-foreground">
        <MagazineHero/>
        <FeaturesBento/>
        <PaymentsFlow/>
        <PanelShowcase/>
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
            <div className="relative overflow-hidden rounded-[2rem] bg-sidebar p-7 text-sidebar-foreground sm:p-12 lg:p-16">
                <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
                    <div>
                        <h2 className="text-balance font-display text-4xl font-black uppercase leading-[.92] tracking-[-.022em] sm:text-6xl">
                            Un local o tres.<br/>El orden es el mismo.
                        </h2>
                        <p className="mt-6 max-w-xl text-lg leading-8 text-sidebar-foreground/70">
                            Cada sede conserva su propia agenda, equipo y horarios. Tú mantienes la lectura completa de tu negocio desde un solo lugar.
                        </p>
                    </div>
                    <LocalesTree/>
                </div>
            </div>
        </section>
        <AppShowcase/>
        <RegistrationSteps/>
        <section id="precio" className="scroll-mt-24 bg-[#f4f5ef] px-5 py-24 text-[#151c16] sm:py-28 lg:px-8 lg:py-36">
            <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-16">
                <div>
                    <h2 className="max-w-4xl font-display text-[clamp(3.5rem,9vw,8rem)] font-black uppercase leading-[.82] tracking-[-.035em]">
                        PON TU<br/>CANCHA<br/>A FACTURAR.
                    </h2>
                    <p className="mt-8 max-w-2xl text-base leading-7 text-[#39443b] sm:text-lg sm:leading-8">
                        Crea tu cuenta, registra tu primer local y comienza a ordenar tus reservas desde hoy con el control total de tu complejo.
                    </p>
                </div>
                <div className="flex flex-col items-start gap-6 lg:items-end lg:pt-1 lg:text-right">
                    <p className="flex items-baseline font-display text-[clamp(4.5rem,8vw,6.5rem)] font-black leading-none tracking-[-.045em]">
                        S/ 80<span className="ml-1 font-sans text-xl font-extrabold tracking-[-.04em] text-[#39443b] sm:text-2xl">/mes</span>
                    </p>
                    <p className="inline-flex min-h-12 items-center rounded-full border-2 border-[#151c16] bg-[#D7FF38] px-5 py-2 text-center text-xs font-extrabold uppercase tracking-[.08em] shadow-[5px_5px_0_#151c16] sm:text-sm">
                        14 DÍAS DE PRUEBA GRATIS
                    </p>
                    <Link href="/registro"
                          className="inline-flex min-h-14 w-full max-w-[18rem] items-center justify-center rounded-full bg-[#151c16] px-7 py-4 text-sm font-extrabold text-[#f4f5ef] transition-colors hover:bg-[#26352a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D7FF38] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f4f5ef]">
                        Registrar mi local
                    </Link>
                </div>
            </div>
        </section>
        <Footer/>
    </main>
}
