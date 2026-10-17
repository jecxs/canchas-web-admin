import { getAdminMonitoring } from '@/features/admin-monitoring/queries'
import { MonitoringBoard } from '@/features/admin-monitoring/monitoring-board'
import type { AuditActorRole } from '@/features/admin-monitoring/types'

type MonitoreoSearchParams = Promise<{
  desde?: string
  hasta?: string
  local?: string
  rol?: string
  accion?: string
  entidad?: string
  page?: string
}>

function iso(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}

const ROLES: AuditActorRole[] = ['cliente', 'dueno', 'super_admin']

export default async function MonitoreoPage({
  searchParams,
}: {
  searchParams: MonitoreoSearchParams
}) {
  const params = await searchParams
  const rol = ROLES.includes(params.rol as AuditActorRole) ? (params.rol as AuditActorRole) : undefined
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  const data = await getAdminMonitoring(
    {
      desde: iso(params.desde),
      hasta: iso(params.hasta),
      local: params.local || undefined,
      rol,
      accion: params.accion || undefined,
      entidad: params.entidad || undefined,
    },
    page,
  )

  return <MonitoringBoard data={data} />
}
