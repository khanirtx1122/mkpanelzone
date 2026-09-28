"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle2, Siren, Info } from "lucide-react";
import Link from "next/link";
import { Announcement } from "@prisma/client";

export function AnnouncementBar({ announcement }: { announcement: Announcement | null }) {
  const [isVisible, setIsVisible] = useState(() => {
    // Read once at mount — no effect needed for the initial visibility decision.
    if (typeof window === "undefined") return false;
    return true;
  });

  useEffect(() => {
    if (!announcement) return;

    // Check if dismissed
    const dismissed = sessionStorage.getItem(`announcement_dismissed_${announcement.id}`);
    if (dismissed) {
      // Deferred a tick so the state update isn't synchronous in the effect body.
      const t = setTimeout(() => setIsVisible(false), 0);
      return () => clearTimeout(t);
    }
  }, [announcement]);

  if (!announcement || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem(`announcement_dismissed_${announcement.id}`, "true");
  };

  const getStyle = () => {
    switch (announcement.type) {
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

      {announcement.link ? (
        <Link href={announcement.link} className="flex-1 text-center hover:opacity-85 transition-opacity duration-150 group">
          <span className="inline-block text-[13px] sm:text-sm font-bold tracking-wide group-hover:underline underline-offset-2">
            {announcement.message}
          </span>
        </Link>
      ) : (
        <div className="flex-1 text-center text-[13px] sm:text-sm font-bold tracking-wide">
          {announcement.message}
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
