import { Skeleton } from '@/components/ui/skeleton'

export default function PricingLoading() {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <div><Skeleton className="h-4 w-36" /><Skeleton className="mt-4 h-12 w-80" /><Skeleton className="mt-3 h-5 w-full max-w-xl" /></div>
      <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-32 rounded-3xl" />)}</div>
      <Skeleton className="h-[520px] rounded-3xl" />
    </div>
  )
}
