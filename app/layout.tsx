import type { Metadata } from "next";
import "./globals.css";



export const metadata: Metadata = {
  title: "Tu Cancha | Gestión inteligente para canchas deportivas",
  description: "Centraliza reservas, canchas, locales y métricas en un solo panel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
