"use client";

import { useSyncExternalStore } from "react";
import { X, AlertTriangle, CheckCircle2, Bell, Info } from "lucide-react";
import Link from "next/link";
import { Announcement } from "@prisma/client";

/* ── Dismissal store ─────────────────────────────────────────────────────────
   Dismissals live in sessionStorage, which only exists on the client. Reading it
   in an effect meant the bar was always absent on the first render and appeared
   on the second — a cascading render for a value React can read directly.

   `useSyncExternalStore` is the right primitive: the server snapshot says
   "dismissed" so nothing renders during SSR (matching the previous behaviour
   exactly), and the client snapshot reads storage. Writing notifies subscribers
   so dismissing hides the bar immediately.
   ------------------------------------------------------------------------- */

const dismissalListeners = new Set<() => void>();

function storageKeyFor(id: string): string {
  return `announcement_dismissed_${id}`;
}

function readDismissed(id: string): boolean {
  try {
    return sessionStorage.getItem(storageKeyFor(id)) === "true";
  } catch {
    /* Storage can throw in private modes. Failing closed (dismissed) means we
       simply do not show the bar, which is better than crashing. */
    return true;
  }
}

function writeDismissed(id: string): void {
  try {
    sessionStorage.setItem(storageKeyFor(id), "true");
  } catch {
    /* Non-fatal: the bar still hides for this render. */
  }
  dismissalListeners.forEach((notify) => notify());
}

function subscribeDismissals(notify: () => void): () => void {
  dismissalListeners.add(notify);
  return () => {
    dismissalListeners.delete(notify);
  };
}

/** Server: treat every announcement as dismissed, so SSR renders nothing. */
const getServerDismissed = () => true;

/**
 * AnnouncementBar — refined global notice strip.
 *
 * Uses the shared status palette instead of the previous raw Tailwind
 * `bg-orange-500 / bg-green-500 / bg-red-500`, so an announcement reads as
 * part of the product rather than a bolted-on alert bar.
 */
export function AnnouncementBar({ announcement }: { announcement: Announcement | null }) {
  const announcementId = announcement?.id ?? "";

  const dismissed = useSyncExternalStore(
    subscribeDismissals,
    () => readDismissed(announcementId),
    getServerDismissed
  );

  if (!announcement || dismissed) return null;

  const handleDismiss = () => writeDismissed(announcement.id);

  const style = (() => {
    switch (announcement.type) {
      case "WARNING":
        return {
          Icon: AlertTriangle,
          color: "var(--status-warning-text)",
          border: "var(--status-warning-border)",
          bg: "var(--status-warning-bg)",
        };
      case "SUCCESS":
        return {
          Icon: CheckCircle2,
          color: "var(--status-success-text)",
          border: "var(--status-success-border)",
          bg: "var(--status-success-bg)",
        };
      case "ALERT":
        return {
          Icon: AlertTriangle,
          color: "var(--status-danger-text)",
          border: "var(--status-danger-border)",
          bg: "var(--status-danger-bg)",
        };
      case "INFO":
      default:
        return {
          Icon: Info,
          color: "var(--status-info-text)",
          border: "var(--status-info-border)",
          bg: "var(--status-info-bg)",
        };
    }
  })();

  const { Icon } = style;

  const content = (
    <span className="inline-flex min-w-0 items-center gap-2 text-[12.5px] font-semibold leading-snug">
      <Icon size={14} className="shrink-0" style={{ color: style.color }} aria-hidden />
      <span className="truncate text-foreground">{announcement.message}</span>
    </span>
  );

  return (
    <div
      role="status"
      className="relative z-[60] flex w-full items-center gap-3 border-b px-3 py-2.5 sm:px-5"
      style={{ background: style.bg, borderColor: style.border }}
    >
      <Bell size={13} className="hidden shrink-0 sm:block" style={{ color: style.color }} aria-hidden />

      <div className="flex min-w-0 flex-1 justify-center">
        {announcement.link ? (
          <Link
            href={announcement.link}
            className="min-w-0 rounded-[6px] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {content}
          </Link>
        ) : (
          content
        )}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-brand-ink-3 transition-colors hover:bg-foreground/[0.07] hover:text-foreground"
      >
        <X size={13} />
      </button>
    </div>
  );
}
