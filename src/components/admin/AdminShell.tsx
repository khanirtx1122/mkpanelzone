"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Route-transition feedback: thin cobalt progress rail under the header plus a
 * subtle page fade on every admin navigation. Pure CSS transform/opacity.
 * Suspense boundary required because useSearchParams is used (Next.js requirement).
 */
function RouteFeedback({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navKey, setNavKey] = useState(0);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    // Any change to path or query params = a completed navigation → restart
    // the fade, and kill the progress rail shortly after.
    setNavKey((k) => k + 1);
    setNavigating(true);
    const t = window.setTimeout(() => setNavigating(false), 750);
    return () => window.clearTimeout(t);
  }, [pathname, searchParams]);

  return (
    <>
      {navigating && <span className="route-progress" aria-hidden />}
      <div key={navKey} className="route-fade">
        {children}
      </div>
    </>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <RouteFeedback>{children}</RouteFeedback>
    </Suspense>
  );
}
