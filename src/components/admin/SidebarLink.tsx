/**
 * ADMIN SIDEBAR — navigation with IMMEDIATE active feedback.
 *
 * The sidebar previously derived its active state purely from `usePathname()`,
 * which only updates AFTER the server render for the destination completes.
 * That is why a click could feel unacknowledged for a second or more.
 *
 * Now the clicked href is recorded on pointerdown (same frame as the press) and
 * painted as the active item immediately. The pending state is self-clearing:
 * it is stored together with the pathname it was clicked FROM, so the moment
 * the real route arrives the stored `from` no longer matches and the optimistic
 * highlight simply stops applying — no effect, no extra render.
 *
 * The element is still a normal <Link>, so Next.js prefetching and client-side
 * navigation continue to do the actual work.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

/** Wraps a nav item so it highlights instantly when clicked. */
export function SidebarLink({
  href,
  exact = false,
  className,
  children,
  onNavigate,
}: {
  href: string;
  exact?: boolean;
  className: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);

  /* Optimistic only while we are still on the page it was clicked from. */
  const isPending = pending !== null && pending.href === href && pending.from === pathname;

  const isActive = isPending
    ? true
    : exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  const markPending = () => {
    if (pathname !== href) setPending({ href, from: pathname });
  };

  return (
    <Link
      href={href}
      prefetch
      data-active={isActive ? "true" : undefined}
      onPointerDown={markPending}
      onClick={() => {
        markPending();
        onNavigate?.();
      }}
      aria-current={isActive ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}
