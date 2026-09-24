"use client";

import * as React from "react";
import type { Popup } from "@prisma/client";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { PremiumModal } from "@/components/ui/PremiumModal";

/**
 * GlobalPopupProvider — renders at most one site-wide popup.
 *
 * Rewritten for spec §29. The previous version hand-rolled its own fixed-position
 * dialog, which meant it had no focus trap, no Escape handling, no scroll lock,
 * no `role="dialog"` and no focus restoration — a keyboard user could tab into
 * the page behind it and Escape did nothing. It now renders through the single
 * shared modal system, so it inherits all of that for free.
 *
 * Dismissal semantics are unchanged: ALWAYS never records anything,
 * ONCE_PER_SESSION writes to sessionStorage, ONCE_PER_DAY and ONCE_EVER write a
 * timestamp to localStorage.
 */

type Frequency = "ALWAYS" | "ONCE_PER_SESSION" | "ONCE_PER_DAY" | "ONCE_EVER";

/**
 * Delay before a popup may appear, so it never lands mid-hydration while the
 * page is still painting. It also keeps the state update out of the effect body,
 * which avoids a cascading render during mount.
 */
const APPEAR_DELAY_MS = 700;

function storageKeyFor(popup: Popup): string {
  return `popup_shown_${popup.id}`;
}

/** True when this popup is still allowed to appear, given its frequency. */
function shouldShow(popup: Popup, now: number): boolean {
  const key = storageKeyFor(popup);

  try {
    switch (popup.frequency as Frequency) {
      case "ALWAYS":
        return true;
      case "ONCE_PER_SESSION":
        return !sessionStorage.getItem(key);
      case "ONCE_PER_DAY": {
        const last = localStorage.getItem(key);
        if (!last) return true;
        const parsed = Number.parseInt(last, 10);
        return Number.isNaN(parsed) || now - parsed > 24 * 60 * 60 * 1000;
      }
      case "ONCE_EVER":
        return !localStorage.getItem(key);
      default:
        return false;
    }
  } catch {
    /* Storage can throw in private modes or when quota is exhausted. Failing
       closed means we simply do not show the popup, rather than crashing. */
    return false;
  }
}

/** Records the dismissal so the frequency rule takes effect next time. */
function recordDismissal(popup: Popup, now: number): void {
  const key = storageKeyFor(popup);
  try {
    if (popup.frequency === "ONCE_PER_SESSION") {
      sessionStorage.setItem(key, "true");
    } else if (popup.frequency === "ONCE_PER_DAY" || popup.frequency === "ONCE_EVER") {
      localStorage.setItem(key, String(now));
    }
  } catch {
    /* Non-fatal: worst case the popup reappears next visit. */
  }
}

/** First popup that is active, inside its schedule, and due to be shown. */
function pickPopup(popups: Popup[]): Popup | null {
  const now = Date.now();

  const inWindow = popups.filter((popup) => {
    if (!popup.active) return false;
    if (popup.startDate && new Date(popup.startDate).getTime() > now) return false;
    if (popup.endDate && new Date(popup.endDate).getTime() < now) return false;
    return true;
  });

  for (const popup of inWindow) {
    if (shouldShow(popup, now)) return popup;
  }

  return null;
}

/** An absolute URL should open in a new tab; an internal path should not. */
function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function GlobalPopupProvider({ popups }: { popups: Popup[] }) {
  const [activePopup, setActivePopup] = React.useState<Popup | null>(null);

  React.useEffect(() => {
    if (popups.length === 0) return;

    const timer = window.setTimeout(() => {
      setActivePopup(pickPopup(popups));
    }, APPEAR_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [popups]);

  const handleClose = React.useCallback(() => {
    setActivePopup((current) => {
      if (current) recordDismissal(current, Date.now());
      return null;
    });
  }, []);

  if (!activePopup) return null;

  const { title, message, imageUrl, buttonLink, buttonText } = activePopup;

  const ctaClass =
    "inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-[12px] text-[13px] font-bold uppercase tracking-[0.055em] text-white transition-[filter] hover:brightness-[1.07] [background:linear-gradient(168deg,#3478E8_0%,#2457C5_58%,#1C3D91_100%)] [box-shadow:0_1px_2px_rgba(0,0,0,.4),0_6px_18px_var(--ambient-strong),inset_0_1px_0_rgba(255,255,255,.14)]";

  return (
    <PremiumModal
      open
      onClose={handleClose}
      title={title}
      description={message || undefined}
      size="md"
    >
      <div className="space-y-5">
        {imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-[14px] border border-border-subtle bg-surface">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 92vw, 512px"
              className="object-cover"
            />
          </div>
        )}

        {buttonLink &&
          (isExternal(buttonLink) ? (
            <a
              href={buttonLink}
              target="_blank"
              rel="noreferrer noopener"
              onClick={handleClose}
              className={ctaClass}
            >
              {buttonText || "Learn more"}
              <ArrowUpRight size={15} aria-hidden />
            </a>
          ) : (
            <a href={buttonLink} onClick={handleClose} className={ctaClass}>
              {buttonText || "Learn more"}
            </a>
          ))}
      </div>
    </PremiumModal>
  );
}
