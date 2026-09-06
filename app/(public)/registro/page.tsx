import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, SecurityCheckIcon } from '@hugeicons/core-free-icons'
import { GrasslyMark } from '@/components/brand/grassly-mark'
import { AuthErrorNotification } from '@/components/auth/auth-error-notification'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { redirectAuthenticatedUser } from '@/lib/auth/dal'

export default async function RegistroPage({
  searchParams,
}: PageProps<'/registro'>) {
  await redirectAuthenticatedUser()
  const { error } = await searchParams

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-sidebar px-5 py-6 text-sidebar-foreground lg:grid-cols-2 lg:px-8">
      <AuthErrorNotification show={error === 'AuthFailed'} />
      <div className="absolute -left-48 -top-40 h-[35rem] w-[35rem] rounded-full border border-primary/25" />
      <div className="relative z-10 flex flex-col">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-sidebar-foreground/65 transition hover:text-primary">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /> Volver a la landing
        </Link>
        <div className="mt-10">
          <GrasslyMark inverted className="text-xl" />
        </div>
        <div className="my-auto hidden max-w-lg pb-12 pt-28 lg:block">
          <p className="eyebrow text-primary">El primer paso</p>
          <h1 className="mt-5 text-6xl font-black uppercase leading-[.85] tracking-[-.07em]">
            Ordena tu cancha.<br /><span className="text-primary">Hazla crecer.</span>
          </h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-sidebar-foreground/70">
            Registra tu local y prepara la gestión de tus reservas en un solo panel.
          </p>
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-center py-12 lg:py-0">
        <div className="w-full max-w-md rounded-[2rem] border border-sidebar-foreground/10 bg-card p-8 text-card-foreground shadow-floating sm:p-10">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-success-foreground">
            <HugeiconsIcon icon={SecurityCheckIcon} strokeWidth={2} className="size-5" />
          </span>
          <p className="eyebrow mt-7">Para propietarios y administración</p>
          <h2 className="mt-3 text-4xl font-black tracking-[-.055em]">Ingresa a Grassly</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Usa tu cuenta de Google. Grassly te llevará al espacio que corresponde a tu rol y al estado de tu local.
          </p>
          <GoogleSignInButton />
          <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
            Si todavía no tienes un local registrado, podrás completar tu solicitud después de ingresar.
          </p>
        </div>
      </div>
    </main>
  )
}
