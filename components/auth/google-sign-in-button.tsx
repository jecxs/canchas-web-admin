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
      <span className="grid size-5 place-items-center rounded-full bg-card text-[11px] font-black text-info">G</span>
      Continuar con Google
      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
    </Button>
  )
}
