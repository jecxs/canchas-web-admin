'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'CL'
  )
}

// Foto del cliente con iniciales como respaldo. Se usa en el directorio de
// clientes, al asociar un cliente a una reserva y en el dashboard del dueño.
// `AvatarImage` solo se muestra cuando la URL carga, así que si la cuenta no
// tiene foto (o la URL falla) se ven las iniciales sin romper el layout.
export function ClientAvatar({
  src,
  name,
  size = 'default',
  className,
  fallbackClassName,
}: {
  src: string | null | undefined
  name: string
  size?: 'default' | 'sm' | 'lg'
  className?: string
  fallbackClassName?: string
}) {
  return (
    <Avatar size={size} className={cn('shrink-0', className)}>
      {src ? (
        <AvatarImage src={src} alt="" referrerPolicy="no-referrer" className="object-cover" />
      ) : null}
      <AvatarFallback className={cn('text-[11px] font-black', fallbackClassName)}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
