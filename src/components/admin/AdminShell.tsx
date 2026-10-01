"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Route-transition feedback: a thin cobalt progress rail under the header.
 *
 * Performance note — the previous implementation changed a `key` on the
 * wrapper div for every path OR query change, which tore down and re-mounted
 * the entire page subtree on every filter click and pagination step. That was
 * a major source of the admin feeling slow. The page content is now rendered
 * once and never re-keyed; only the decorative rail reacts to navigation.
 *
 * Suspense boundary required because useSearchParams is used (Next.js requirement).
 */
function RouteFeedback({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    // Skip the initial mount — nothing is "navigating" on first paint.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setNavigating(true);
    const t = window.setTimeout(() => setNavigating(false), 700);
    return () => window.clearTimeout(t);
  }, [pathname, searchParams]);

  return (
    <>
      {navigating && <span className="route-progress" aria-hidden />}
      {children}
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
