import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageShell } from '@/components/legal-page-shell'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Grassly',
  description: 'Tratamiento y protección de datos personales en Grassly conforme a la Ley N.° 29733.',
}

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Política de Privacidad">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-[#151c16]/10 pb-4 text-xs font-bold uppercase tracking-wider text-[#58635a]">
        <span>Normativa: Ley N.° 29733 (Perú)</span>
        <span>Última actualización: Noviembre 2026</span>
      </div>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">1. Responsable del Tratamiento</h2>
        <p className="mt-2 leading-relaxed">
          De acuerdo con la <strong>Ley N.° 29733, Ley de Protección de Datos Personales</strong> de Perú y su Reglamento(Decreto Supremo N° 016-2024-JUS), el responsable del banco de datos recopilados a través de Grassly es <strong>Lexovate</strong>, con correo de contacto:{' '}
          <a className="font-bold text-[#6E4BFF] underline" href="mailto:soporte@grassly.pe">
            soporte@grassly.pe
          </a>
          .
        </p>
      </section>
        <h2 className="text-lg font-black text-[#151c16]">2. Principios Rectores y Consentimiento</h2>
          <p className="mt-2 leading-relaxed">
          El registro de una cuenta, el marcado de la casilla de aceptación o el uso continuo de la plataforma constituyen el consentimiento libre, previo, expreso, inequívoco e informado del titular para el tratamiento de sus datos conforme a este documento.
          </p>
      <section>

      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">3. Datos Personales Recopilados</h2>
        <ul className="mt-3 list-disc space-y-4 pl-5 leading-relaxed">
          <li>
            <strong className="text-base font-semibold">Jugadores:</strong>
            <ul className="mt-2 list-[circle] space-y-2 border-l-2 border-neutral-200 pl-6">
              <li>
                <strong>Identificación y contacto:</strong> Nombres y apellidos, correo electrónico, número de teléfono celular y fotografía de perfil (cuando se utiliza inicio de sesión mediante Google OAuth).
              </li>
              <li>
                <strong>Transaccionales y operativos:</strong> Historial de reservas, horarios frecuentes, complejos visitados e imágenes de comprobantes de pago (Yape, Plin o transferencias) cargadas para validar turnos.
              </li>
              <li>
                <strong>Geolocalización (GPS):</strong> Ubicación geográfica aproximada o precisa, recopilada únicamente bajo autorización expresa en el dispositivo móvil para mostrar canchas disponibles cercanas en el mapa interactivo.
              </li>
            </ul>
          </li>
          <li>
            <strong className="text-base font-semibold">Propietarios de complejos:</strong>
            <ul className="mt-2 list-[circle] space-y-2 border-l-2 border-neutral-200 pl-6">
              <li>
                <strong>Identificación y facturación:</strong> Nombres del representante legal o administrador, correo electrónico, teléfono de contacto, RUC o DNI para emisión de comprobantes por suscripción.
              </li>
              <li>
                <strong>Operativos del negocio:</strong> Nombre comercial del complejo, dirección exacta, coordenadas de ubicación, deportes disponibles, tarifas, promociones y registros de caja/reservas.
              </li>
            </ul>
          </li>
          <li>
            <strong className="text-base font-semibold">Datos Técnicos Automáticos: </strong>Dirección IP, tipo de navegador, modelo de dispositivo móvil, sistema operativo, tokens de autenticación y registros de actividad indispensables para mantener la seguridad y estabilidad del servicio.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">4. Finalidad y Uso de la Información</h2>
        <ul className="mt-3 list-disc space-y-4 pl-5 leading-relaxed">
          <li>
            <strong className="text-base font-semibold">Finalidades Necesarias(Ejecución del servicio):</strong>
            <ul className="mt-2 list-[circle] space-y-2 border-l-2 border-neutral-200 pl-6">
              <li>
                <strong>Crear, autenticar y administrar las cuentas de usuario.</strong>
              </li>
              <li>
                <strong>Procesar, confirmar, reprogramar o cancelar reservas de canchas deportivas.</strong>
              </li>
              <li>
                <strong>Validar los comprobantes de pago cargados y prevenir fraudes</strong>
              </li>
              <li>
                <strong>Enviar notificaciones operativas esenciales (confirmaciones de turno, recordatorios próximos al partido, alertas de cancelación o vencimiento de suscripción).</strong>
              </li>
              <li>
                <strong>
                  Gestionar el cobro de la suscripción mensual del panel web (S/ 80.00/mes) y brindar soporte técnico.
                </strong>
              </li>
            </ul>
          </li>
          <li>
              <strong className="text-base font-semibold">Finalidades Necesarias(Ejecución del servicio):</strong>
              <ul className="mt-2 list-[circle] space-y-2 border-l-2 border-neutral-200 pl-6">
                <li>
                <strong>Únicamente si el usuario otorga su consentimiento adicional, enviar comunicaciones sobre descuentos en horarios, torneos locales o nuevas funcionalidades de Grassly.</strong>
                </li>
              </ul>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">5. Compartición con Terceros y Transferencia Internacional</h2>
        <ul className="mt-3 list-disc space-y-4 pl-5 leading-relaxed">
          <li>
            <strong>Compromiso de no comercialización:</strong> Grassly no vende, alquila ni cede bases de datos personales a terceros con fines publicitarios.
          </li>
          <li>
            <strong>Destinatarios necesarios en Perú:</strong> Cuando un jugador realiza una reserva, sus datos mínimos de identificación (nombre, teléfono y estado de pago) se comparten con el complejo deportivo correspondiente para gestionar el acceso al local.
          </li>
          <li><strong>Encargados de Tratamiento y Flujo Transfronterizo de Datos:</strong> Para garantizar la operatividad, seguridad y disponibilidad de la plataforma, Grassly realiza flujo transfronterizo de datos personales hacia servidores ubicados fuera del territorio peruano (principalmente en Estados Unidos), a través de los siguientes proveedores tecnológicos que actúan bajo estrictos estándares de seguridad y confidencialidad:
            <ul className="mt-2 list-[circle] space-y-2 border-l-2 border-neutral-200 pl-6">
              <li>
                <strong>Supabase Inc. (EE. UU.):</strong> Alojamiento de base de datos, gestión de autenticación y almacenamiento de comprobantes.
              </li>
              <li>
                <strong>Google LLC / Google Cloud (EE. UU.):</strong> Servicios de autenticación de identidad (Google OAuth) e infraestructura en la nube.
              </li>
              <li>
                <strong>Mapbox Inc. (EE. UU.):</strong> Procesamiento de geolocalización para visualización de mapas y cálculo de cercanía de complejos deportivos.
              </li>
              <li>
                <strong>Pasarelas de pago (Mercado Pago):</strong> Procesamiento de transacciones electrónicas, sujetas además a sus propias políticas de privacidad y normativas financieras vigentes.
              </li>
            </ul>
            Mediante el otorgamiento de su consentimiento expreso al registrarse o utilizar nuestros servicios, el titular autoriza de manera libre, previa e inequívoca esta transferencia internacional de datos para las finalidades descritas en la presente Política.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">6. Plazo de Conservación de los Datos</h2>
        <p className="mt-2 leading-relaxed">
          Los datos personales se conservarán mientras el usuario mantenga una cuenta activa en Grassly y sea necesario para cumplir con las finalidades descritas. Una vez que el usuario solicite la baja o eliminación de su cuenta, sus datos pasarán a un estado de bloqueo y posterior supresión definitiva, conservándose únicamente aquellos registros estrictamente exigidos por la legislación tributaria (SUNAT) o de protección al consumidor en Perú durante los plazos legales aplicables.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">7. Derechos ARCO y Procedimiento de Atención</h2>
        <ul className="mt-3 list-disc space-y-4 pl-5 leading-relaxed">
          <li> 
            Todo titular puede ejercer en cualquier momento sus derechos de Acceso (conocer qué datos almacenamos), Rectificación (actualizar o corregir datos inexactos), Cancelación (solicitar la eliminación de su cuenta y datos) y Oposición (limitar un uso específico).
          </li>
          <li>La solicitud debe enviarse al correo <a className="font-bold text-[#6E4BFF] underline" href="mailto:soporte@grassly.pe">
            soporte@grassly.pe
          </a> indicando el nombre completo, correo registrado y el detalle de su petición. Grassly responderá dentro de los plazos máximos establecidos por la normativa peruana: 8 días hábiles para solicitudes de información, 20 días hábiles para solicitudes de acceso y 10 días hábiles para solicitudes de rectificación, cancelación u oposición.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">8. Medidas de Seguridad de la Información</h2>
        <p className="mt-2 leading-relaxed">
          Grassly adopta medidas técnicas, organizativas y legales para evitar la pérdida, alteración, filtración o acceso no autorizado a los datos personales. Estas incluyen el cifrado de comunicaciones en tránsito mediante protocolos HTTPS/TLS, encriptación de credenciales, aislamiento estricto de datos entre complejos deportivos mediante políticas de seguridad a nivel de fila (Row Level Security) y control de accesos basado en roles.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">9. Protección de Menores de Edad</h2>
        <p className="mt-2 leading-relaxed">
          La creación de cuentas y la realización de transacciones en Grassly están dirigidas exclusivamente a personas mayores de 18 años. En caso de que un menor de edad utilice la plataforma, deberá contar con la autorización y supervisión directa de sus padres o tutores legales.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">10. Uso de Cookies y Tecnologías Similares</h2>
        <p className="mt-2 leading-relaxed">
          La plataforma web de Grassly utiliza cookies esenciales y almacenamiento local del navegador estrictamente necesarios para mantener la sesión iniciada, recordar preferencias de interfaz y garantizar la seguridad durante la navegación. El usuario puede configurar su navegador para bloquear o eliminar cookies, aunque esto podría afectar el funcionamiento del inicio de sesión.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">11. Modificaciones a la Política de Privacidad</h2>
        <p className="mt-2 leading-relaxed">
          Grassly se reserva el derecho de actualizar o modificar esta Política de Privacidad para adaptarla a nuevas funcionalidades de la plataforma o cambios normativos. Toda modificación sustancial será publicada en esta misma página indicando la fecha de actualización y, de ser relevante, notificada a los usuarios registrados mediante correo electrónico o aviso dentro de la aplicación.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-black text-[#151c16]">12. Contacto y Consultas de Privacidad</h2>
        <p className="mt-2 leading-relaxed">
          Si tienes dudas sobre esta Política de Privacidad, deseas actualizar tus datos o solicitar la eliminación de tu cuenta, puedes escribirnos directamente a soporte@grassly.pe indicando en el asunto "Privacidad / Derechos ARCO"
        </p>
      </section>

      <section className="rounded-xl border border-[#151c16]/10 bg-white/70 p-4">
        <p className="text-sm leading-relaxed">
          Para conocer las reglas de uso y suscripción, consulta nuestros{' '}
          <Link href="/terminos" className="font-bold text-[#6E4BFF] underline">
            Términos y Condiciones
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  )
}