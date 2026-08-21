'use client'

import Image from 'next/image'
import Link from 'next/link'
import {motion, useReducedMotion} from 'motion/react'
import {
    ArrowDownRight,
    ArrowRight,
    BarChart3,
    CalendarDays,
    Check,
    ChevronDown,
    Clock3,
    LayoutDashboard,
    MapPin,
    Menu,
    Smartphone,
    Sparkles,
    Store,
    X
} from 'lucide-react'
import {useState, type MouseEvent} from 'react'

const reveal = {hidden: {opacity: 0, y: 28}, visible: {opacity: 1, y: 0}}

const features = [
    {
        number: '01',
        icon: CalendarDays,
        title: 'Reservas sin cruces',
        text: 'Visualiza cada horario, cancha y estado en un calendario vivo. Menos llamadas, cero doble reserva.'
    },
    {
        number: '02',
        icon: Store,
        title: 'Un panel para todos tus locales',
        text: 'Administra una cancha hoy o una red completa mañana, sin perder el control de cada sede.'
    },
    {
        number: '03',
        icon: BarChart3,
        title: 'Decisiones con datos',
        text: 'Identifica horas pico, canchas más solicitadas, recurrencia y el movimiento real de tu negocio.'
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
        setMenuOpen(false);
        document.querySelector(id)?.scrollIntoView({behavior: 'smooth'})
    }

    return <main className="site-shell overflow-hidden bg-[#f6f8f5] text-[#081d38]">
        <section className="hero-grid relative min-h-[800px] overflow-hidden bg-[#071f3b] text-white sm:min-h-[860px]">
            <div className="hero-noise"/>
            <div className="absolute -right-52 top-[-12rem] h-[44rem] w-[44rem] rounded-full border border-white/10"/>
            <div
                className="absolute right-[-5rem] top-[-2rem] h-[36rem] w-[36rem] rounded-full border border-[#8bd43d]/35"/>
            <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#071f3b] to-transparent"/>
            <Image src="/balon.png" alt="" width={260} height={260} aria-hidden
                   className="hero-ball pointer-events-none absolute -bottom-12 right-[4%] z-[1] hidden w-40 opacity-70 mix-blend-screen sm:block lg:w-56"/>
            <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
                <Link href="/" aria-label="Tu Cancha - Inicio"
                      className="relative block h-30 w-60 sm:h-20 sm:w-44"><Image src="/logo.png" alt="Tu Cancha" fill
                                                                                  className="object-contain object-left"
                                                                                  priority/></Link>
                <nav
                    className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-[0.15em] text-white/70 md:flex">
                    <button onClick={() => scrollTo('#beneficios')}
                            className="transition hover:text-[#9add3c]">Beneficios
                    </button>
                    <button onClick={() => scrollTo('#panel')} className="transition hover:text-[#9add3c]">El sistema
                    </button>
                    <button onClick={() => scrollTo('#app')} className="transition hover:text-[#9add3c]">App pública
                    </button>
                </nav>
                <Link href="/registro"
                      className="hidden rounded-full bg-[#9add3c] px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#08203a] transition hover:bg-white md:block">Registra
                    tu grass <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></Link>
                <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú"
                        className="rounded-full border border-white/15 p-2.5 md:hidden">{menuOpen ?
                    <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}</button>
            </header>
            {menuOpen && <div
                className="absolute left-4 right-4 top-20 z-30 rounded-3xl border border-white/10 bg-[#0b294b] p-5 shadow-2xl md:hidden">
                <div className="flex flex-col gap-1 text-sm font-bold">
                    <button onClick={() => scrollTo('#beneficios')}
                            className="rounded-xl px-3 py-3 text-left hover:bg-white/10">Beneficios
                    </button>
                    <button onClick={() => scrollTo('#panel')}
                            className="rounded-xl px-3 py-3 text-left hover:bg-white/10">El sistema
                    </button>
                    <button onClick={() => scrollTo('#app')}
                            className="rounded-xl px-3 py-3 text-left hover:bg-white/10">App pública
                    </button>
                    <Link href="/registro"
                          className="mt-2 rounded-xl bg-[#9add3c] px-3 py-3 text-center text-xs uppercase tracking-wider text-[#08203a]">Registra
                        tu grass</Link></div>
            </div>}
            <div
                className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-12 lg:grid-cols-[1.03fr_.97fr] lg:px-8 lg:pb-28 lg:pt-24">
                <motion.div initial="hidden" animate="visible"
                            variants={{visible: {transition: {staggerChildren: 0.12}}}}
                            className="flex flex-col justify-center">
                    <motion.div variants={reveal}
                                className="mb-7 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9add3c]">
                        <span className="h-px w-8 bg-[#9add3c]"/> Mejora tu servicio hoy
                    </motion.div>
                    <motion.h1 variants={reveal}
                               className="max-w-3xl text-balance text-[clamp(3.7rem,8.2vw,7.2rem)] font-black uppercase leading-[0.88] tracking-[-0.025em]">Tu
                        cancha.<br/><span className="text-[#9add3c]">Tu control.</span><br/>Tu mejor juego.
                    </motion.h1>
                    <motion.p variants={reveal}
                              className="mt-8 max-w-lg text-pretty text-base leading-7 text-[#c7d3df] sm:text-lg">La
                        plataforma que convierte tus cuadernos y mensajes dispersos en una operación clara, ágil y lista
                        para crecer.
                    </motion.p>
                    <motion.div variants={reveal} className="mt-9 flex flex-wrap gap-3"><Link href="/registro"
                                                                                              className="group inline-flex items-center gap-3 rounded-full bg-[#9add3c] px-6 py-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#08203a] transition hover:bg-white">Empieza
                        con tu local <ArrowDownRight
                            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"/></Link>
                        <button onClick={() => scrollTo('#beneficios')}
                                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] transition hover:border-white hover:bg-white/10">Conoce
                            más <ChevronDown className="h-4 w-4"/></button>
                    </motion.div>
                </motion.div>
                <motion.div initial={reduceMotion ? false : {opacity: 0, x: 42, rotate: 3}}
                            animate={reduceMotion ? undefined : {opacity: 1, x: 0, rotate: -3}}
                            transition={{duration: 0.8, ease: 'easeOut'}}
                            className="relative mx-auto w-full max-w-[580px] lg:mt-4">
                    <div className="absolute -left-6 top-16 h-24 w-24 rounded-full bg-[#9add3c]/25 blur-3xl"/>
                    <div
                        className="dashboard-screen relative rounded-[2rem] border border-white/15 bg-[#f5f7f3] p-3 shadow-[0_35px_80px_rgba(0,0,0,.35)] sm:p-4">
                        <div className="overflow-hidden rounded-[1.45rem] bg-[#eef2ed] p-4 text-[#09213d] sm:p-5">
                            <div className="flex items-center justify-between border-b border-[#dbe4dc] pb-4">
                                <div className="flex items-center gap-2.5"><span
                                    className="grid h-8 w-8 place-items-center rounded-lg bg-[#08213e] text-[#9add3c]"><LayoutDashboard
                                    className="h-4 w-4"/></span>
                                    <div><p className="text-[10px] font-black uppercase tracking-wider">Cancha 360</p><p
                                        className="text-[9px] text-[#768797]">Panel de reservas</p></div>
                                </div>
                                <div className="h-7 w-7 rounded-full bg-[#9add3c]"/>
                            </div>
                            <div
                                className="mt-5 grid grid-cols-3 gap-2.5">{[['S/ 2,840', 'Ingresos'], ['48', 'Reservas'], ['87%', 'Ocupación']].map(([value, label], index) =>
                                <div key={label}
                                     className={index === 1 ? 'rounded-xl bg-[#08213e] p-3 text-white' : 'rounded-xl bg-white p-3'}>
                                    <p className="text-base font-black">{value}</p><p
                                    className="mt-1 text-[8px] font-bold uppercase tracking-wider text-[#8393a0]">{label}</p>
                                </div>)}</div>
                            <div className="mt-5 rounded-xl bg-white p-3.5">
                                <div className="mb-3 flex items-center justify-between"><p
                                    className="text-[10px] font-black">Agenda de hoy</p><p
                                    className="text-[9px] font-bold text-[#5c9f23]">12 reservas</p></div>
                                {[['17:00', 'Fútbol 6 · Cancha A', 'Confirmada'], ['18:30', 'Fútbol 7 · Cancha B', 'Confirmada'], ['20:00', 'Fútbol 6 · Cancha A', 'Pendiente']].map(([hour, match, status]) =>
                                    <div key={hour}
                                         className="flex items-center gap-2 border-t border-[#eef1ec] py-2.5"><span
                                        className="w-8 text-[9px] font-black">{hour}</span><span
                                        className="h-5 w-1 rounded-full bg-[#9add3c]"/><span
                                        className="flex-1 text-[9px] font-semibold text-[#536677]">{match}</span><span
                                        className={status === 'Pendiente' ? 'rounded-full bg-[#fff3ce] px-2 py-1 text-[8px] font-bold text-[#a56b00]' : 'rounded-full bg-[#e7f5d8] px-2 py-1 text-[8px] font-bold text-[#51831f]'}>{status}</span>
                                    </div>)}</div>
                        </div>
                    </div>
                    <div
                        className="absolute -bottom-5 -left-2 rounded-2xl border border-white/10 bg-[#102f51] px-4 py-3 shadow-xl sm:-left-8">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-white/55">Próxima reserva</p><p
                        className="mt-1 flex items-center gap-2 text-xs font-bold"><Clock3
                        className="h-3.5 w-3.5 text-[#9add3c]"/> Hoy · 18:30</p></div>
                </motion.div>
            </div>
        </section>
        <section className="border-b border-[#dce5db] bg-[#f6f8f5] py-5">
            <div
                className="ticker-track flex min-w-max items-center gap-9 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#557063]">{Array.from({length: 2}).flatMap((_, group) => ['Reservas claras', 'Más control', 'Menos llamadas', 'Mejores decisiones', 'Todo tu negocio'].map((item) =>
                <span key={`${group}-${item}`} className="flex items-center gap-9">
                    <Sparkles
                    className="h-3.5 w-3.5 text-[#7dbc28]"/> {item}</span>))}
            </div>
        </section>
        <section id="beneficios" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
            <motion.div initial="hidden" whileInView="visible" viewport={{once: true, amount: .25}} variants={reveal}
                        className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
                <div>
                    <p className="eyebrow">Deja que el sistema juegue a tu favor</p>
                    <h2 className="section-title mt-5">Menos tareas<br/>manuales. <em>Más cancha.</em>
                    </h2>
                </div>
                <p className="max-w-xl text-lg leading-8 text-[#526778]">Tú conoces a tus clientes y tu negocio. Tu
                    Cancha se encarga del orden detrás de cada reserva para que puedas concentrarte en hacerlo
                    crecer.
                </p></motion.div>
            <div className="mt-14 grid gap-4 lg:grid-cols-3">{features.map((feature, index) => {
                const Icon = feature.icon;
                return <motion.div key={feature.number} initial="hidden" whileInView="visible"
                                   viewport={{once: true, amount: .2}} variants={reveal}
                                   transition={{delay: index * .08}}><SpotlightCard
                    className="min-h-[320px] rounded-[1.7rem] border border-[#d9e4d8] bg-white p-7">
                    <div className="relative z-10 flex h-full flex-col">
                        <div className="flex items-start justify-between">
                            <span
                            className="text-xs font-black text-[#83ba39]">{feature.number}
                            </span>
                            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eaf5de] text-[#4d8f20]"><Icon
                            className="h-5 w-5"/>
                            </span>
                        </div>
                        <div className="mt-auto"><h3
                            className="text-2xl font-black tracking-[-.045em]">{feature.title}</h3>
                            <p className="mt-3 max-w-xs text-sm leading-6 text-[#617485]">{feature.text}</p>
                        </div>
                    </div>
                </SpotlightCard></motion.div>
            })}</div>
        </section>
        <section id="panel" className="relative overflow-hidden bg-[#eaf1e8] py-24 lg:py-32">
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden><Image src="/cancha.png"
                                                                                                     alt="" fill
                                                                                                     sizes="100vw"
                                                                                                     className="object-cover opacity-[.16] mix-blend-multiply"/>
                <div className="absolute inset-0 bg-[#eaf1e8]/55"/>
            </div>
            <div className="absolute left-[7%] top-0 h-full border-l border-dashed border-[#bed6b7]"/>
            <div className="absolute right-[12%] top-0 h-full border-l border-dashed border-[#bed6b7]"/>
            <div
                className="relative mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8">
                <motion.div initial="hidden" whileInView="visible" viewport={{once: true, amount: .2}} variants={reveal}
                            className="order-2 lg:order-1">
                    <div
                        className="rounded-[2rem] border-[10px] border-[#102e50] bg-[#f8faf7] p-5 shadow-[20px_25px_0_#9add3c] sm:p-7">
                        <div className="flex items-center justify-between border-b border-[#dce5db] pb-5">
                            <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#6c879d]">Análisis de
                                ocupación</p>
                                <h3 className="mt-1 text-xl font-black">Tu semana en un vistazo</h3>
                            </div>
                            <span className="rounded-full bg-[#ebf6df] px-3 py-1.5 text-[9px] font-bold text-[#5d9424]">+18.4% este mes</span>
                        </div>
                        <div
                            className="mt-8 flex h-40 items-end gap-2 sm:gap-3">{[36, 48, 39, 65, 58, 88, 72].map((height, index) =>
                            <div key={height} className="flex flex-1 flex-col items-center gap-2">
                                <div style={{height: `${height}%`}}
                                     className={index === 5 ? 'w-full rounded-t-lg bg-[#9add3c]' : 'w-full rounded-t-lg bg-[#c7d8ca]'}/>
                                <span
                                    className="text-[9px] font-bold text-[#718491]">{['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}</span>
                            </div>)}</div>
                        <div className="mt-7 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-[#edf4eb] p-4"><p
                                className="text-[10px] font-bold uppercase tracking-wide text-[#6b8377]">Hora
                                favorita</p><p className="mt-1 text-lg font-black">7:00 PM</p></div>
                            <div className="rounded-xl bg-[#edf4eb] p-4"><p
                                className="text-[10px] font-bold uppercase tracking-wide text-[#6b8377]">Cancha
                                activa</p><p className="mt-1 text-lg font-black">Fútbol 7</p></div>
                        </div>
                    </div>
                </motion.div>
                <motion.div initial="hidden" whileInView="visible" viewport={{once: true, amount: .2}} variants={reveal}
                            className="order-1 lg:order-2"><p className="eyebrow">Operación que se entiende</p><h2
                    className="section-title mt-5">Tu negocio deja de ser una intuición.</h2><p
                    className="mt-6 max-w-md text-base leading-7 text-[#526778]">Mira lo que ocurre antes de que termine
                    el día. Desde el estado de cada cancha hasta las horas que merecen una promoción.</p>
                    <ul className="mt-8 space-y-4">{['Calendario inteligente por cancha y sede', 'Estados de reserva para actuar a tiempo', 'Reportes que muestran lo que funciona'].map((item) =>
                        <li key={item} className="flex items-center gap-3 text-sm font-bold"><span
                            className="grid h-6 w-6 place-items-center rounded-full bg-[#9add3c] text-[#173152]"><Check
                            className="h-3.5 w-3.5 stroke-[3]"/></span>{item}</li>)}</ul>
                </motion.div>
            </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#09213e] p-7 text-white sm:p-12 lg:p-16"><Image
                src="/balon.png" alt="" width={280} height={280} aria-hidden
                className="pointer-events-none absolute -right-10 -top-12 w-40 opacity-20 mix-blend-screen sm:w-56"/>
                <div className="relative">
                    <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
                        <div>
                            <p className="eyebrow text-[#9add3c]">Todo conectado</p>
                            <h2 className="mt-5 text-balance text-4xl font-black uppercase leading-[.94] tracking-[-.025em] sm:text-6xl">Un
                            local o tres.<br/>El orden es el mismo.</h2>
                        </div>
                        <p className="max-w-xl text-lg leading-8 text-[#b9c9d7]">Cada sede conserva su propia agenda,
                            equipo y horarios. Tú mantienes la lectura completa de tu negocio desde un solo lugar.</p>
                    </div>
                    <div
                        className="mt-12 grid gap-3 md:grid-cols-3">{[['01', 'Sedes', 'Organiza cada local con su propia identidad.'], ['02', 'Canchas', 'Administra tipos, tarifas y disponibilidad.'], ['03', 'Equipo', 'Da visibilidad a quien atiende las reservas.']].map(([number, title, text]) =>
                        <div key={number} className="rounded-2xl border border-white/10 bg-white/[.06] p-5"><p
                            className="text-xs font-black text-[#9add3c]">{number}</p><h3
                            className="mt-9 text-lg font-black">{title}</h3><p
                            className="mt-2 text-sm leading-6 text-[#abc0d2]">{text}</p></div>)}</div>
                </div>
            </div>
        </section>
        <section id="app" className="relative overflow-hidden bg-[#9add3c] px-5 py-24 lg:px-8 lg:py-32">
            <div
                className="absolute right-[-4rem] top-[-8rem] text-[26rem] font-black leading-none tracking-[-.04em] text-[#85c534]/30">TC
            </div>
            <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
                <motion.div initial="hidden" whileInView="visible" viewport={{once: true, amount: .2}}
                            variants={reveal}><p className="eyebrow text-[#23452e]">Una vitrina para tu local</p><h2
                    className="mt-5 max-w-xl text-balance text-5xl font-black uppercase leading-[.92] tracking-[-.025em] text-[#08203a] sm:text-7xl">Tus
                    canchas también se encuentran.</h2><p
                    className="mt-7 max-w-md text-lg leading-8 text-[#23452e]">Próximamente, los jugadores podrán
                    descubrir locales afiliados, consultar disponibilidad y reservar desde la app Tu Cancha.</p>
                    <div className="mt-8 flex items-center gap-3 text-sm font-bold text-[#173c28]"><Smartphone
                        className="h-5 w-5"/> Una app para tus clientes. Un flujo para tu negocio.
                    </div>
                </motion.div>
                <motion.div initial={reduceMotion ? false : {opacity: 0, y: 32}}
                            whileInView={reduceMotion ? undefined : {opacity: 1, y: 0}}
                            viewport={{once: true, amount: .2}}
                            className="mx-auto w-full max-w-[390px] rounded-[2.8rem] border-[8px] border-[#0a2948] bg-[#f6f8f5] p-3 shadow-[16px_18px_0_#173e29]">
                    <div className="min-h-[450px] rounded-[2.1rem] bg-[#e7eee5] p-5">
                        <div className="mx-auto h-1.5 w-20 rounded-full bg-[#0a2948]"/>
                        <div className="mt-7 flex items-center justify-between"><p
                            className="text-sm font-black">Canchas cerca de ti</p><MapPin
                            className="h-4 w-4 text-[#659e27]"/></div>
                        <div className="mt-5 rounded-2xl bg-[#0c2b4d] p-4 text-white"><p
                            className="text-[9px] font-bold uppercase tracking-wider text-[#9add3c]">Espacio para
                            imagen</p><p className="mt-8 text-lg font-black">Tu foto del local<br/>o cancha principal
                        </p></div>
                        <div className="mt-4 rounded-2xl bg-white p-4"><p className="text-xs font-black">Grass Los
                            Libertadores</p><p className="mt-1 text-[10px] text-[#67807a]">Ayacucho · Fútbol 7</p>
                            <div className="mt-3 flex items-center justify-between"><span
                                className="text-[10px] font-bold text-[#659e27]">Disponible hoy</span><span
                                className="rounded-full bg-[#9add3c] px-3 py-1.5 text-[9px] font-black text-[#163529]">Ver horarios</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
        <section className="bg-[#f6f8f5] px-5 py-24 lg:px-8">
            <div className="mx-auto max-w-7xl"><SpotlightCard
                className="rounded-[2rem] bg-white p-8 ring-1 ring-[#dce6da] sm:p-14">
                <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <p className="eyebrow">El partido empieza aquí</p>
                        <h2 className="section-title mt-5">Haz que tu
                        local juegue en primera.</h2>
                        <p className="mt-5 max-w-xl text-base leading-7 text-[#526778]">Crea tu cuenta, registra tu primer
                        local y comienza a ordenar tus reservas desde hoy.</p>
                    </div>
                    <Link href="/registro"
                          className="group inline-flex w-fit items-center gap-3 rounded-full bg-[#09213e] px-7 py-4 text-xs font-extrabold uppercase tracking-[.13em] text-white transition hover:bg-[#78b92a] hover:text-[#07203b]">Registrar
                        mi grass <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></Link>
                </div>
            </SpotlightCard></div>
        </section>
        <footer className="bg-[#071f3b] px-5 py-10 text-white lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative h-10 w-36"><Image src="/logo.png" alt="Tu Cancha" fill
                                                           className="object-contain object-left"/></div>
                <p className="text-xs text-white/45">© {new Date().getFullYear()} Tu Cancha · Ayacucho, Perú</p><Link
                href="/registro" className="text-xs font-bold text-[#9add3c] transition hover:text-white">Registra tu
                local →</Link></div>
        </footer>
    </main>
}
