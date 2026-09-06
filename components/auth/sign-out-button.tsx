import { signOutAction } from '@/lib/auth/actions'

export function SignOutButton({ className = '' }: { className?: string }) {
  return (
    <form action={signOutAction} className="contents">
      <button type="submit" className={className}>Cerrar sesión</button>
    </form>
  )
}
