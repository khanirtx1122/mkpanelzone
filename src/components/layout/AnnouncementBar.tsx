"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle2, Siren, Info } from "lucide-react";
import Link from "next/link";
import { Announcement } from "@prisma/client";
import { useSessionHint } from "./useSessionHint";

export function AnnouncementBar({
  announcement,
  memberAnnouncement,
}: {
  announcement: Announcement | null;
  /** Scope=MEMBERS variant, shown to a signed-in customer. */
  memberAnnouncement?: Announcement | null;
}) {
  const loggedIn = useSessionHint();

  /* Audience selection happens in the browser so the root layout does not have
     to read the session cookie — that read forced every public page to render
     dynamically. The announcement rows themselves are still chosen on the
     server and cached. */
  const shown =
    loggedIn && memberAnnouncement ? memberAnnouncement : announcement;

  const [isVisible, setIsVisible] = useState(() => {
    // Read once at mount — no effect needed for the initial visibility decision.
    if (typeof window === "undefined") return false;
    return true;
  });

  useEffect(() => {
    if (!shown) return;

    // Check if dismissed
    let dismissed: string | null = null;
    try {
      dismissed = sessionStorage.getItem(`announcement_dismissed_${shown.id}`);
    } catch {
      // Storage blocked (private mode / older Safari) — just show the bar.
      dismissed = null;
    }
    if (dismissed) {
      // Deferred a tick so the state update isn't synchronous in the effect body.
      const t = setTimeout(() => setIsVisible(false), 0);
      return () => clearTimeout(t);
    }
  }, [shown]);

  if (!shown || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(`announcement_dismissed_${shown.id}`, "true");
    } catch {
      /* storage blocked — dismiss still applies for this view */
    }
  };

  const getStyle = () => {
    switch (shown.type) {
      case "WARNING":
        return { Icon: AlertTriangle, background: "linear-gradient(90deg,#9A5B00,#C77B08)", border: "rgba(255,255,255,0.14)" };
      case "SUCCESS":
        return { Icon: CheckCircle2, background: "linear-gradient(90deg,#0E7A3D,#189A50)", border: "rgba(255,255,255,0.14)" };
      case "ALERT":
        return { Icon: Siren, background: "linear-gradient(90deg,#B3122F,#D62246)", border: "rgba(255,255,255,0.14)" };
      case "INFO":
      default:
        return { Icon: Info, background: "linear-gradient(90deg,#1E3FA8,#2F5FD0)", border: "rgba(255,255,255,0.16)" };
    }
  };

  const { Icon, background, border } = getStyle();

  return (
    <div
      className="relative w-full py-2 px-4 flex items-center justify-between z-50 text-white"
      style={{ background, borderBottom: `1px solid ${border}` }}
    >
      {/* Subtle top-edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/15 pointer-events-none" />

      <div className="w-6 flex justify-start shrink-0">
        <Icon size={14} className="opacity-90" />
      </div>

      {shown.link ? (
        <Link href={shown.link} className="flex-1 text-center hover:opacity-85 transition-opacity duration-150 group">
          <span className="inline-block text-[13px] sm:text-sm font-bold tracking-wide group-hover:underline underline-offset-2">
            {shown.message}
          </span>
        </Link>
      ) : (
        <div className="flex-1 text-center text-[13px] sm:text-sm font-bold tracking-wide">
          {shown.message}
        </div>
      )}

      <button
        onClick={handleDismiss}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 active:scale-90 transition-[background-color,transform] duration-150 shrink-0"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}
