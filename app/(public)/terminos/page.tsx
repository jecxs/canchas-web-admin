import { LegalPageShell } from '@/components/legal-page-shell'

export default function TermsPage() {
  return (
    <LegalPageShell title="Términos y Condiciones">
      <section>
        <h2 className="text-lg font-black text-[#151c16]">1. Sobre Grassly</h2>
        <p className="mt-2">
          Grassly es una plataforma digital de ejemplo para ayudar a los complejos deportivos a organizar locales, canchas, horarios y reservas.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#151c16]">2. Cuenta y uso</h2>
        <p className="mt-2">
          La persona usuaria debe proporcionar información correcta y mantener la seguridad de sus credenciales. El titular del local es responsable de revisar los datos y horarios publicados en su cuenta.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#151c16]">3. Plan de suscripción</h2>
        <p className="mt-2">
          El precio de referencia mostrado en esta landing es S/ 80 al mes, con 14 días de prueba. Las condiciones de cobro, renovación, cancelación y alcance del servicio deben confirmarse en la versión oficial de estos términos.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#151c16]">4. Contacto</h2>
        <p className="mt-2">
          Para consultas sobre esta muestra, escribe a <a className="font-bold underline" href="mailto:soporte@grassly.pe">soporte@grassly.pe</a>.
        </p>
      </section>
    </LegalPageShell>
  )
}
