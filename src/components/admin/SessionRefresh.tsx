"use client";

import { useEffect } from "react";

/**
 * Sliding session keep-alive. Pings the refresh endpoint once per mount so
 * the server re-issues the owner_session cookie with a fresh 30-day window.
 * Without this, a fixed-lifetime cookie silently expires and every admin
 * page cloaks itself with 404 — even while the owner is actively working.
 */
export function SessionRefresh({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    fetch("/api/owner-session/refresh", { method: "GET" }).catch(() => {
      /* Best-effort: a failed ping just means the next page load retries. */
    });
  }, []);

  return <>{children}</>;
}
