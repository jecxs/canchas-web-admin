import { Logout01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { signOutAction } from '@/lib/auth/actions'

export function SignOutButton({
  className = '',
  withIcon = false,
}: {
  className?: string
  withIcon?: boolean
}) {
  return (
    <form action={signOutAction} className="contents">
      <button type="submit" className={className}>
        {withIcon ? <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-4" /> : null}
        Cerrar sesión
      </button>
    </form>
  )
}
