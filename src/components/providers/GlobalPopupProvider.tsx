"use client";

import { useState, useEffect } from "react";
import { Popup } from "@prisma/client";
import { X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSessionHint } from "@/components/layout/useSessionHint";

export function GlobalPopupProvider({
  popups,
  memberPopups = [],
}: {
  popups: Popup[];
  /** Scope=MEMBERS variants, shown to a signed-in customer. */
  memberPopups?: Popup[];
}) {
  const loggedIn = useSessionHint();

  /* Audience is resolved in the browser (see useSessionHint) so the layout can
     stay cacheable. Only the candidate rows come from the server. */
  const visible = loggedIn ? [...memberPopups, ...popups] : popups;

  const [activePopup, setActivePopup] = useState<Popup | null>(null);

  useEffect(() => {
    if (visible.length === 0) return;

    // Evaluate which popup to show
    const now = new Date().getTime();

    // Sort by most recently created, or however you want to prioritize
    const validPopups = visible.filter(p => {
      if (!p.active) return false;
      if (p.startDate && new Date(p.startDate).getTime() > now) return false;
      if (p.endDate && new Date(p.endDate).getTime() < now) return false;
      return true;
    });

    for (const popup of validPopups) {
      const storageKey = `popup_shown_${popup.id}`;
      
      if (popup.frequency === "ALWAYS") {
        setActivePopup(popup);
        break;
      }
      
      if (popup.frequency === "ONCE_PER_SESSION") {
        if (!sessionStorage.getItem(storageKey)) {
          setActivePopup(popup);
          break;
        }
      }
      
      if (popup.frequency === "ONCE_PER_DAY") {
        const lastShown = localStorage.getItem(storageKey);
        if (!lastShown || (now - parseInt(lastShown) > 24 * 60 * 60 * 1000)) {
          setActivePopup(popup);
          break;
        }
      }

      if (popup.frequency === "ONCE_EVER") {
        if (!localStorage.getItem(storageKey)) {
          setActivePopup(popup);
          break;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, popups, memberPopups]);

  const handleClose = () => {
    if (!activePopup) return;

    const storageKey = `popup_shown_${activePopup.id}`;
    const now = new Date().getTime().toString();
    
    if (activePopup.frequency === "ONCE_PER_SESSION") {
      sessionStorage.setItem(storageKey, "true");
    } else if (activePopup.frequency === "ONCE_PER_DAY" || activePopup.frequency === "ONCE_EVER") {
      localStorage.setItem(storageKey, now);
    }
    
    setActivePopup(null);
  };

  if (!activePopup) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#0E1420] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md"
        >
          <X size={16} />
        </button>

        {activePopup.imageUrl && (
          <div className="relative w-full h-48 bg-black">
            <Image 
              src={activePopup.imageUrl} 
              alt={activePopup.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-6 text-center space-y-4">
          <h3 className="text-xl font-bold text-white font-sans uppercase tracking-tight">
            {activePopup.title}
          </h3>
          
          {activePopup.message && (
            <p className="text-brand-ink-3 text-sm">
              {activePopup.message}
            </p>
          )}

          {activePopup.buttonLink && (
            <div className="pt-2">
              <Link 
                href={activePopup.buttonLink}
                onClick={handleClose}
                className="inline-block w-full px-6 py-3 bg-brand-blue-500 hover:bg-brand-blue-600 text-white font-bold tracking-wider uppercase text-sm rounded-lg transition-colors"
              >
                {activePopup.buttonText || "Learn More"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
