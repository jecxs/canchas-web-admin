'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notify } from '@/lib/notifications/notify'
import { ownerApplicationMessages } from './messages'

export function OwnerApplicationFeedback({ submitted }: { submitted: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (submitted) {
      notify.success({
        description: ownerApplicationMessages.submitted,
      })
      router.replace('/estado-solicitud', { scroll: false })
    }
  }, [router, submitted])

  return null
}
