'use client'

import Image from 'next/image'
import Link from 'next/link'
import {motion, useReducedMotion} from 'motion/react'
import {HugeiconsIcon} from '@hugeicons/react'
import {
    Analytics01Icon,
    ArrowDown01Icon,
    ArrowDownRight01Icon,
    ArrowRight01Icon,
    Calendar03Icon,
    Cancel01Icon,
    Clock01Icon,
    DashboardSquare01Icon,
    Location01Icon,
    Menu01Icon,
    SmartPhone01Icon,
    SparklesIcon,
    Store01Icon,
    Tick02Icon,
} from '@hugeicons/core-free-icons'
import {useState, type MouseEvent} from 'react'
import {GrasslyMark} from '@/components/brand/grassly-mark'

const reveal = {hidden: {opacity: 0, y: 28}, visible: {opacity: 1, y: 0}}

const features = [
    {
        number: '01',
        icon: Calendar03Icon,
        title: 'Reservas sin cruces',
        text: 'Visualiza cada horario, cancha y estado en un calendario vivo. Menos llamadas, cero doble reserva.',
    },
    {
        number: '02',
        icon: Store01Icon,
        title: 'Un panel para todos tus locales',
        text: 'Administra una cancha hoy o una red completa mañana, sin perder el control de cada sede.',
    },
    {
        number: '03',
        icon: Analytics01Icon,
        title: 'Decisiones con datos',
        text: 'Identifica horas pico, canchas más solicitadas, recurrencia y el movimiento real de tu negocio.',
    },
]

