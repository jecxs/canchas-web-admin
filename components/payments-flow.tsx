const steps = [
    {
        title: 'Se separa el horario',
        text: 'El cliente elige local, deporte, cancha y horario. El horario queda apartado hasta que pague o envíe su comprobante.',
    },
    {
        title: 'Se paga el adelanto',
        text: 'La reserva se confirma con un adelanto. El resto se paga después.',
        chips: ['Mercado Pago: se confirma sola', 'Comprobante: tú lo validas'],
    },
    {
        title: 'Se cobra el saldo',
        text: 'El dueño ve los saldos por cobrar en Reportes.',
    },
]

export function PaymentsFlow() {
    return (
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
            <h2 className="section-title max-w-3xl">El horario se separa hasta que el cliente paga</h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
                El cliente elige su horario y paga el adelanto. Con Mercado Pago la reserva se confirma sola. Si envía un comprobante, te llega una notificación en la web y lo validas desde tu agenda. El resto se cobra después, y ves lo que falta en tus reportes.
            </p>
            <ol className="mt-12 grid gap-6 sm:grid-cols-3">
                {steps.map((step, index) =>
                    <li key={step.title} className="border-t border-border pt-5">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">{index + 1}</span>
                        <h3 className="mt-4 text-lg font-black">{step.title}</h3>
                        <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{step.text}</p>
                        {step.chips &&
                            <div className="mt-3 flex flex-wrap gap-2">
                                {step.chips.map((chip) =>
                                    <span key={chip} className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted-foreground">{chip}</span>)}
                            </div>}
                    </li>)}
            </ol>
        </section>
    )
}
