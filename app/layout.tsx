import type { Metadata } from "next"
import { GrasslyToaster } from "@/components/notifications/grassly-toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

export const metadata: Metadata = {
  title: "Grassly | Gestión de grasses y reservas en Ayacucho",
  description:
    "Panel para dueños de grasses: reservas, canchas, locales y operación diaria en un solo lugar. El partido empieza antes de llegar a la cancha.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <GrasslyToaster />
      </body>
    </html>
  )
}
