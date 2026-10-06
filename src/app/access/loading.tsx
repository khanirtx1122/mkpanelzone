/** ACCESS ROUTE LOADING SHELL — the login frame paints immediately. */
export default function AccessLoading() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-32">
      <div className="w-full max-w-md animate-pulse" aria-busy="true">
        <div className="h-8 w-40 rounded-lg bg-foreground/5 mx-auto mb-4" />
        <div className="h-4 w-64 rounded bg-foreground/5 mx-auto mb-10" />
        <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-20 rounded-xl bg-foreground/[0.05]" />
            ))}
          </div>
          <div className="h-12 rounded-xl bg-foreground/[0.05]" />
          <div className="h-12 rounded-xl bg-foreground/[0.05]" />
          <div className="h-12 rounded-xl bg-foreground/[0.07]" />
        </div>
      </div>
    </div>
  );
}
