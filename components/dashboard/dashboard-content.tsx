import { cn } from '@/lib/utils'

export function DashboardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dashboard-content"
      className={cn('flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8', className)}
      {...props}
    />
  )
}
