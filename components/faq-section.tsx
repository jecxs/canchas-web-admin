const questions = [
  {
    question: '¿Qué pasa si mis clientes se confunden al reservar por primera vez?',
    answer:
      'Grassly está diseñado para ser extremadamente intuitivo, tanto para ti como para tus jugadores. Los clientes pueden reservar en menos de un minuto desde su celular sin necesidad de descargar aplicaciones pesadas. Además, nuestro equipo de soporte te acompaña en el proceso de inducción.',
  },
  {
    question: '¿Cómo funciona el cobro de adelantos con Mercado Pago?',
    answer:
      'Cuando un jugador selecciona un horario, se le solicita un pago de adelanto configurado por ti mediante Mercado Pago. La reserva se confirma en tu agenda de forma automática e inmediata. El saldo restante se cobra directamente en el local el día del partido.',
  },
  {
    question: '¿Puedo administrar más de un complejo deportivo con la misma cuenta?',
    answer:
      'Sí. Con el panel multisede de Grassly puedes gestionar todas las canchas de tus diferentes locales desde una sola cuenta. Cada sede mantiene su propia agenda y horarios independientes, pero tú tienes una lectura financiera centralizada.',
  },
  {
    question: '¿Qué sucede si un cliente prefiere pagar por transferencia o Yape/Plin?',
    answer:
      'No hay problema. El sistema cuenta con una opción para que el cliente suba el comprobante de pago. La reserva queda en estado de validación y tú puedes aprobarla con un solo clic directamente desde tu calendario en vivo.',
  },
  {
    question: '¿Necesito instalar algún software o equipo especial?',
    answer:
      'Ninguno. Grassly es 100% en la nube. Funciona directamente desde el navegador de tu computadora, tablet o celular (Chrome, Safari, etc.). No requiere servidores locales ni instalaciones complejas.',
  },
  {
    question: '¿Existe algún contrato de permanencia o costo oculto?',
    answer:
      'Ninguno. Pagas una tarifa plana mensual de S/ 80 sin contratos forzosos. Puedes cancelar o pausar tu suscripción cuando lo desees sin penalidades.',
  },
]

export function FAQSection() {
  return (
    <section className="bg-[#151c16] px-6 py-24 text-white md:px-16">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12">
          <h2 className="text-4xl font-black uppercase tracking-tight md:text-5xl">
            Preguntas Frecuentes
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400 md:text-lg">
            Todo lo que necesitas saber antes de empezar a optimizar tu complejo deportivo.
          </p>
        </header>

        <div className="space-y-3">
          {questions.map(({ question, answer }) => (
            <details
              key={question}
              className="group rounded-xl border border-white/10 bg-[#1a241b]/60 p-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-semibold text-white marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF38] focus-visible:ring-offset-4 focus-visible:ring-offset-[#151c16] md:text-lg [&::-webkit-details-marker]:hidden">
                <span>{question}</span>
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-white/15 text-xl font-normal text-[#D7FF38] transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 group-open:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <div className="mt-5 border-t border-white/10 pt-4 text-base leading-7 text-gray-300">
                    {answer}
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-5 rounded-2xl border border-[#D7FF38]/60 bg-[#1a241b]/60 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h3 className="text-xl font-bold text-white">¿Tienes otra duda?</h3>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              Escríbenos y te ayudamos a resolverla.
            </p>
          </div>
          <a
            href="https://wa.me/51999999999?text=Hola%2C%20tengo%20una%20consulta%20sobre%20Grassly."
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#D7FF38] px-6 py-3 text-sm font-bold text-[#151c16] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E4BFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#151c16]"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
