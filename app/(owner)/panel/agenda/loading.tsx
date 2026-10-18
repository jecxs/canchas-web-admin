export default function AgendaLoading() {
  return (
    <div className="mx-auto w-full max-w-[1440px] animate-pulse">
      <div className="h-2.5 w-24 rounded-full bg-muted" />
      <div className="mt-3 h-10 w-40 rounded-lg bg-muted" />
      <div className="mt-3 h-4 w-full max-w-md rounded-full bg-muted" />
      <div className="mt-6 h-16 rounded-2xl border bg-card" />
      <div className="mt-5 h-[560px] rounded-2xl border bg-card" />
    </div>
  )
}
