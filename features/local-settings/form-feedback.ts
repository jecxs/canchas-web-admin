'use client'

import { useEffect } from 'react'
import { notify } from '@/lib/notifications/notify'
import { getSettingsValidationFeedback } from './form-feedback-utils'
import type { SettingsActionState } from './types'

export { getSettingsValidationFeedback } from './form-feedback-utils'

export function useSettingsFormFeedback(state: SettingsActionState) {
  useEffect(() => {
    if (!state.message) return
    if (state.success) {
      notify.success({ description: state.message })
      return
    }

    const validationFeedback = getSettingsValidationFeedback(state.fieldErrors)
    if (validationFeedback) {
      notify.warning(validationFeedback)
      return
    }

    if (state.message === 'Revisa los campos indicados') {
      notify.warning({ description: 'No pudimos identificar el campo desde el servidor. Verifica los datos e inténtalo de nuevo.' })
      return
    }

    notify.error({ description: state.message })
  }, [state])
}
