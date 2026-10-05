"use client";

import { useEffect } from "react";

/** Reissues a valid owner cookie on each admin layout mount. */
export function SessionRefresh({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void fetch("/api/owner-session/refresh", { method: "GET", cache: "no-store" });
  }, []);

  return <>{children}</>;
}
