'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function RegistroPage() {
  const supabase = createClient()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setChecking(false)
      const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
      router.push(perfil?.rol === 'dueno' ? '/inicio' : '/completar-registro')
    }
    checkSession()
  }, [router, supabase])

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
  }

  return <main className="relative grid min-h-screen overflow-hidden bg-[#071f3b] px-5 py-6 text-white lg:grid-cols-2 lg:px-8">
    <div className="absolute -left-48 -top-40 h-[35rem] w-[35rem] rounded-full border border-[#9add3c]/25" />
    <div className="relative z-10 flex flex-col"><Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-white/65 transition hover:text-[#9add3c]"><ArrowLeft className="h-4 w-4" /> Volver a la landing</Link><div className="relative mt-10 h-12 w-44"><Image src="/logo.png" alt="Tu Cancha" fill className="object-contain object-left" priority /></div><div className="my-auto hidden max-w-lg pb-12 pt-28 lg:block"><p className="eyebrow text-[#9add3c]">El primer paso</p><h1 className="mt-5 text-6xl font-black uppercase leading-[.85] tracking-[-.07em]">Ordena tu cancha.<br /><span className="text-[#9add3c]">Hazla crecer.</span></h1><p className="mt-7 max-w-md text-lg leading-8 text-[#bccddd]">Registra tu local y prepara la gestión de tus reservas en un solo panel.</p></div></div>
    <div className="relative z-10 flex items-center justify-center py-12 lg:py-0"><div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-8 text-[#09213e] shadow-2xl sm:p-10">{checking ? <div className="py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#dcead4] border-t-[#76ae2d]" /><p className="mt-4 text-sm text-[#647788]">Verificando tu cuenta…</p></div> : <><span className="grid h-11 w-11 place-items-center rounded-full bg-[#eaf5de] text-[#5b9821]"><ShieldCheck className="h-5 w-5" /></span><p className="eyebrow mt-7">Para propietarios</p><h2 className="mt-3 text-4xl font-black tracking-[-.055em]">Registra tu grass</h2><p className="mt-3 text-sm leading-6 text-[#617486]">Ingresa con Google para crear tu cuenta y registrar tu primer local.</p><button onClick={handleGoogleLogin} className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-[#09213e] px-4 py-4 text-sm font-bold text-white transition hover:bg-[#75ae29] hover:text-[#09213e]"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-black text-[#4285f4]">G</span> Continuar con Google <ArrowRight className="h-4 w-4" /></button><p className="mt-5 text-center text-xs leading-5 text-[#7b8c99]">Al continuar, podrás completar los datos de tu local y empezar a centralizar tus reservas.</p></>}</div></div>
  </main>
}
