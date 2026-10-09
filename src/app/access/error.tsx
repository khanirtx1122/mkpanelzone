"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, ShieldAlert } from "lucide-react";

/**
 * CUSTOMER ACCESS ERROR BOUNDARY.
 *
 * If the route throws — a database timeout, a failed query, a server error —
 * the user gets a real recovery screen with Retry and Home instead of a
 * permanent skeleton, a blank page, or a frozen app.
 *
 * The message is intentionally generic: no stack traces, database details or
 * internal identifiers are ever shown. The real error is reported to the
 * console for diagnosis.
 */
export default function AccessError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[access] route error:", error.message, error.digest);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-32">
      <div
        className="w-full max-w-md rounded-2xl border p-7 text-center"
        style={{ background: "var(--surface-glass)", borderColor: "var(--border-subtle)" }}
      >
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 mx-auto flex items-center justify-center text-red-400 mb-5">
          <ShieldAlert size={26} />
        </div>
        <h2 className="text-xl font-extrabold text-foreground mb-2 uppercase tracking-wide">
          Customer Access unavailable
        </h2>
        <p className="text-[13px] text-brand-ink-3 mb-7 leading-relaxed">
          We could not load the Customer Access page. Please try again — if it keeps
          happening, contact support on WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex flex-1 items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-xl font-bold uppercase tracking-wider text-[12px] text-white active:scale-[0.985] transition-transform"
            style={{ background: "linear-gradient(135deg,#1E3FA8,#2F5FD0)" }}
          >
            <RefreshCw size={15} /> Try again
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
