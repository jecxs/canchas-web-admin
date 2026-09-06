'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notify } from '@/lib/notifications/notify'

const resultMessages = {
  aprobada: 'Solicitud aprobada para pago',
  trial: 'Periodo de prueba activado',
  rechazada: 'Observación enviada al propietario',
} as const

export function AdminDecisionFeedback({ result }: { result?: string }) {
  const router = useRouter()

  useEffect(() => {
    if (!result || !(result in resultMessages)) return
    notify.success({
      title: 'Cambios guardados',
      description: resultMessages[result as keyof typeof resultMessages],
    })
    router.replace('/admin/solicitudes', { scroll: false })
  }, [result, router])

  return null
}
