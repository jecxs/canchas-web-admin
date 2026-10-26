import { HugeiconsIcon } from '@hugeicons/react'
import { Cashier02Icon, Download01Icon, Invoice03Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getOwnerDataContext } from '@/features/owner-data/queries'

export default async function OwnerDataPage() {
  const context = await getOwnerDataContext()

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div>
        <p className="eyebrow">Respaldo</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Mis datos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Descarga tu información en Excel aunque el panel esté restringido por moderación o facturación.
          Incluye todo el historial de tu local.
        </p>
      </div>

      {context ? (
        <Card>
          <CardHeader><CardTitle>{context.localName}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Elige qué quieres descargar. Los archivos se abren en Excel o Google Sheets.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href="/panel/mis-datos/export?tipo=reservas" download>
                  <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} className="size-4" aria-hidden="true" />
                  Reservas (Excel)
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/panel/mis-datos/export?tipo=caja" download>
                  <HugeiconsIcon icon={Cashier02Icon} strokeWidth={2} className="size-4" aria-hidden="true" />
                  Caja (Excel)
                </a>
              </Button>
            </div>
            <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="font-bold">Reservas</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fecha, horario, cancha, deporte, cliente, estado, canal y montos (total, adelanto, cobrado, saldo, reembolso, extensión).
                </p>
              </div>
              <div>
                <p className="font-bold">Caja</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cada cobro y reembolso con su medio, más el resumen por medio y el neto del periodo.
                </p>
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Download01Icon} strokeWidth={2} className="size-3.5" aria-hidden="true" />
              El respaldo no depende de que tu suscripción esté activa.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No tienes un local asociado para exportar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
