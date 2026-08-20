'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function InicioPage() {
    const router = useRouter()
    const supabase = createClient()

    const [perfil, setPerfil] = useState<any>(null)
    const [local, setLocal] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/')
                return
            }

            // 1. Traer perfil
            const { data: perfilData } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', user.id)
                .single()

            setPerfil(perfilData)

            // 2. Traer el local
            const { data: localData } = await supabase
                .from('locales')
                .select('*')
                .eq('dueno_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            setLocal(localData)
            setLoading(false)
        }

        fetchData()
    }, [router, supabase])

    // FUNCIÓN PARA ROMPER EL BUCLE Y CERRAR SESIÓN
    const handleCerrarSesion = async () => {
        await supabase.auth.signOut() // Esto destruye la sesión en el navegador
        router.push('/') // Ahora sí, el inicio no te devolverá aquí
    }

    if (loading) {
        return <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Cargando datos...</main>
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full space-y-6">

                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                        ✓
                    </div>
                    <h1 className="text-2xl font-bold">¡Registro Recibido!</h1>
                    <p className="text-slate-400 text-xs">
                        Tu local ha quedado registrado en estado <span className="text-amber-400 font-semibold">pendiente de aprobación</span>.
                    </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-sm">
                    <div className="border-b border-slate-800 pb-2">
                        <span className="text-xs text-slate-500 block uppercase font-semibold">Datos del Local</span>
                        <p className="text-blue-400 font-bold text-base">{local?.nombre || 'No registrado'}</p>
                        <p className="text-slate-300 text-xs">Dirección: {local?.direccion}</p>
                        <p className="text-slate-300 text-xs">RUC: {local?.ruc || 'Sin RUC'}</p>
                    </div>

                    <div>
                        <span className="text-xs text-slate-500 block uppercase font-semibold">Datos del Propietario</span>
                        <p className="text-slate-200 font-medium">{perfil?.nombre_completo}</p>
                        <p className="text-slate-400 text-xs">{perfil?.email}</p>
                        <p className="text-slate-400 text-xs">Teléfono: {perfil?.telefono}</p>
                        <p className="text-slate-400 text-xs">DNI: {perfil?.dni}</p>
                    </div>
                </div>

                {/* BOTÓN DE CIERRE DE SESIÓN */}
                <button
                    onClick={handleCerrarSesion}
                    className="block w-full text-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium py-2.5 rounded-lg transition text-sm"
                >
                    Cerrar Sesión y Volver al Inicio
                </button>
            </div>
        </main>
    )
}