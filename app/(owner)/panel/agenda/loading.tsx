export default function AgendaLoading() {
  return (
    <div className="mx-auto w-full max-w-[1440px] animate-pulse">
      <div className="h-3 w-28 rounded-full bg-muted" />
      <div className="mt-5 h-11 w-48 rounded-xl bg-muted" />
      <div className="mt-3 h-5 w-full max-w-xl rounded-full bg-muted" />
      <div className="mt-8 h-16 rounded-2xl border bg-card" />
      <div className="mt-6 h-[620px] rounded-2xl border bg-card" />
    </div>
  )
}

