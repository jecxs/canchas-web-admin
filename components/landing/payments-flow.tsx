'use client'

import { useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const steps = [
    {
        title: 'Se separa el horario',
        text: 'El cliente elige local, deporte, cancha y horario. El horario queda apartado hasta que pague o envíe su comprobante.',
    },
    {
        title: 'Se paga el adelanto',
        text: 'La reserva se confirma con un adelanto. El resto se paga después.',
        badges: [
            {
                label: 'Mercado Pago:',
                detail: 'se confirma sola',
                className: 'bg-[#E0F2FE]',
                logos: [{ src: '/mplogo.png', alt: 'Logo de Mercado Pago', width: 474, height: 337, className: 'h-7 w-auto' }],
            },
            {
                label: 'Comprobante:',
                detail: 'tú lo validas',
                className: 'bg-[#D7FF38]',
                logos: [
                    { src: '/67c3a4c15f5d7-Yape.svg', alt: 'Yape', width: 960, height: 960, className: 'size-7' },
                    { src: '/Plin  AI.svg', alt: 'Plin', width: 452, height: 452, className: 'size-7' },
                ],
            },
        ],
    },
    {
        title: 'Se cobra el saldo',
        text: 'Liquida el monto pendiente directamente desde tu Agenda o lista de Reservas cuando el cliente llegue a jugar. Todo se refleja automáticamente en tus reportes.',
    },
]

export function PaymentsFlow() {
    const stepsContainerRef = useRef<HTMLOListElement>(null)

    useGSAP(() => {
        const container = stepsContainerRef.current
        if (!container) return

        gsap.fromTo(
            '.step-item',
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.25,
                scrollTrigger: {
                    trigger: container,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
            },
        )
    }, { scope: stepsContainerRef })

    return (
        <section className="bg-[#F4F6F0] px-5 py-24 text-[#151c16] sm:py-28 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-7xl">
            <h2 className="max-w-5xl font-display text-[clamp(3rem,8vw,7.25rem)] font-black uppercase leading-[.85] tracking-[-.035em]">
                Separa hasta que el cliente paga
            </h2>
            <p className="mt-7 max-w-3xl text-lg font-medium leading-7 text-gray-800 md:text-xl md:leading-8">
                El cliente elige su horario y paga el adelanto. Con Mercado Pago la reserva se confirma sola. Si envía un comprobante, te llega una notificación en la web y lo validas desde tu agenda. El resto se cobra después, y ves lo que falta en tus reportes.
            </p>
            <ol ref={stepsContainerRef} className="mt-20 grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-3">
                {steps.map((step, index) =>
                    <li key={step.title} className="step-item relative border-t-2 border-[#151c16]">
                        <span className="absolute -top-6 left-0 grid size-12 place-items-center rounded-full border-2 border-[#151c16] bg-[#D7FF38] text-lg font-black shadow-[4px_4px_0px_#151c16]">
                            {index + 1}
                        </span>
                        <h3 className="mt-8 mb-3 text-2xl font-black uppercase leading-tight">{step.title}</h3>
                        <p className="max-w-md text-base leading-relaxed text-gray-800">{step.text}</p>
                        {step.badges &&
                            <div className="mt-5 flex flex-col items-start gap-3">
                                {step.badges.map((badge) =>
                                    <div key={badge.label} className={`inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 border border-[#151c16] px-3 py-2 text-sm shadow-[2px_2px_0px_#151c16] ${badge.className}`}>
                                        <span className="inline-flex flex-wrap items-baseline gap-x-1">
                                            <span className="font-extrabold">{badge.label}</span>
                                            <span>{badge.detail}</span>
                                        </span>
                                        <span className="inline-flex shrink-0 items-center gap-1.5" aria-label="Métodos de pago">
                                            {badge.logos.map((logo) =>
                                                <Image
                                                    key={logo.src}
                                                    src={logo.src}
                                                    alt={logo.alt}
                                                    width={logo.width}
                                                    height={logo.height}
                                                    className={`${logo.className} object-contain`}
                                                />,
                                            )}
                                        </span>
                                    </div>)}
                            </div>}
                    </li>)}
            </ol>
            </div>
        </section>
    )
}
