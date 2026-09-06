import { PageSkeleton } from '@/components/states'

export default function RootLoading() {
  return (
    <main className="flex-1 p-5 md:p-8">
      <PageSkeleton />
    </main>
  )
}
