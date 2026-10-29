'use client'

import Image from 'next/image'
import {useState} from 'react'
import {HugeiconsIcon} from '@hugeicons/react'
import {FootballIcon, GridIcon, Search01Icon} from '@hugeicons/core-free-icons'

const steps = [
    {
        icon: Search01Icon,
        title: 'Busca tu local',
        text: 'Escribe el nombre o el distrito y elige entre los locales disponibles.',
        box: {top: '22%', left: '13.5%', width: '72%', height: '5%'},
    },
    {
        icon: FootballIcon,
        title: 'Elige tu deporte',
        text: 'Filtra por fútbol, basquet o el deporte que vas a jugar.',
        box: {top: '30.5%', left: '13.5%', width: '73%', height: '4.5%'},
    },
    {
        icon: GridIcon,
        title: 'Escoge tu cancha',
        text: 'Compara turnos y precios, y reserva en pocos toques.',
        box: {top: '73.5%', left: '13.5%', width: '66%', height: '12.5%'},
    },
]

export function AppShowcase() {
    const [active, setActive] = useState(0)

    return (
        <section id="app" className="relative overflow-hidden bg-sidebar px-5 py-24 text-sidebar-foreground lg:px-8 lg:py-32">
            <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
                <div>
                    <h2 className="max-w-xl text-balance font-display text-4xl font-black uppercase leading-[.92] tracking-[-.022em] sm:text-5xl">
                        Tus clientes te encuentran y reservan desde el celular
                    </h2>
                    <p className="mt-6 max-w-md text-base leading-7 text-sidebar-foreground/70">
                        Tu local aparece en la app móvil de Grassly: los jugadores buscan, comparan y reservan en minutos. También pueden buscar los locales más cercanos y verlos en un mapa.
                    </p>
                    <div className="mt-10 flex flex-col gap-3">
                        {steps.map((step, index) => (
                            <button key={step.title} type="button" onClick={() => setActive(index)}
                                    onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)}
                                    aria-pressed={active === index}
                                    className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-colors duration-300 ${active === index ? 'border-brand bg-brand/10' : 'border-sidebar-foreground/10 hover:border-sidebar-foreground/30'}`}>
                                <span className={`grid size-10 shrink-0 place-items-center rounded-xl transition-colors duration-300 ${active === index ? 'bg-brand text-white' : 'bg-sidebar-foreground/10 text-sidebar-foreground'}`}>
                                    <HugeiconsIcon icon={step.icon} strokeWidth={2} className="size-5"/>
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-base font-black">{step.title}</span>
                                    <span className="mt-1 block text-sm leading-6 text-sidebar-foreground/70">{step.text}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="relative mx-auto w-fit">
                    <div aria-hidden className="absolute left-1/2 top-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/25 blur-3xl"/>
                    <div className="relative">
                        <Image src="/landing/app-1.png" alt="App móvil de Grassly para clientes" width={848} height={1568}
                               sizes="(min-width: 1024px) 380px, 80vw"
                               className="block max-h-[70svh] w-auto max-w-full"/>
                        <div aria-hidden className="absolute rounded-xl border-2 border-brand bg-brand/15 transition-all duration-300 ease-out"
                             style={steps[active].box}/>
                    </div>
                </div>
            </div>
        </section>
    )
}
