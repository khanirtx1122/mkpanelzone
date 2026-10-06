/** RESELLER PROGRAM LOADING SHELL — paints the page frame instantly. */
export default function ResellerLoading() {
  return (
    <div className="relative min-h-screen pt-24 sm:pt-28 pb-20">
      <div className="max-w-[980px] mx-auto px-4 sm:px-6 animate-pulse" aria-busy="true">
        <div className="text-center mb-10 sm:mb-14 space-y-4">
          <div className="h-6 w-48 rounded-full bg-foreground/5 mx-auto" />
          <div className="h-10 sm:h-12 w-full max-w-md rounded-lg bg-foreground/5 mx-auto" />
          <div className="h-4 w-full max-w-2xl rounded bg-foreground/5 mx-auto" />
        </div>

        <div className="rounded-2xl border p-5 sm:p-7 mb-8" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="h-4 w-40 rounded bg-foreground/5 mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-foreground/[0.07]" />
                <div className="h-4 w-32 rounded bg-foreground/[0.06]" />
                <div className="h-3 w-full rounded bg-foreground/5" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-28 rounded-2xl border bg-foreground/[0.03]" style={{ borderColor: "var(--border-subtle)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
