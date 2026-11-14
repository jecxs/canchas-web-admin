import type { Metadata } from 'next'
import { AppDetallesScrolly } from '@/components/app-detalles-scrolly'
import { Footer } from '@/components/landing/footer'
import { Navbar } from '@/components/landing/navbar'

export const metadata: Metadata = {
  title: 'App móvil | Grassly',
  description:
    'Encuentra canchas, conoce sus detalles y reserva desde la app móvil de Grassly.',
}

export default function AppDetallesPage() {
  return (
    <>
      <Navbar />
      <AppDetallesScrolly />
      <Footer />
    </>
  )
}
