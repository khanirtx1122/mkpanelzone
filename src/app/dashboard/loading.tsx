/** CUSTOMER DASHBOARD LOADING SHELL — resource panels fill in after. */
export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-pulse" aria-busy="true">
      <div className="space-y-3 mb-8">
        <div className="h-7 w-56 rounded-lg bg-foreground/5" />
        <div className="h-4 w-72 rounded bg-foreground/5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="h-32 rounded-2xl border bg-foreground/[0.03]" style={{ borderColor: "var(--border-subtle)" }} />
        <div className="h-32 rounded-2xl border bg-foreground/[0.03]" style={{ borderColor: "var(--border-subtle)" }} />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-20 rounded-2xl border bg-foreground/[0.03]" style={{ borderColor: "var(--border-subtle)" }} />
        ))}
      </div>
    </div>
  );
}
