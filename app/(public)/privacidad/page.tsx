import { LegalPageShell } from '@/components/legal-page-shell'

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Políticas de Privacidad">
      <section>
        <h2 className="text-lg font-black text-[#151c16]">1. Datos que podrían utilizarse</h2>
        <p className="mt-2">
          Como ejemplo, Grassly podría tratar datos de contacto y de cuenta, información del local, y datos necesarios para organizar reservas y pagos.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#151c16]">2. Finalidades de ejemplo</h2>
        <p className="mt-2">
          La información podría utilizarse para prestar y mantener el servicio, administrar reservas, brindar soporte y comunicar cambios relacionados con la plataforma.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#151c16]">3. Conservación y derechos</h2>
        <p className="mt-2">
          Los plazos de conservación, las medidas de seguridad, los proveedores que intervienen y el procedimiento para ejercer derechos deben definirse y verificarse en el documento oficial antes de su publicación.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-black text-[#151c16]">4. Consultas</h2>
        <p className="mt-2">
          Puedes dirigir consultas sobre esta muestra a <a className="font-bold underline" href="mailto:soporte@grassly.pe">soporte@grassly.pe</a>.
        </p>
      </section>
    </LegalPageShell>
  )
}
