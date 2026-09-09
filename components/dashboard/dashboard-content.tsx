import { cn } from '@/lib/utils'

export function DashboardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dashboard-content"
      className={cn(
        'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 [scrollbar-gutter:stable] motion-safe:scroll-smooth md:px-6 md:py-8 lg:px-8',
        className,
      )}
      {...props}
    />
  )
}
