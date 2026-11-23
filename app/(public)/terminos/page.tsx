import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageShell } from '@/components/legal-page-shell'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Grassly',
  description: 'Condiciones de uso, suscripciones y reservas en la plataforma Grassly.',
}

export default function TermsPage() {
  return (
    <LegalPageShell title="Términos y Condiciones">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-[#151c16]/10 pb-4 text-xs font-bold uppercase tracking-wider text-[#58635a]">
        <span>Jurisdicción: República del Perú</span>
        <span>Última actualización: Noviembre 2026</span>
      </div>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">1. Identificación y Aceptación</h2>
        <p className="mt-2 leading-relaxed">
          Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma digital <strong>Grassly</strong> (incluyendo el sitio web, el panel de administración y la aplicación móvil), operada por <strong>Lexovate</strong> en la República del Perú. Al crear una cuenta, navegar o utilizar cualquiera de nuestros servicios, el usuario declara haber leído, comprendido y aceptado íntegramente estas condiciones.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">2. Naturaleza del Servicio (Intermediación Tecnológica)</h2>
        <p className="mt-2 leading-relaxed">
          Grassly provee una solución tecnológica de gestión para complejos deportivos y un canal digital para que los jugadores consulten disponibilidad y reserven turnos. <strong>Grassly actúa exclusivamente como intermediario tecnológico; no es propietaria, arrendataria, socia ni administradora física de los complejos deportivos publicados.</strong> Cada complejo deportivo es responsable directo del estado del césped, infraestructura, iluminación, seguridad interna y prestación efectiva del servicio en el horario reservado.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">3. Registro, Cuentas y Veracidad</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
          <li>Para operar en la plataforma, el usuario debe proporcionar datos veraces, exactos y actualizados, y mantener la confidencialidad de sus credenciales de acceso (incluyendo el inicio de sesión mediante Google).</li>
          <li>El titular o administrador del complejo deportivo es responsable de mantener actualizadas sus canchas, deportes, tarifas y bloqueos de horario en el panel web.</li>
          <li>Grassly se reserva el derecho de suspender o cancelar de forma inmediata cuentas que realicen reservas ficticias recurrentes, suban comprobantes de pago adulterados o comprometan la integridad del sistema.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">4. Reservas, Modalidades de Pago y Comprobantes</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
          <li>
            <strong>Validación de turnos:</strong> Las reservas realizadas por jugadores mediante billeteras digitales (Yape, Plin) o pasarelas electrónicas habilitadas quedan sujetas a la validación del pago dentro del plazo indicado en la aplicación. Si el comprobante no es adjuntado o validado a tiempo, el sistema liberará el horario automáticamente.
          </li>
          <li>
            <strong>Comprobantes tributarios:</strong> El complejo deportivo es el único obligado tributario a emitir la boleta o factura electrónica al jugador por el alquiler de la cancha. Grassly emite comprobantes de pago únicamente a los complejos deportivos por el licenciamiento y suscripción del software.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">5. Cancelaciones, Reprogramaciones y Devoluciones</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
          <li>
            <strong>Plazos del jugador:</strong> Salvo que el complejo deportivo establezca una política distinta visible antes de confirmar la reserva, toda solicitud de reprogramación debe realizarse con un mínimo de 12 horas de anticipación al inicio del turno.
          </li>
          <li>
            <strong>Inasistencia (No-Show):</strong> En caso de inasistencia del jugador o cancelación fuera del plazo establecido, el complejo deportivo podrá retener el monto abonado por concepto de separación.
          </li>
          <li>
            <strong>Responsabilidad de reembolsos:</strong> Cuando una reserva deba ser cancelada por causas atribuibles al complejo deportivo (cierre imprevisto, corte de energía o mantenimiento de emergencia), el jugador tendrá derecho a reprogramar sin costo o solicitar la devolución del dinero directamente al complejo deportivo receptor del pago. Grassly facilitará la comunicación entre ambas partes, pero no asume devoluciones de fondos transferidos directamente a las cuentas del complejo.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">6. Plan de Suscripción para Propietarios(Panel Web)</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
          <li>
            <strong>Periodo de prueba:</strong> Los nuevos complejos deportivos acceden a <strong>14 días de prueba gratuita</strong> con acceso completo a las herramientas de gestión sin compromiso de permanencia.
          </li>
          <li>
            <strong>Tarifa y facturación:</strong> Finalizado el periodo de prueba, la suscripción mensual tiene un costo de <strong>S/ 80.00 (ochenta soles) al mes</strong> por complejo, facturados de manera recurrente.
          </li>
          <li>
            <strong>Cancelación sin penalidades:</strong> El administrador puede cancelar su suscripción en cualquier momento desde su panel o escribiendo a soporte antes de su siguiente fecha de corte.
          </li>
          <li>
            <strong>Propiedad de los datos del negocio:</strong> Toda la información operativa ingresada por el complejo (base de clientes, historial de reservas, tarifas y reportes de caja) pertenece exclusivamente al titular del complejo, quien podrá solicitar su exportación antes de dar de baja su cuenta.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">7. Uso Aceptable y Prohibiciones</h2>
        <p className="mt-2 leading-relaxed">
        Queda estrictamente prohibido utilizar Grassly para fines ilícitos, extraer datos de forma automatizada (scraping), suplantar la identidad de terceros, manipular comprobantes bancarios o interferir con el normal funcionamiento de los servidores y la interfaz de la plataforma.
        </p>
      </section>
      
      <section>
        <h2 className="text-lg font-black text-[#151c16]">8. Limitación de Responsabilidad</h2>
        <p className="mt-2 leading-relaxed">
        Grassly realiza sus mejores esfuerzos para mantener la plataforma disponible las 24 horas; sin embargo, no garantiza la ausencia absoluta de interrupciones derivadas de fallas de internet, mantenimiento programado o caídas de servicios externos (pasarelas de pago, proveedores en la nube o billeteras digitales). Asimismo, Grassly no asume responsabilidad por lesiones físicas durante la práctica deportiva, pérdida de objetos personales en los locales ni disputas extracontractuales entre jugadores y complejos.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">9. Propiedad Intelectual</h2>
        <p className="mt-2 leading-relaxed">
        El código fuente, arquitectura de software, diseño de interfaz, logotipos, ilustraciones (incluyendo la mascota oficial "Grassy") y la marca "Grassly" son propiedad intelectual exclusiva de Lexovate. Queda prohibida su reproducción, distribución, modificación o ingeniería inversa sin autorización previa y por escrito.
        </p>
      </section>
      
      <section>
        <h2 className="text-lg font-black text-[#151c16]">10. Modificaciones, Legislación y Libro de Reclamaciones</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
          <li><strong>Actualizaciones:</strong> Grassly podrá actualizar estos Términos y Condiciones o ajustar las tarifas de suscripción, notificándolo con al menos 15 días de anticipación a través de la plataforma o por correo electrónico.
          </li>
          <li><strong>Ley aplicable y Libro de Reclamaciones:</strong> Estos términos se rigen por las leyes de la República del Perú y cualquier controversia será sometida a los jueces y tribunales de Lima. Conforme al Código de Protección y Defensa del Consumidor (Ley N.° 29571), ponemos a disposición de nuestros usuarios nuestro canal de atención para el registro de quejas y reclamos.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-[#151c16]/10 bg-white/70 p-4">
        <h2 className="text-base font-black text-[#151c16]">11. Contacto Oficial</h2>
        <p className="mt-1 text-sm leading-relaxed">
          Para soporte técnico, consultas sobre facturación, cancelación de suscripciones o asuntos legales, escríbenos a{' '}
          <a className="font-bold text-[#6E4BFF] underline" href="mailto:soporte@grassly.pe">
            soporte@grassly.pe
          </a>
          . También puedes revisar nuestra{' '}
          <Link href="/privacidad" className="font-bold text-[#6E4BFF] underline">
            Política de Privacidad
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  )
}