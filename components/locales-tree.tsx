const localesTree = [
    {
        sede: 'Complejo Norte',
        canchas: [
            {nombre: 'Cancha Principal', deportes: ['Fútbol']},
            {nombre: 'Cancha Multiuso', deportes: ['Vóley', 'Básquet']},
        ],
    },
    {
        sede: 'Complejo Sur',
        canchas: [{nombre: 'Cancha 1', deportes: ['Fútbol', 'Básquet']}],
    },
]

export function LocalesTree() {
    return (
        <div className="rounded-2xl border border-sidebar-foreground/10 bg-sidebar-foreground/[.06] p-6 sm:p-7">
            <p className="text-sm font-black">Tu cuenta</p>
            <ul className="mt-3 space-y-4 border-l border-sidebar-foreground/25 pl-5">
                {localesTree.map((item) =>
                    <li key={item.sede} className="relative">
                        <span aria-hidden className="absolute -left-5 top-3 h-px w-4 bg-sidebar-foreground/25"/>
                        <p className="text-sm font-bold">
                            {item.sede} <span className="font-normal text-sidebar-foreground/60">(sede)</span>
                        </p>
                        <ul className="mt-2 space-y-2 border-l border-sidebar-foreground/25 pl-5">
                            {item.canchas.map((cancha) =>
                                <li key={cancha.nombre} className="relative flex flex-wrap items-center gap-2">
                                    <span aria-hidden className="absolute -left-5 top-3 h-px w-4 bg-sidebar-foreground/25"/>
                                    <span className="text-sm text-sidebar-foreground/90">{cancha.nombre}:</span>
                                    {cancha.deportes.map((deporte) =>
                                        <span key={deporte}
                                              className="rounded-full border border-sidebar-foreground/30 px-2.5 py-0.5 text-xs font-bold">
                                            {deporte}
                                        </span>)}
                                </li>)}
                        </ul>
                    </li>)}
            </ul>
        </div>
    )
}
