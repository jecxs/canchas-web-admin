'use client'

import { useEffect } from 'react'
import { notify } from '@/lib/notifications/notify'
import type { SettingsActionState } from './types'

export function useSettingsFormFeedback(state: SettingsActionState) {
  useEffect(() => {
    if (!state.message) return
    if (state.success) notify.success()
    else if (state.message === 'Revisa los campos indicados') notify.warning()
    else notify.error()
  }, [state])
}
