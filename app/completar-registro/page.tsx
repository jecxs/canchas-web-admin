'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function CompletarRegistroPage() {
    const router = useRouter()
    const supabase = createClient()

    const [userId, setUserId] = useState<string | null>(null)
    const [telefono, setTelefono] = useState('')
    const [dni, setDni] = useState('')
    const [nombreCancha, setNombreCancha] = useState('')
    const [ruc, setRuc] = useState('')
    const [direccion, setDireccion] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true) // Iniciamos en true mientras verificamos sesión

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/')
                return
            }

            // 1. Verificamos si ya es dueño para no hacerle llenar esto de nuevo
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('rol, telefono')
                .eq('id', user.id)
                .single()

            if (perfil?.rol === 'dueno' && perfil?.telefono) {
                router.push('/inicio') // Si ya llenó el form, lo mandamos directo al éxito/panel
                return
            }

            setUserId(user.id)
            setLoading(false) // Terminó de verificar, mostramos el formulario
        }
        checkUser()
    }, [router, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (telefono.length !== 9) return setError('El celular debe tener 9 dígitos.')
        if (dni.length !== 8) return setError('El DNI debe tener 8 dígitos.')
        if (ruc && ruc.length !== 11) return setError('El RUC debe tener 11 dígitos.')

        setLoading(true)

        try {
            // 1. UPDATE PURO: Actualizamos el perfil que el Trigger ya creó
            const { error: perfilError } = await supabase
                .from('perfiles')
                .update({
                    telefono,
                    dni,
                    rol: 'dueno',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)

            if (perfilError) throw perfilError

            // 2. CREAR LOCAL
            const { error: localError } = await supabase
                .from('locales')
                .insert({
                    dueno_id: userId,
                    nombre: nombreCancha,
                    ruc: ruc.trim() === '' ? null : ruc,
                    direccion: direccion,
                    telefono_contacto_principal: telefono,
                    latitud: 0.0,
                    longitud: 0.0,
                    estado: 'pendiente_aprobacion',
                })

            if (localError) throw localError

            router.push('/inicio')
        } catch (err: any) {
            setError(err.message || 'Error al actualizar el registro.')
            setLoading(false)
        }
    }

    // Si está cargando la verificación, mostramos pantalla en negro/cargando
    if (loading) return <main className="min-h-screen bg-slate-950"></main>

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-md space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mt-2 text-white">Completa tus datos</h2>
                    <p className="text-sm text-slate-400">Asocia tu teléfono y DNI a tu cuenta de Google.</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Nombre de la Cancha / Local *</label>
                        <input type="text" value={nombreCancha} onChange={(e) => setNombreCancha(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-white" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Celular *</label>
                            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))} required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">DNI *</label>
                            <input type="text" value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))} required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-white" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Dirección *</label>
                        <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">RUC (Opcional)</label>
                        <input type="text" value={ruc} onChange={(e) => setRuc(e.target.value.replace(/\D/g, '').slice(0, 11))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-white" />
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 mt-2">
                        Finalizar Registro
                    </button>
                </form>
            </div>
        </main>
    )
}