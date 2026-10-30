const steps = [
    {
        title: 'Se separa el horario',
        text: 'El cliente elige local, deporte, cancha y horario. El horario queda apartado hasta que pague o envíe su comprobante.',
    },
    {
        title: 'Se paga el adelanto',
        text: 'La reserva se confirma con un adelanto. El resto se paga después.',
        badges: [
            { label: 'Mercado Pago:', detail: 'se confirma sola', className: 'bg-[#E0F2FE]' },
            { label: 'Comprobante:', detail: 'tú lo validas', className: 'bg-[#D7FF38]' },
        ],
    },
    {
        title: 'Se cobra el saldo',
        text: 'Liquida el monto pendiente directamente desde tu Agenda o lista de Reservas cuando el cliente llegue a jugar. Todo se refleja automáticamente en tus reportes.',
    },
]

export function PaymentsFlow() {
    return (
        <section className="bg-[#F4F6F0] px-5 py-24 text-[#151c16] sm:py-28 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-7xl">
            <h2 className="max-w-5xl font-display text-[clamp(3rem,8vw,7.25rem)] font-black uppercase leading-[.85] tracking-[-.035em]">
                Separa hasta que el cliente paga
            </h2>
            <p className="mt-7 max-w-3xl text-lg font-medium leading-7 text-gray-800 md:text-xl md:leading-8">
                El cliente elige su horario y paga el adelanto. Con Mercado Pago la reserva se confirma sola. Si envía un comprobante, te llega una notificación en la web y lo validas desde tu agenda. El resto se cobra después, y ves lo que falta en tus reportes.
            </p>
            <ol className="mt-20 grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-3">
                {steps.map((step, index) =>
                    <li key={step.title} className="relative border-t-2 border-[#151c16]">
                        <span className="absolute -top-6 left-0 grid size-12 place-items-center rounded-full border-2 border-[#151c16] bg-[#D7FF38] text-lg font-black shadow-[4px_4px_0px_#151c16]">
                            {index + 1}
                        </span>
                        <h3 className="mt-8 mb-3 text-2xl font-black uppercase leading-tight">{step.title}</h3>
                        <p className="max-w-md text-base leading-relaxed text-gray-800">{step.text}</p>
                        {step.badges &&
                            <div className="mt-5 flex flex-col items-start gap-3">
                                {step.badges.map((badge) =>
                                    <span key={badge.label} className={`inline-flex flex-wrap items-baseline gap-x-1 border border-[#151c16] px-3 py-2 text-sm shadow-[2px_2px_0px_#151c16] ${badge.className}`}>
                                        <span className="font-extrabold">{badge.label}</span>
                                        <span>{badge.detail}</span>
                                    </span>)}
                            </div>}
                    </li>)}
            </ol>
            </div>
        </section>
    )
}
