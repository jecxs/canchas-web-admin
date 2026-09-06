import { PageSkeleton } from '@/components/states'

export default function PublicLoading() {
  return (
    <main className="flex-1 p-5 md:p-8">
      <PageSkeleton className="max-w-5xl" />
    </main>
  )
}
