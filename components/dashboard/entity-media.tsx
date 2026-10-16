import { HugeiconsIcon } from '@hugeicons/react'
import { Building03Icon } from '@hugeicons/core-free-icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?'
}

// Foto de perfil de una persona (propietario). La BD todavía no almacena el
// avatar, así que cae a las iniciales hasta que exista `perfiles.avatar_url`.
export function EntityAvatar({
  src,
  name,
  size = 'default',
  className,
}: {
  src: string | null
  name: string
  size?: 'default' | 'sm' | 'lg'
  className?: string
}) {
  return (
    <Avatar size={size} className={cn('ring-2 ring-border', className)}>
      {src ? <AvatarImage src={src} alt="" referrerPolicy="no-referrer" /> : null}
      <AvatarFallback className="bg-primary text-xs font-black text-primary-foreground">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

// Logo del local. Se muestra la imagen real cuando existe; si no, un ícono.
export function LocalLogo({
  src,
  name,
  className,
}: {
  src: string | null
  name: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border/70 bg-primary/18 text-primary',
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Logo de ${name}`} className="size-full object-cover" />
      ) : (
        <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-5" />
      )}
    </span>
  )
}
