import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type ModulePlaceholderProps = {
  eyebrow: string
  title: string
  description: string
}

export function ModulePlaceholder({ eyebrow, title, description }: ModulePlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <Badge variant="neutral">{eyebrow}</Badge>
      <h1 className="mt-5 text-4xl font-black tracking-[-.04em] sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
      <Card className="mt-8 max-w-2xl border-dashed bg-card/60 shadow-none">
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            La navegación y los permisos de este módulo ya están preparados. Su funcionalidad se incorporará en la fase correspondiente del MVP.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
