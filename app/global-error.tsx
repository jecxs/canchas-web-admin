'use client'

import { ErrorState } from '@/components/states'
import './globals.css'

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="grid min-h-full place-items-center bg-background p-5">
        <title>Ocurrió un error | Grassly</title>
        <ErrorState
          error={error}
          retry={retry}
          title="Grassly no pudo iniciar correctamente"
          description="Ocurrió un fallo inesperado al preparar la aplicación. Vuelve a intentarlo."
          className="w-full max-w-2xl"
        />
      </body>
    </html>
  )
}
