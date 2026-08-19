import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {cookies} from "next/headers";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Redirige al formulario tras iniciar sesión con éxito
            return NextResponse.redirect(`${origin}/completar-registro`)
        }
    }

    // Si hubo error, redirige al inicio
    return NextResponse.redirect(`${origin}?error=AuthFailed`)
}