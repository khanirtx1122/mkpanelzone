"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { Announcement } from "@prisma/client";

export function AnnouncementBar({ announcement }: { announcement: Announcement | null }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!announcement) return;
    
    // Check if dismissed
    const dismissed = sessionStorage.getItem(`announcement_dismissed_${announcement.id}`);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, [announcement]);

  if (!announcement || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem(`announcement_dismissed_${announcement.id}`, "true");
  };

  const getStyle = () => {
    switch (announcement.type) {
      case "WARNING": return "bg-orange-500 text-white";
      case "SUCCESS": return "bg-green-500 text-white";
      case "ALERT": return "bg-red-500 text-white";
      case "INFO": 
      default:
        return "bg-brand-blue-500 text-white";
    }
  };

  const content = (
    <div className="flex-1 text-center text-sm font-bold tracking-wide">
      {announcement.message}
    </div>
  );

  return (
    <div className={`relative w-full py-2 px-4 flex items-center justify-between z-50 ${getStyle()}`}>
      <div className="w-6" /> {/* Spacer for centering */}
      
      {announcement.link ? (
        <Link href={announcement.link} className="flex-1 hover:opacity-80 transition-opacity">
          {content}
        </Link>
      ) : (
        content
      )}

      <button 
        onClick={handleDismiss}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/20 transition-colors shrink-0"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}
