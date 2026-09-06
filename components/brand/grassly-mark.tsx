import { cn } from "cn"

type GrasslyMarkProps = {
  className?: string
  inverted?: boolean
}

export function GrasslyMark({ className, inverted = false }: GrasslyMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-extrabold tracking-tight",
        inverted ? "text-sidebar-foreground" : "text-foreground",
        className,
      )}
    >
      <span className="grid size-8 place-items-center rounded-full bg-primary">
        <span className="size-2.5 rounded-full bg-primary-foreground" />
      </span>
      Grassly
    </span>
  )
}
