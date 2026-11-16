const locations = [
    {
        name: 'Complejo Norte',
        active: true,
        sports: [
            {name: 'Fútbol', primary: true},
            {name: 'Vóley', primary: false},
            {name: 'Básquet', primary: false},
        ],
    },
    {
        name: 'Complejo Sur',
        active: false,
        sports: [
            {name: 'Fútbol', primary: false},
            {name: 'Básquet', primary: false},
        ],
    },
]

export function LocalesTree() {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#1a241b]/60 p-5 shadow-2xl backdrop-blur-md sm:p-6">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-gray-500">
                Tu cuenta / Sedes activas
            </p>
            <ul className="space-y-3">
                {locations.map((location) =>
                    <li
                        key={location.name}
                        className={`group flex flex-col gap-4 rounded-xl p-5 transition-all duration-300 hover:border-[#6E4BFF] hover:bg-[#6E4BFF]/10 sm:flex-row sm:items-center sm:justify-between ${
                            location.active
                                ? 'border border-[#D7FF38] bg-[#151c16]/90'
                                : 'border border-white/10 bg-[#151c16]/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span
                                aria-hidden="true"
                                className={`h-2 w-2 shrink-0 rounded-full ${
                                    location.active
                                        ? 'animate-pulse bg-[#D7FF38] transition-colors group-hover:bg-[#6E4BFF]'
                                        : 'bg-gray-500 transition-colors group-hover:bg-[#6E4BFF]'
                                }`}
                            />
                            <span className={`text-lg font-bold tracking-wide transition-colors duration-300 group-hover:text-[#6E4BFF] ${location.active ? 'text-white' : 'text-gray-400'}`}>
                                {location.name}
                            </span>
                            <span className="sr-only">{location.active ? 'Sede activa' : 'Sede inactiva'}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                            {location.sports.map((sport) =>
                                <span
                                    key={sport.name}
                                    className={`rounded-sm px-2.5 py-1 text-xs ${
                                        location.active && sport.primary
                                            ? 'bg-[#D7FF38] font-bold text-[#151c16]'
                                            : 'border border-white/10 bg-white/5 text-gray-300'
                                    }`}
                                >
                                    {sport.name}
                                </span>)}
                        </div>
                    </li>)}
            </ul>
        </div>
    )
}
