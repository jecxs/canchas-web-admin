'use client'

import { ErrorState } from '@/components/states'

export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-5">
      <ErrorState error={error} retry={retry} className="w-full max-w-2xl" />
    </main>
  )
}
