'use client'

import { useEffect } from 'react'
import { notify } from '@/lib/notifications/notify'

export function AuthErrorNotification({ show }: { show: boolean }) {
  useEffect(() => {
    if (show) notify.error()
  }, [show])

  return null
}
