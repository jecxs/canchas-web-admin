'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  // NUEVO: Verificar sesión activa al entrar a la web
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Si ya hay sesión guardada, revisamos su perfil
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', user.id)
            .single()

        // Lo mandamos directo a su panel
        if (perfil?.rol === 'dueno') {
          router.push('/inicio')
        } else {
          router.push('/completar-registro')
        }
      } else {
        // Si no hay sesión, mostramos el botón de Google
        setChecking(false)
      }
    }

    checkSession()
  }, [router, supabase])

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  // Pantalla de carga mientras revisa si ya iniciaste sesión antes
  if (checking) {
    return <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Cargando...</main>
  }

  return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-sm w-full text-center shadow-xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Plataforma de Canchas</h1>
            <p className="text-slate-400 text-sm mt-1">Registro de Propietario</p>
          </div>
          <button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-3"
          >
            Continuar con Google
          </button>
        </div>
      </main>
  )
}