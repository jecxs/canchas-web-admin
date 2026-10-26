import Image from "next/image"
import { cn } from "cn"

type GrasslyMarkProps = {
  className?: string
  inverted?: boolean
}

export function GrasslyIcon({ className }: { className?: string }) {
  return (
    <span className={cn("relative block size-10 shrink-0 overflow-hidden", className)}>
      <Image
        src="/iconGrasslysinFondo.png"
        alt="Grassly"
        fill
        sizes="80px"
        className="scale-[1.9] object-contain"
      />
    </span>
  )
}

export function GrasslyMark({ className, inverted = false }: GrasslyMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 font-extrabold tracking-tight",
        inverted ? "text-sidebar-foreground" : "text-foreground",
        className,
      )}
    >
      <GrasslyIcon />
      Grassly
    </span>
  )
}
