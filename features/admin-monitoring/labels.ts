import type { MonitoringOption } from './types'

// Etiquetas exactas para los valores que escribe la base de datos.
const ACTION_LABELS: Record<string, string> = {
  local_publicado: 'Local publicado',
  local_despublicado: 'Local despublicado',
  solicitud_local_aprobada: 'Solicitud de local aprobada',
  solicitud_local_rechazada: 'Solicitud de local rechazada',
  local_suspendido: 'Local suspendido',
  local_reactivado: 'Local reactivado',
  local_estado_actualizado: 'Estado del local actualizado',
  solicitud_propietario_registrada: 'Solicitud de propietario registrada',
  trial_local_otorgado: 'Trial de local otorgado',
  parametro_plataforma_actualizado: 'Parámetro de plataforma actualizado',
  perfil_rol_actualizado: 'Rol de perfil actualizado',
  propietario_rol_actualizado: 'Rol de propietario actualizado',
  bootstrap_super_admin: 'Superadministrador inicial creado',
}

const ENTITY_LABELS: Record<string, string> = {
  local: 'Local',
  parametros_globales: 'Parámetros globales',
  perfil: 'Perfil',
  propietario: 'Propietario',
  suscripcion: 'Suscripción',
  reserva: 'Reserva',
  cancha: 'Cancha',
  deporte: 'Deporte',
  tarifa: 'Tarifa',
  horario: 'Horario',
  configuracion: 'Configuración',
  medio_pago: 'Medio de pago',
  pago: 'Pago',
  usuario: 'Usuario',
  solicitud: 'Solicitud',
  promocion: 'Promoción',
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Superadmin',
  dueno: 'Dueño',
  cliente: 'Cliente',
}

// Tildes/ortografía para el respaldo cuando el valor no está en el diccionario.
const WORD_FIXES: Record<string, string> = {
  parametro: 'parámetro',
  parametros: 'parámetros',
  configuracion: 'configuración',
  suscripcion: 'suscripción',
  publicacion: 'publicación',
  promocion: 'promoción',
  numero: 'número',
  categoria: 'categoría',
  telefono: 'teléfono',
  dias: 'días',
  expiracion: 'expiración',
  minimo: 'mínimo',
  maximo: 'máximo',
  limite: 'límite',
  recordatorio: 'recordatorio',
}

function humanize(raw: string) {
  const words = raw
    .trim()
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => WORD_FIXES[word] ?? word)
  if (!words.length) return raw
  const text = words.join(' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function actionLabel(raw: string) {
  const key = raw.trim().toLowerCase()
  return ACTION_LABELS[key] ?? humanize(key)
}

export function entityLabel(raw: string) {
  const key = raw.trim().toLowerCase()
  return ENTITY_LABELS[key] ?? humanize(key)
}

export function roleLabel(raw: string | null | undefined) {
  if (!raw) return '—'
  return ROLE_LABELS[raw] ?? humanize(raw)
}

export function buildOptions(values: string[], labelOf: (value: string) => string): MonitoringOption[] {
  return [...new Set(values)]
    .sort((a, b) => labelOf(a).localeCompare(labelOf(b), 'es'))
    .map((value) => ({ value, label: labelOf(value) }))
}

export const ROLE_OPTIONS: MonitoringOption[] = [
  { value: 'super_admin', label: 'Superadmin' },
  { value: 'dueno', label: 'Dueño' },
  { value: 'cliente', label: 'Cliente' },
]

const FIELD_LABELS: Record<string, string> = {
  estado: 'Estado',
  publicado: 'Publicado',
  publicado_at: 'Fecha de publicación',
  dueno_id: 'Dueño',
  aprobado_por: 'Aprobado por',
  fecha_aprobacion: 'Fecha de aprobación',
  fecha_fin_trial: 'Fin de trial',
  motivo_rechazo: 'Motivo de rechazo',
  motivo: 'Motivo',
  rol: 'Rol',
  telefono: 'Teléfono',
  dni: 'DNI',
  nombre: 'Nombre',
  ruc: 'RUC',
  direccion: 'Dirección',
  descripcion: 'Descripción',
  telefono_contacto_principal: 'Teléfono de contacto',
  tipo: 'Tipo',
  valor: 'Valor',
  clave: 'Parámetro',
  palabras_prohibidas: 'Palabras prohibidas',
  minutos_expiracion_pendiente_pago: 'Minutos de expiración de pago pendiente',
  porcentaje_adelanto_minimo: 'Porcentaje de adelanto mínimo',
  locales_por_debajo: 'Locales por debajo del valor',
}

export function fieldLabel(raw: string) {
  const key = raw.trim().toLowerCase()
  return FIELD_LABELS[key] ?? humanize(key)
}

// Campos que guardan el id de una persona (se resuelven a su nombre en el panel).
export const PERSON_FIELDS = new Set([
  'aprobado_por',
  'dueno_id',
  'autorizado_por',
  'registrado_por',
  'actor_id',
])
