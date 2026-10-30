'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { notify } from '@/lib/notifications/notify'
import { createClient } from '@/utils/supabase/client'

export function GoogleSignInButton() {
  const handleGoogleLogin = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      console.error('[google-oauth]', { code: error.code ?? 'unknown' })
      notify.error()
    }
  }

  return (
    <Button type="button" variant="secondary" size="lg" onClick={handleGoogleLogin} className="mt-8 h-12 w-full rounded-xl text-sm font-bold">
      <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-white p-1">
        <svg viewBox="0 0 48 48" className="size-full">
          <path
            fill="#4285F4"
            d="M43.6 24.5c0-1.6-.1-3.1-.4-4.6H24v8.7h11c-.5 2.8-2.1 5.2-4.5 6.8l7.3 5.7c4.3-4 6.8-9.9 6.8-16.6z"
          />
          <path
            fill="#34A853"
            d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-7.3-5.7c-2 1.3-4 2-6.2 2-4.7 0-8.7-3.2-10.1-7.5l-7.6 5.9C9.9 39.9 16.4 44 24 44z"
          />
          <path
            fill="#FBBC05"
            d="M13.9 27.9a12.1 12.1 0 0 1 0-7.8l-7.6-5.9a20 20 0 0 0 0 19.6l7.6-5.9z"
          />
          <path
            fill="#EA4335"
            d="M24 9.6c3 0 5.7 1 7.8 3.1l6.5-6.5C34.4 2.3 29.5 0 24 0 16.4 0 9.9 4.1 6.3 10.2l7.6 5.9C15.3 12.8 19.3 9.6 24 9.6z"
          />
        </svg>
      </span>
      Continuar con Google
      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
    </Button>
  )
}
