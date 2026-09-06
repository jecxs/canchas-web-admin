import 'server-only'

import { createClient } from '@/utils/supabase/server'
import type { PublicationChecklist } from './types'

export async function getPublicationChecklist(localId: string): Promise<PublicationChecklist> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('obtener_checklist_publicacion_local', {
    p_local_id: localId,
  })

  if (error || !data?.[0]) {
    console.error('[local-publication:checklist]', { code: error?.code })
    throw new Error('No se pudo cargar el avance de configuración.')
  }

  const checklist = data[0]
  return {
    access: checklist.acceso_operativo,
    generalData: checklist.datos_generales,
    location: checklist.ubicacion,
    logo: checklist.logo,
    gallery: checklist.galeria,
    schedules: checklist.horarios,
    courtsAndRates: checklist.canchas_y_tarifas,
    advance: checklist.adelanto,
    paymentMethods: checklist.medios_pago,
    refundPolicy: checklist.politica_reembolso,
    ready: checklist.listo_para_publicar,
  }
}
