import { EmptyState } from '@/components/states'
import { requireOwner } from '@/lib/auth/dal'

export default async function OwnerWithoutLocalPage() {
  await requireOwner()

  return (
    <div className="mx-auto max-w-3xl py-6">
      <EmptyState
        title="No encontramos un local asociado"
        description="Tu cuenta figura como propietaria, pero todavía no tiene un local vinculado. El equipo de Grassly debe revisar este caso antes de habilitar operaciones."
      />
    </div>
  )
}
