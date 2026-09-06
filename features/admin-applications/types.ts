export type AdminApplicationStatus =
  | 'pendiente_aprobacion'
  | 'aprobado_pendiente_pago'
  | 'rechazado'

export type AdminApplication = {
  id: string
  ownerId: string
  name: string
  address: string
  ruc: string | null
  status: AdminApplicationStatus
  rejectionReason: string | null
  createdAt: string
  approvedAt: string | null
  owner: {
    name: string
    email: string | null
    phone: string | null
    dni: string | null
  }
}

export type AdminDecisionState = {
  success: boolean
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export const initialAdminDecisionState: AdminDecisionState = { success: false }