function SpotlightCard({children, className = ''}: { children: React.ReactNode; className?: string }) {
    const onMove = (event: MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect()
        event.currentTarget.style.setProperty('--x', `${event.clientX - rect.left}px`)
        event.currentTarget.style.setProperty('--y', `${event.clientY - rect.top}px`)
    }
    return <div onMouseMove={onMove} className={`spotlight-card ${className}`}>{children}</div>
}

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false)
    const reduceMotion = useReducedMotion()
    const scrollTo = (id: string) => {
        setMenuOpen(false)
        document.querySelector(id)?.scrollIntoView({behavior: 'smooth'})
    }

    return <main className="site-shell overflow-hidden bg-background text-foreground">
        <section className="hero-grid relative min-h-[800px] overflow-hidden bg-sidebar text-sidebar-foreground sm:min-h-[860px]">
            <div className="hero-noise"/>
            <div className="absolute -right-52 top-[-12rem] h-[44rem] w-[44rem] rounded-full border border-sidebar-foreground/10"/>
            <div className="absolute right-[-5rem] top-[-2rem] h-[36rem] w-[36rem] rounded-full border border-primary/35"/>
            <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-sidebar to-transparent"/>
            <Image src="/balon.png" alt="" width={260} height={260} loading="eager" aria-hidden
                   className="hero-ball pointer-events-none absolute -bottom-12 right-[4%] z-[1] hidden w-40 opacity-70 mix-blend-screen sm:block lg:w-56"/>
            <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
                <Link href="/" aria-label="Grassly - Inicio" className="py-1">
                    <GrasslyMark inverted className="text-lg sm:text-xl"/>
                </Link>
                <nav className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/70 md:flex">
                    <button onClick={() => scrollTo('#beneficios')} className="transition hover:text-primary">Beneficios</button>
                    <button onClick={() => scrollTo('#panel')} className="transition hover:text-primary">El sistema</button>
                    <button onClick={() => scrollTo('#app')} className="transition hover:text-primary">App pública</button>
                </nav>
                <Link href="/registro"
                      className="hidden rounded-full bg-primary px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-sidebar-foreground md:block">
                    Registra tu grass <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-1 inline size-3.5"/>
                </Link>
                <button onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                        className="rounded-full border border-sidebar-foreground/15 p-2.5 md:hidden">
                    <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} strokeWidth={2} className="size-5"/>
                </button>
            </header>
            {menuOpen && <div className="absolute left-4 right-4 top-20 z-30 rounded-3xl border border-sidebar-foreground/10 bg-secondary p-5 shadow-floating md:hidden">
                <div className="flex flex-col gap-1 text-sm font-bold">
                    <button onClick={() => scrollTo('#beneficios')} className="rounded-xl px-3 py-3 text-left hover:bg-sidebar-foreground/10">Beneficios</button>
                    <button onClick={() => scrollTo('#panel')} className="rounded-xl px-3 py-3 text-left hover:bg-sidebar-foreground/10">El sistema</button>
                    <button onClick={() => scrollTo('#app')} className="rounded-xl px-3 py-3 text-left hover:bg-sidebar-foreground/10">App pública</button>
                    <Link href="/registro" className="mt-2 rounded-xl bg-primary px-3 py-3 text-center text-xs uppercase tracking-wider text-primary-foreground">Registra tu grass</Link>
                </div>
            </div>}
            <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-12 lg:grid-cols-[1.03fr_.97fr] lg:px-8 lg:pb-28 lg:pt-24">
                <motion.div initial="hidden" animate="visible"
                            variants={{visible: {transition: {staggerChildren: 0.12}}}}
                            className="flex flex-col justify-center">
                    <motion.div variants={reveal}
                                className="mb-7 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
                        <span className="h-px w-8 bg-primary"/> Mejora tu servicio hoy
                    </motion.div>
                    <motion.h1 variants={reveal}
                               className="max-w-3xl text-balance text-[clamp(3.7rem,8.2vw,7.2rem)] font-black uppercase leading-[0.88] tracking-[-0.025em]">
                        Tu cancha.<br/><span className="text-primary">Tu control.</span><br/>Tu mejor juego.
                    </motion.h1>
                    <motion.p variants={reveal}
                              className="mt-8 max-w-lg text-pretty text-base leading-7 text-sidebar-foreground/70 sm:text-lg">
                        La plataforma que convierte tus cuadernos y mensajes dispersos en una operación clara, ágil y lista para crecer.
                    </motion.p>
                    <motion.div variants={reveal} className="mt-9 flex flex-wrap gap-3">
                        <Link href="/registro"
                              className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-4 text-xs font-extrabold uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-sidebar-foreground">
                            Empieza con tu local <HugeiconsIcon icon={ArrowDownRight01Icon} strokeWidth={2} className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"/>
                        </Link>
                        <button onClick={() => scrollTo('#beneficios')}
                                className="inline-flex items-center gap-2 rounded-full border border-sidebar-foreground/20 px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] transition hover:border-sidebar-foreground hover:bg-sidebar-foreground/10">
                            Conoce más <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4"/>
                        </button>
                    </motion.div>
                </motion.div>
                <motion.div initial={reduceMotion ? false : {opacity: 0, x: 42, rotate: 3}}
                            animate={reduceMotion ? undefined : {opacity: 1, x: 0, rotate: -3}}
                            transition={{duration: 0.8, ease: 'easeOut'}}
                            className="relative mx-auto w-full max-w-[580px] lg:mt-4">
                    <div className="absolute -left-6 top-16 h-24 w-24 rounded-full bg-primary/25 blur-3xl"/>
                    <div className="dashboard-screen relative rounded-[2rem] border border-sidebar-foreground/15 bg-surface p-3 shadow-floating sm:p-4">
                        <div className="overflow-hidden rounded-[1.45rem] bg-muted p-4 text-foreground sm:p-5">
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div className="flex items-center gap-2.5">
                                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary">
                                        <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} className="size-4"/>
                                    </span>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider">Grassly</p>
                                        <p className="text-[9px] text-muted-foreground">Panel de reservas</p>
                                    </div>
                                </div>
                                <div className="h-7 w-7 rounded-full bg-primary"/>
                            </div>
                            <div className="mt-5 grid grid-cols-3 gap-2.5">
                                {[['S/ 2,840', 'Ingresos'], ['48', 'Reservas'], ['87%', 'Ocupación']].map(([value, label], index) =>
                                    <div key={label} className={index === 1 ? 'rounded-xl bg-secondary p-3 text-secondary-foreground' : 'rounded-xl bg-card p-3'}>
                                        <p className="text-base font-black">{value}</p>
                                        <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                                    </div>)}
                            </div>
                            <div className="mt-5 rounded-xl bg-card p-3.5">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-[10px] font-black">Agenda de hoy</p>
                                    <p className="text-[9px] font-bold text-success-foreground">12 reservas</p>
                                </div>
                                {[['17:00', 'Fútbol 6 · Cancha A', 'Confirmada'], ['18:30', 'Fútbol 7 · Cancha B', 'Confirmada'], ['20:00', 'Fútbol 6 · Cancha A', 'Pendiente']].map(([hour, match, status]) =>
                                    <div key={hour} className="flex items-center gap-2 border-t border-muted py-2.5">
                                        <span className="w-8 text-[9px] font-black">{hour}</span>
                                        <span className="h-5 w-1 rounded-full bg-primary"/>
                                        <span className="flex-1 text-[9px] font-semibold text-muted-foreground">{match}</span>
                                        <span className={status === 'Pendiente' ? 'rounded-full bg-warning px-2 py-1 text-[8px] font-bold text-warning-foreground' : 'rounded-full bg-accent px-2 py-1 text-[8px] font-bold text-success-foreground'}>{status}</span>
                                    </div>)}
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-5 -left-2 rounded-2xl border border-sidebar-foreground/10 bg-secondary px-4 py-3 shadow-xl sm:-left-8">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-secondary-foreground/55">Próxima reserva</p>
                        <p className="mt-1 flex items-center gap-2 text-xs font-bold">
                            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5 text-primary"/> Hoy · 18:30
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
        <section className="border-b border-border bg-background py-5">
            <div className="ticker-track flex min-w-max items-center gap-9 text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
                {Array.from({length: 2}).flatMap((_, group) => ['Reservas claras', 'Más control', 'Menos llamadas', 'Mejores decisiones', 'Todo tu negocio'].map((item) =>
                    <span key={`${group}-${item}`} className="flex items-center gap-9">
                        <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3.5 text-primary"/> {item}
                    </span>))}
            </div>
        </section>
        <section id="beneficios" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
            <motion.div initial="hidden" whileInView="visible" viewport={{once: true, amount: .25}} variants={reveal}
                        className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
                <div>
                    <p className="eyebrow">Deja que el sistema juegue a tu favor</p>
                    <h2 className="section-title mt-5">Menos tareas<br/>manuales. <em>Más cancha.</em></h2>
                </div>
                <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                    Tú conoces a tus clientes y tu negocio. Grassly se encarga del orden detrás de cada reserva para que puedas concentrarte en hacerlo crecer.
                </p>
            </motion.div>
            <div className="mt-14 grid gap-4 lg:grid-cols-3">{features.map((feature, index) => {
                return <motion.div key={feature.number} initial="hidden" whileInView="visible"
                                   viewport={{once: true, amount: .2}} variants={reveal}
                                   transition={{delay: index * .08}}>
                    <SpotlightCard className="min-h-[320px] rounded-[1.7rem] border border-border bg-card p-7">
                        <div className="relative z-10 flex h-full flex-col">
                            <div className="flex items-start justify-between">
                                <span className="text-xs font-black text-primary">{feature.number}</span>
                                <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-success-foreground">
                                    <HugeiconsIcon icon={feature.icon} strokeWidth={2} className="size-5"/>
                                </span>
                            </div>
                            <div className="mt-auto">
                                <h3 className="text-2xl font-black tracking-[-.045em]">{feature.title}</h3>
                                <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">{feature.text}</p>
                            </div>
                        </div>
                    </SpotlightCard>
                </motion.div>
            })}</div>
        </section>
        <section id="panel" className="relative overflow-hidden bg-surface py-24 lg:py-32">
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                <Image src="/cancha.png" alt="" fill sizes="100vw" className="object-cover opacity-[.16] mix-blend-multiply"/>
                <div className="absolute inset-0 bg-surface/55"/>
            </div>
            <div className="absolute left-[7%] top-0 h-full border-l border-dashed border-border"/>
            <div className="absolute right-[12%] top-0 h-full border-l border-dashed border-border"/>
            <div className="relative mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8">
                <motion.div initial="hidden" whileInView="visible" viewport={{once: true, amount: .2}} variants={reveal}
                            className="order-2 lg:order-1">
                    <div className="rounded-[2rem] border-[10px] border-secondary bg-card p-5 shadow-[20px_25px_0_var(--primary)] sm:p-7">
                        <div className="flex items-center justify-between border-b border-border pb-5">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[.14em] text-muted-foreground">Análisis de ocupación</p>
                                <h3 className="mt-1 text-xl font-black">Tu semana en un vistazo</h3>
                            </div>
                            <span className="rounded-full bg-accent px-3 py-1.5 text-[9px] font-bold text-success-foreground">+18.4% este mes</span>
                        </div>
                        <div className="mt-8 flex h-40 items-end gap-2 sm:gap-3">
                            {[36, 48, 39, 65, 58, 88, 72].map((height, index) =>
                                <div key={height} className="flex flex-1 flex-col items-center gap-2">
                                    <div style={{height: `${height}%`}}
                                         className={index === 5 ? 'w-full rounded-t-lg bg-primary' : 'w-full rounded-t-lg bg-muted'}/>
                                    <span className="text-[9px] font-bold text-muted-foreground">{['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}</span>
                                </div>)}
                        </div>
                        <div className="mt-7 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-surface p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Hora favorita</p>
                                <p className="mt-1 text-lg font-black">7:00 PM</p>
                            </div>
                            <div className="rounded-xl bg-surface p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Cancha activa</p>
                                <p className="mt-1 text-lg font-black">Fútbol 7</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
                <motion.div initial="hidden" whileInView="visible" viewport={{once: true, amount: .2}} variants={reveal}
                            className="order-1 lg:order-2">
                    <p className="eyebrow">Operación que se entiende</p>
                    <h2 className="section-title mt-5">Tu negocio deja de ser una intuición.</h2>
                    <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
                        Mira lo que ocurre antes de que termine el día. Desde el estado de cada cancha hasta las horas que merecen una promoción.
                    </p>
                    <ul className="mt-8 space-y-4">
                        {['Calendario inteligente por cancha y sede', 'Estados de reserva para actuar a tiempo', 'Reportes que muestran lo que funciona'].map((item) =>
                            <li key={item} className="flex items-center gap-3 text-sm font-bold">
                                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3.5"/>
                                </span>
                                {item}
                            </li>)}
                    </ul>
                </motion.div>
            </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
            <div className="relative overflow-hidden rounded-[2rem] bg-sidebar p-7 text-sidebar-foreground sm:p-12 lg:p-16">
                <Image src="/balon.png" alt="" width={280} height={280} aria-hidden
                       className="pointer-events-none absolute -right-10 -top-12 w-40 opacity-20 mix-blend-screen sm:w-56"/>
                <div className="relative">
                    <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
                        <div>
                            <p className="eyebrow text-primary">Todo conectado</p>
                            <h2 className="mt-5 text-balance text-4xl font-black uppercase leading-[.94] tracking-[-.025em] sm:text-6xl">
                                Un local o tres.<br/>El orden es el mismo.
                            </h2>
                        </div>
                        <p className="max-w-xl text-lg leading-8 text-sidebar-foreground/70">
                            Cada sede conserva su propia agenda, equipo y horarios. Tú mantienes la lectura completa de tu negocio desde un solo lugar.
                        </p>
                    </div>
                    <div className="mt-12 grid gap-3 md:grid-cols-3">
                        {[['01', 'Sedes', 'Organiza cada local con su propia identidad.'], ['02', 'Canchas', 'Administra tipos, tarifas y disponibilidad.'], ['03', 'Equipo', 'Da visibilidad a quien atiende las reservas.']].map(([number, title, text]) =>
                            <div key={number} className="rounded-2xl border border-sidebar-foreground/10 bg-sidebar-foreground/[.06] p-5">
                                <p className="text-xs font-black text-primary">{number}</p>
                                <h3 className="mt-9 text-lg font-black">{title}</h3>
                                <p className="mt-2 text-sm leading-6 text-sidebar-foreground/70">{text}</p>
                            </div>)}
                    </div>
                </div>
            </div>
        </section>
        <section id="app" className="relative overflow-hidden bg-primary px-5 py-24 lg:px-8 lg:py-32">
            <div className="absolute right-[-4rem] top-[-8rem] text-[26rem] font-black leading-none tracking-[-.04em] text-primary-foreground/10">G</div>
            <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
                <motion.div initial="hidden" whileInView="visible" viewport={{once: true, amount: .2}} variants={reveal}>
                    <p className="eyebrow text-primary-foreground">Una vitrina para tu local</p>
                    <h2 className="mt-5 max-w-xl text-balance text-5xl font-black uppercase leading-[.92] tracking-[-.025em] text-primary-foreground sm:text-7xl">
                        Tus canchas también se encuentran.
                    </h2>
                    <p className="mt-7 max-w-md text-lg leading-8 text-primary-foreground/80">
                        Próximamente, los jugadores podrán descubrir locales afiliados, consultar disponibilidad y reservar desde la app Grassly.
                    </p>
                    <div className="mt-8 flex items-center gap-3 text-sm font-bold text-primary-foreground">
                        <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-5"/> Una app para tus clientes. Un flujo para tu negocio.
                    </div>
                </motion.div>
                <motion.div initial={reduceMotion ? false : {opacity: 0, y: 32}}
                            whileInView={reduceMotion ? undefined : {opacity: 1, y: 0}}
                            viewport={{once: true, amount: .2}}
                            className="mx-auto w-full max-w-[390px] rounded-[2.8rem] border-[8px] border-secondary bg-background p-3 shadow-[16px_18px_0_var(--secondary)]">
                    <div className="min-h-[450px] rounded-[2.1rem] bg-surface p-5">
                        <div className="mx-auto h-1.5 w-20 rounded-full bg-secondary"/>
                        <div className="mt-7 flex items-center justify-between">
                            <p className="text-sm font-black">Canchas cerca de ti</p>
                            <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 text-success-foreground"/>
                        </div>
                        <div className="mt-5 rounded-2xl bg-secondary p-4 text-secondary-foreground">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-primary">Espacio para imagen</p>
                            <p className="mt-8 text-lg font-black">Tu foto del local<br/>o cancha principal</p>
                        </div>
                        <div className="mt-4 rounded-2xl bg-card p-4">
                            <p className="text-xs font-black">Grass Los Libertadores</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">Ayacucho · Fútbol 7</p>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-success-foreground">Disponible hoy</span>
                                <span className="rounded-full bg-primary px-3 py-1.5 text-[9px] font-black text-primary-foreground">Ver horarios</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
        <section className="bg-background px-5 py-24 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <SpotlightCard className="rounded-[2rem] bg-card p-8 ring-1 ring-border sm:p-14">
                    <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div>
                            <p className="eyebrow">El partido empieza aquí</p>
                            <h2 className="section-title mt-5">Haz que tu local juegue en primera.</h2>
                            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                                Crea tu cuenta, registra tu primer local y comienza a ordenar tus reservas desde hoy.
                            </p>
                        </div>
                        <Link href="/registro"
                              className="group inline-flex w-fit items-center gap-3 rounded-full bg-secondary px-7 py-4 text-xs font-extrabold uppercase tracking-[.13em] text-secondary-foreground transition hover:bg-primary hover:text-primary-foreground">
                            Registrar mi grass <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 transition-transform group-hover:translate-x-1"/>
                        </Link>
                    </div>
                </SpotlightCard>
            </div>
        </section>
        <footer className="bg-sidebar px-5 py-10 text-sidebar-foreground lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                <GrasslyMark inverted className="text-base"/>
                <p className="text-xs text-sidebar-foreground/45">© {new Date().getFullYear()} Grassly · Ayacucho, Perú</p>
                <Link href="/registro" className="text-xs font-bold text-primary transition hover:text-sidebar-foreground">Registra tu local →</Link>
            </div>
        </footer>
    </main>
}
