import { redirectToPostLoginDestination } from '@/lib/auth/dal'

export default function ContinueAfterAuthPage() {
  return redirectToPostLoginDestination()
}

