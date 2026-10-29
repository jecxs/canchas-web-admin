'use client'

import Image from 'next/image'
import Link from 'next/link'
import {motion} from 'motion/react'
import {HugeiconsIcon} from '@hugeicons/react'
import {
    Analytics01Icon,
    ArrowDown01Icon,
    ArrowDownRight01Icon,
    ArrowRight01Icon,
    Calendar03Icon,
    Cancel01Icon,
    Menu01Icon,
    Store01Icon,
} from '@hugeicons/core-free-icons'
import {useState} from 'react'
import {GrasslyMark} from '@/components/brand/grassly-mark'
import {AppShowcase} from '@/components/app-showcase'
import {PanelShowcase} from '@/components/panel-showcase'
import {LocalesTree} from '@/components/locales-tree'
import {PaymentsFlow} from '@/components/payments-flow'

const reveal = {hidden: {opacity: 0, y: 28}, visible: {opacity: 1, y: 0}}

const features = [
    {
        icon: Calendar03Icon,
        title: 'Reservas sin cruces',
        text: 'Visualiza cada horario, cancha y estado en un calendario vivo. Menos llamadas, cero doble reserva.',
    },
    {
        icon: Store01Icon,
        title: 'Un panel para todos tus locales',
        text: 'Administra una cancha hoy o una red completa mañana, sin perder el control de cada sede.',
    },
    {
        icon: Analytics01Icon,
        title: 'Decisiones con datos',
        text: 'Mira cuánto cobraste, cuánto te falta por cobrar y qué reservas se completaron.',
    },
]

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false)
    const scrollTo = (id: string) => {
        setMenuOpen(false)
        document.querySelector(id)?.scrollIntoView({behavior: 'smooth'})
    }

    return <main className="site-shell overflow-x-clip bg-background text-foreground">
        <section className="hero-grid relative flex min-h-[100svh] flex-col overflow-hidden bg-sidebar pt-20 text-sidebar-foreground">
            <div className="hero-noise"/>
            <div className="absolute -right-52 top-[-12rem] h-[44rem] w-[44rem] rounded-full border border-sidebar-foreground/10"/>
            <div className="absolute right-[-5rem] top-[-2rem] h-[36rem] w-[36rem] rounded-full border border-primary/35"/>
            <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-sidebar to-transparent"/>
            <header className="fixed inset-x-0 top-0 z-50 border-b border-sidebar-foreground/10 bg-sidebar/85 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
                <Link href="/" aria-label="Grassly - Inicio" className="py-1">
                    <GrasslyMark inverted className="text-lg sm:text-xl"/>
                </Link>
                <nav className="hidden items-center gap-10 font-display text-base tracking-[0.01em] text-white/85 md:flex lg:text-lg">
                    <button onClick={() => scrollTo('#beneficios')} className="leading-none transition duration-150 hover:text-white hover:underline hover:decoration-primary hover:decoration-2 hover:underline-offset-8">Beneficios</button>
                    <button onClick={() => scrollTo('#panel')} className="leading-none transition duration-150 hover:text-white hover:underline hover:decoration-primary hover:decoration-2 hover:underline-offset-8">El sistema</button>
                    <button onClick={() => scrollTo('#app')} className="leading-none transition duration-150 hover:text-white hover:underline hover:decoration-primary hover:decoration-2 hover:underline-offset-8">App móvil</button>
                    <button onClick={() => scrollTo('#precio')} className="leading-none transition duration-150 hover:text-white hover:underline hover:decoration-primary hover:decoration-2 hover:underline-offset-8">Precio</button>
                </nav>
                <div className="hidden items-center gap-2 md:flex">
                    <Link href="/registro"
                          className="rounded-full border border-sidebar-foreground/20 px-5 py-3 font-display text-base font-semibold leading-none text-sidebar-foreground transition hover:border-primary hover:text-primary lg:text-lg">
                        Iniciar sesión
                    </Link>
                    <Link href="/registro"
                          className="rounded-full bg-primary px-5 py-3 font-display text-base font-semibold leading-none text-primary-foreground transition hover:bg-sidebar-foreground lg:text-lg">
                        Registra tu local <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-1 inline size-3.5"/>
                    </Link>
                </div>
                <button onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                        className="rounded-full border border-sidebar-foreground/15 p-2.5 md:hidden">
                    <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} strokeWidth={2} className="size-5"/>
                </button>
                </div>
            </header>
            {menuOpen && <div className="fixed left-4 right-4 top-[4.5rem] z-40 rounded-3xl border border-sidebar-foreground/10 bg-secondary p-5 shadow-floating md:hidden">
                <div className="flex flex-col gap-1 font-display text-2xl font-bold">
                    <button onClick={() => scrollTo('#beneficios')} className="rounded-xl px-3 py-3 text-left hover:bg-sidebar-foreground/10">Beneficios</button>
                    <button onClick={() => scrollTo('#panel')} className="rounded-xl px-3 py-3 text-left hover:bg-sidebar-foreground/10">El sistema</button>
                    <button onClick={() => scrollTo('#app')} className="rounded-xl px-3 py-3 text-left hover:bg-sidebar-foreground/10">App móvil</button>
                    <button onClick={() => scrollTo('#precio')} className="rounded-xl px-3 py-3 text-left hover:bg-sidebar-foreground/10">Precio</button>
                    <div className="mt-2 grid gap-2">
                        <Link href="/registro" className="rounded-xl border border-sidebar-foreground/20 px-3 py-3 text-center text-base font-bold">Iniciar sesión</Link>
                        <Link href="/registro" className="rounded-xl bg-primary px-3 py-3 text-center text-base text-primary-foreground">Registra tu local</Link>
                    </div>
                </div>
            </div>}
            <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:pb-20 lg:pt-10">
                <motion.div initial="hidden" animate="visible"
                            variants={{visible: {transition: {staggerChildren: 0.12}}}}
                            className="flex flex-col justify-center">
                    <motion.h1 variants={reveal}
                               className="max-w-3xl text-balance text-[clamp(3rem,6vw,6rem)] font-black uppercase leading-[0.92] tracking-[-0.025em]">
                        Tu cancha.<br/>Tu control.
                    </motion.h1>
                    <motion.p variants={reveal}
                              className="mt-8 max-w-lg text-pretty text-base leading-7 text-sidebar-foreground/70 sm:text-lg">
                        Agenda, cobros y tarifas de tus canchas, sin cuadernos ni mensajes sueltos.
                    </motion.p>
                    <motion.div variants={reveal} className="mt-9 flex flex-wrap gap-3">
                        <Link href="/registro"
                              className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-4 text-xs font-extrabold text-primary-foreground transition hover:bg-sidebar-foreground">
                            Registra tu local <HugeiconsIcon icon={ArrowDownRight01Icon} strokeWidth={2} className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"/>
                        </Link>
                        <button onClick={() => scrollTo('#beneficios')}
                                className="inline-flex items-center gap-2 rounded-full border border-sidebar-foreground/20 px-6 py-4 text-xs font-bold transition hover:border-sidebar-foreground hover:bg-sidebar-foreground/10">
                            Conoce más <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4"/>
                        </button>
                    </motion.div>
                </motion.div>
                <motion.div initial={{opacity: 0, x: 42}}
                            animate={{opacity: 1, x: 0}}
                            transition={{duration: 0.8, ease: 'easeOut'}}
                            className="relative mx-auto w-full max-w-[640px] [perspective:1400px] lg:mt-4">
                    <div className="absolute -left-6 top-16 h-24 w-24 rounded-full bg-primary/25 blur-3xl"/>
                    <svg aria-hidden="true" viewBox="0 0 600 400" fill="none" preserveAspectRatio="none"
                         className="absolute -inset-5 text-primary opacity-[.08]">
                        <rect x="6" y="6" width="588" height="388" rx="8" stroke="currentColor" strokeWidth="4"/>
                        <line x1="300" y1="6" x2="300" y2="394" stroke="currentColor" strokeWidth="4"/>
                        <circle cx="300" cy="200" r="72" stroke="currentColor" strokeWidth="4"/>
                    </svg>
                    <div
                        className="relative overflow-hidden rounded-2xl border border-white/10 shadow-floating transition-transform duration-300 ease-out lg:[transform:rotateY(-6deg)] lg:hover:[transform:rotateY(0deg)]">
                        <div className="flex items-center gap-3 bg-sidebar px-4 py-3">
                            <span aria-hidden="true" className="flex gap-1.5">
                                <span className="size-2.5 rounded-full bg-sidebar-foreground/30"/>
                                <span className="size-2.5 rounded-full bg-sidebar-foreground/30"/>
                                <span className="size-2.5 rounded-full bg-sidebar-foreground/30"/>
                            </span>
                            <span className="truncate font-mono text-xs text-sidebar-foreground/70">grassly.app/agenda</span>
                        </div>
                        <Image src="/landing/capAgenda.png" alt="Agenda de reservas del dueño en Grassly"
                               width={2880} height={1800} priority
                               sizes="(min-width: 1024px) 640px, 100vw"
                               className="block h-auto w-full"/>
                    </div>
                </motion.div>
            </div>
        </section>
        <section id="beneficios" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
            <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
                <div>
                    <h2 className="section-title">Menos tareas<br/>manuales. Más cancha.</h2>
                </div>
                <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                    Tú conoces a tus clientes y tu negocio. Grassly se encarga del orden detrás de cada reserva para que puedas concentrarte en hacerlo crecer.
                </p>
            </div>
            <div className="mt-14 grid gap-4 lg:grid-cols-2">
                <div className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-floating lg:row-span-2">
                    <div className="flex items-start gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-success-foreground">
                            <HugeiconsIcon icon={features[0].icon} strokeWidth={2} className="size-5"/>
                        </span>
                        <div>
                            <h3 className="text-2xl font-black tracking-[-.045em]">{features[0].title}</h3>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{features[0].text}</p>
                        </div>
                    </div>
                    <div className="relative mt-auto h-64 overflow-hidden rounded-2xl border border-border lg:h-72">
                        <Image src="/landing/capAgenda.png" alt="Agenda de reservas por cancha y horario" fill
                               sizes="(min-width:1024px) 640px, 100vw"
                               className="object-cover object-left-top"/>
                    </div>
                </div>
                {features.slice(1).map((feature) =>
                    <div key={feature.title} className="rounded-2xl border border-border bg-card p-7">
                        <div className="flex items-start gap-4">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-success-foreground">
                                <HugeiconsIcon icon={feature.icon} strokeWidth={2} className="size-5"/>
                            </span>
                            <div>
                                <h3 className="text-2xl font-black tracking-[-.045em]">{feature.title}</h3>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                            </div>
                        </div>
                    </div>)}
            </div>
        </section>
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
        <section id="precio" className="scroll-mt-24 bg-background px-5 py-24 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="rounded-[2rem] bg-card p-8 ring-1 ring-border sm:p-14">
                    <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-16">
                        <div>
                            <h2 className="section-title">S/ 80 al mes. Los primeros 14 días son gratis.</h2>
                            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                                Crea tu cuenta, registra tu primer local y comienza a ordenar tus reservas desde hoy.
                            </p>
                            <ol className="mt-9 grid gap-6 sm:grid-cols-3">
                                {[['Crear cuenta', 'Entras con tu cuenta de Google y listo.'],
                                    ['Registrar local', 'Nos cuentas el nombre, la dirección y el contacto de tu local.'],
                                    ['Aprobamos tu local', 'Recibimos tu solicitud y la revisamos antes de activarlo.'],
                                    ['Empezar a operar', 'Defines canchas y tarifas y empiezas a recibir reservas.']].map(([title, text], index) =>
                                    <li key={title} className="border-t border-border pt-4">
                                        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">{index + 1}</span>
                                        <h3 className="mt-3 text-base font-black">{title}</h3>
                                        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{text}</p>
                                    </li>)}
                            </ol>
                        </div>
                        <div className="lg:text-right">
                            <p className="font-display text-7xl font-black leading-none tracking-[-.03em]">
                                S/ 80<span className="text-3xl">/mes</span>
                            </p>
                            <p className="mt-3 inline-flex rounded-full bg-accent px-3 py-1.5 text-xs font-black text-success-foreground">
                                14 días de prueba gratis
                            </p>
                            <div className="mt-7">
                                <Link href="/registro"
                                      className="group inline-flex w-fit items-center gap-3 rounded-full bg-secondary px-7 py-4 text-xs font-extrabold uppercase tracking-[.13em] text-secondary-foreground transition hover:bg-primary hover:text-primary-foreground">
                                    Registra tu local <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 transition-transform group-hover:translate-x-1"/>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <footer className="bg-sidebar px-5 py-10 text-sidebar-foreground lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                <GrasslyMark inverted className="text-base"/>
                <p className="text-xs text-sidebar-foreground/45">© {new Date().getFullYear()} Grassly · Ayacucho, Perú</p>
                <Link href="/registro" className="text-xs font-bold text-primary transition hover:text-sidebar-foreground">Registra tu local</Link>
            </div>
        </footer>
    </main>
}
