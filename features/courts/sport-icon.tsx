type SportIconProps = {
  name: string
  inactive?: boolean
}

type SportKind = 'football' | 'volleyball' | 'basketball' | 'generic'

function normalize(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function kindFor(name: string): SportKind {
  const normalized = normalize(name)
  if (normalized.includes('futbol') || normalized.includes('fulbito')) return 'football'
  if (normalized.includes('voley')) return 'volleyball'
  if (normalized.includes('basquet') || normalized.includes('basket')) return 'basketball'
  return 'generic'
}

export function SportIcon({ name, inactive = false }: SportIconProps) {
  const kind = kindFor(name)
  const color = inactive ? 'text-muted-foreground' : 'text-success-foreground'

  return (
    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${inactive ? 'bg-muted' : 'bg-primary/18'} ${color}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="size-[1.35rem]" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
        {kind === 'football' && (
          <>
            <rect x="3" y="5" width="18" height="14" rx="1.5" />
            <path d="M12 5v14M3 9h3v6H3m18-6h-3v6h3" />
            <circle cx="12" cy="12" r="2.2" />
          </>
        )}
        {kind === 'volleyball' && (
          <>
            <rect x="3" y="5" width="18" height="14" rx="0.75" />
            <path d="M9 5v14M15 5v14" />
            <path d="M12 5v14" strokeDasharray="2 2" />
          </>
        )}
        {kind === 'basketball' && (
          <>
            <rect x="3" y="4" width="18" height="16" rx="1.5" />
            <path d="M12 4v16M3 12h18M3 8a7 7 0 0 1 0 8M21 8a7 7 0 0 0 0 8" />
            <circle cx="12" cy="12" r="2" />
          </>
        )}
        {kind === 'generic' && <><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="M12 4v16M3 12h18" /></>}
      </svg>
    </span>
  )
}
