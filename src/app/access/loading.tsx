"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";

/**
 * CUSTOMER ACCESS LOADING SHELL — with a watchdog.
 *
 * This is a PASSIVE fallback, not an application state manager: Next.js
 * replaces it automatically the moment the server component resolves.
 *
 * The one thing it does own is the guarantee that a skeleton can never become
 * permanent. If the route has still not produced real content after
 * `MAX_WAIT_MS`, the skeleton is replaced with an honest recovery screen
 * (Retry / Home) instead of spinning forever. That covers a hung database
 * call, a dropped network, or a server error that never surfaces — the exact
 * "stuck on skeleton" failure this is meant to prevent.
 *
 * Deliberately no timers beyond the single watchdog, and no positioning that
 * could sit above the rest of the app.
 */

const MAX_WAIT_MS = 8000;

export default function AccessLoading() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => window.clearTimeout(t);
  }, []);

  if (timedOut) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-6 py-32">
        <div
          className="w-full max-w-md rounded-2xl border p-7 text-center"
          style={{ background: "var(--surface-glass)", borderColor: "var(--border-subtle)" }}
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 mb-5">
            <AlertTriangle size={26} />
          </div>
          <h2 className="text-xl font-extrabold text-foreground mb-2 uppercase tracking-wide">
            Taking longer than expected
          </h2>
          <p className="text-[13px] text-brand-ink-3 mb-7 leading-relaxed">
            Customer Access could not load right now. This is usually a temporary
            connection problem — please try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex flex-1 items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-xl font-bold uppercase tracking-wider text-[12px] text-white active:scale-[0.985] transition-transform"
              style={{ background: "linear-gradient(135deg,#1E3FA8,#2F5FD0)" }}
            >
              <RefreshCw size={15} /> Retry
            </button>
            <Link
              href="/"
              className="inline-flex flex-1 items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-xl font-bold uppercase tracking-wider text-[12px] text-brand-ink-2 hover:text-foreground border transition-colors"
              style={{ background: "var(--surface-glass)", borderColor: "var(--border-subtle)" }}
            >
              <Home size={15} /> Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-32">
      <div className="w-full max-w-md animate-pulse" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading Customer Access…</span>
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
