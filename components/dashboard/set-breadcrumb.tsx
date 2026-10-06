'use client'

import { useEffect } from 'react'
import { setEntityBreadcrumb } from './breadcrumb-store'

export function SetBreadcrumb({ label }: { label: string }) {
  useEffect(() => {
    setEntityBreadcrumb(label)
    return () => setEntityBreadcrumb(null)
  }, [label])

  return null
}
