import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type SkeletonProps = {
  className?: string
}

export function SectionSkeleton({ className }: SkeletonProps) {
  return (
    <section
      role="status"
      aria-label="Cargando sección"
      className={cn('rounded-2xl border bg-card p-5 shadow-card md:p-6', className)}
    >
      <span className="sr-only">Cargando sección…</span>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-52 max-w-full" />
        </div>
        <Skeleton className="size-10 rounded-xl" />
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="hidden h-28 rounded-xl xl:block" />
      </div>
    </section>
  )
}

export function PageSkeleton({ className }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Cargando página"
      className={cn('mx-auto w-full max-w-[1600px] space-y-6', className)}
    >
      <span className="sr-only">Cargando página…</span>
      <header className="space-y-3 py-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-64 max-w-[75vw]" />
        <Skeleton className="h-4 w-96 max-w-[90vw]" />
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <SectionSkeleton />
    </div>
  )
}
