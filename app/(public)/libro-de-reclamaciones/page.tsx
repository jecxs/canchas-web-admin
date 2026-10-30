import { LegalPageShell } from '@/components/legal-page-shell'

export default function ComplaintsBookPage() {
  return (
    <LegalPageShell title="Libro de Reclamaciones">
      <p>
        Esta página de ejemplo describe los campos que podría incluir el libro de reclamaciones de Grassly.
      </p>
      <fieldset disabled className="grid gap-5">
        <legend className="text-lg font-black text-[#151c16]">Datos de ejemplo</legend>
        <label className="grid gap-2 font-bold text-[#151c16]">
          Nombre completo
          <input
            type="text"
            placeholder="Ejemplo: Ana Pérez"
            className="min-h-12 rounded-xl border-2 border-[#151c16]/20 bg-white px-4 font-normal"
          />
        </label>
        <label className="grid gap-2 font-bold text-[#151c16]">
          Correo electrónico
          <input
            type="email"
            placeholder="Ejemplo: ana@correo.com"
            className="min-h-12 rounded-xl border-2 border-[#151c16]/20 bg-white px-4 font-normal"
          />
        </label>
        <label className="grid gap-2 font-bold text-[#151c16]">
          Detalle del reclamo o queja
          <textarea
            rows={5}
            placeholder="Describe aquí lo sucedido."
            className="rounded-xl border-2 border-[#151c16]/20 bg-white px-4 py-3 font-normal"
          />
        </label>
        <button type="button" className="min-h-12 rounded-full bg-[#151c16] px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          Envío no disponible en esta muestra
        </button>
      </fieldset>
      <p>
        Este formulario es demostrativo: no se reciben ni almacenan reclamos. No ingreses información personal. El canal oficial y la información requerida deben ser implementados y revisados antes de habilitar esta página.
      </p>
    </LegalPageShell>
  )
}
