/**
 * ADMIN ROUTE LOADING SHELL.
 *
 * This is the single most important perceived-performance fix in the panel.
 *
 * Without a loading.tsx, Next.js keeps the PREVIOUS page on screen until the
 * destination's server component has fully finished rendering — which is
 * exactly the "I click Orders and nothing happens for a second" feeling.
 * With this file, the layout (sidebar + header, which persist) stays put and
 * this skeleton paints immediately on navigation, then the real rows stream in.
 *
 * Deliberately dependency-free and animation-light: a few static blocks plus a
 * single cheap shimmer, so it costs nothing on low-end devices.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      {/* Page heading */}
      <div className="space-y-3">
        <div className="h-7 w-52 rounded-lg bg-white/[0.07]" />
        <div className="h-4 w-72 rounded bg-white/[0.05]" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white/[0.05]" />
        ))}
      </div>

      {/* List / table shell */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] divide-y divide-white/5 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="w-9 h-9 rounded-lg bg-white/[0.07] shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-3.5 rounded bg-white/[0.07]" style={{ width: `${58 - i * 4}%` }} />
              <div className="h-3 w-24 rounded bg-white/[0.04]" />
            </div>
            <div className="h-6 w-16 rounded-full bg-white/[0.05] shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
