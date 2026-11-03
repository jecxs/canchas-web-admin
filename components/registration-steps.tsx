const steps = [
  {
    title: 'CREAR CUENTA',
    text: 'Conecta tu cuenta en un clic con Google para un acceso rápido y seguro a tu panel de administración.',
  },
  {
    title: 'REGISTRAR LOCAL',
    text: 'Ingresa el nombre, la dirección exacta y el contacto principal de tu complejo deportivo para que tus clientes te encuentren.',
  },
  {
    title: 'VALIDAMOS TU COMPLEJO',
    text: 'Revisamos los datos de tu sede de forma ágil para garantizar la seguridad, calidad y legitimidad en la plataforma.',
  },
  {
    title: 'EMPEZAR A OPERAR',
    text: 'Configura tus tarifas por hora, abre tu agenda digital y comienza a recibir reservas automáticas sin cruces.',
  },
]

export function RegistrationSteps() {
  return (
    <section
      aria-label="Pasos para comenzar"
      className="bg-[#F4F6F0] px-5 py-20 text-[#151c16] sm:py-24 lg:px-8 lg:py-28"
    >
      <ol className="mx-auto grid max-w-7xl grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step.title}>
            <div className="flex items-center">
              <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-full border-2 border-[#151c16] bg-[#D7FF38] text-xl font-black shadow-[3px_3px_0_#151c16] sm:size-16 sm:text-2xl">
                {index + 1}
              </span>
              <span
                aria-hidden="true"
                className="h-0 flex-1 border-t-2 border-[#151c16]"
              />
            </div>
            <h2 className="mt-6 text-xl font-black uppercase leading-tight sm:text-2xl">
              {step.title}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#26352a] sm:text-lg">
              {step.text}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
