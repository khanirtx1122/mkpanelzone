"use client";

import { useCallback, useEffect, useState } from "react";
import { Popup } from "@prisma/client";
import { X, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSessionHint } from "@/components/layout/useSessionHint";
import { useIntroComplete } from "./useIntroComplete";

/**
 * PREMIUM POPUP SYSTEM.
 *
 * Timing: the popup waits for the brand intro to finish (useIntroComplete)
 * plus a short beat, so it appears right after the site becomes visible —
 * never on top of the intro, and never late on fast devices.
 *
 * Body text: the message is treated as first-class content (not a caption).
 * Simple emphasis is supported so the owner can highlight key instructions:
 *   **bold**  →  emphasised line
 *   lines starting with "•" or "-"  →  bullet list
 *   blank line  →  paragraph break
 */
export function GlobalPopupProvider({
  popups,
  memberPopups = [],
}: {
  popups: Popup[];
  /** Scope=MEMBERS variants, shown to a signed-in customer. */
  memberPopups?: Popup[];
}) {
  const loggedIn = useSessionHint();
  const introDone = useIntroComplete();

  /* Audience is resolved in the browser (see useSessionHint) so the layout can
     stay cacheable. Only the candidate rows come from the server. */
  const visible = loggedIn ? [...memberPopups, ...popups] : popups;

  const [activePopup, setActivePopup] = useState<Popup | null>(null);
  const [shown, setShown] = useState(false);

  /* Closing is declared before the effects that reference it, so the Escape
     handler never closes over a not-yet-initialised binding. */
  const handleClose = useCallback(() => {
    if (!activePopup) return;

    const storageKey = `popup_shown_${activePopup.id}`;
    const now = new Date().getTime().toString();

    if (activePopup.frequency === "ONCE_PER_SESSION") {
      sessionStorage.setItem(storageKey, "true");
    } else if (activePopup.frequency === "ONCE_PER_DAY" || activePopup.frequency === "ONCE_EVER") {
      localStorage.setItem(storageKey, now);
    }

    setShown(false);
    window.setTimeout(() => setActivePopup(null), 180);
  }, [activePopup]);

  useEffect(() => {
    if (visible.length === 0) return;
    if (!introDone) return; // never render over the intro

    const now = new Date().getTime();

    const validPopups = visible.filter((p) => {
      if (!p.active) return false;
      if (p.startDate && new Date(p.startDate).getTime() > now) return false;
      if (p.endDate && new Date(p.endDate).getTime() < now) return false;
      return true;
    });

    let candidate: Popup | null = null;
    for (const popup of validPopups) {
      const storageKey = `popup_shown_${popup.id}`;

      if (popup.frequency === "ALWAYS") {
        candidate = popup;
        break;
      }
      if (popup.frequency === "ONCE_PER_SESSION") {
        if (!sessionStorage.getItem(storageKey)) {
          candidate = popup;
          break;
        }
      }
      if (popup.frequency === "ONCE_PER_DAY") {
        const lastShown = localStorage.getItem(storageKey);
        if (!lastShown || now - parseInt(lastShown) > 24 * 60 * 60 * 1000) {
          candidate = popup;
          break;
        }
      }
      if (popup.frequency === "ONCE_EVER") {
        if (!localStorage.getItem(storageKey)) {
          candidate = popup;
          break;
        }
      }
    }

    if (!candidate) return;

    /* Scheduled rather than set synchronously inside the effect body: the
       selection is a decision, not a render-synchronising side effect. */
    const picked = candidate;
    const t = window.setTimeout(() => setActivePopup(picked), 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, popups, memberPopups, introDone]);

  /* Small entrance beat after the intro, then the modal eases in. */
  useEffect(() => {
    if (!activePopup) return;
    const t = window.setTimeout(() => setShown(true), 120);
    return () => window.clearTimeout(t);
  }, [activePopup]);

  /* Escape closes the popup — expected modal behaviour on desktop. */
  useEffect(() => {
    if (!activePopup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activePopup, handleClose]);

  if (!activePopup) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activePopup.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 transition-opacity duration-200 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "rgba(3,5,12,0.72)" }}
    >
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border transition-all duration-200 ${
          shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0"
        }`}
        style={{
          background: "linear-gradient(180deg, #101A2C 0%, #0B1220 100%)",
          borderColor: "rgba(77,163,255,0.28)",
          boxShadow: "0 24px 60px -18px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03) inset",
        }}
      >
        {/* Accent top edge — makes it read clearly as a popup, not page content */}
        <div
          className="h-[3px] w-full"
          style={{ background: "linear-gradient(90deg, #4DA3FF, #2F5FD0 55%, rgba(47,95,208,0))" }}
        />

        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/45 hover:bg-black/75 text-white/80 hover:text-white transition-colors border border-white/10"
        >
          <X size={16} />
        </button>

        {activePopup.imageUrl && (
          <div className="relative w-full h-40 sm:h-48 bg-black">
            <Image src={activePopup.imageUrl} alt={activePopup.title} fill className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0B1220] to-transparent" />
          </div>
        )}

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} className="text-brand-neon-blue shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-neon-blue">
              Announcement
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug mb-3">
            {activePopup.title}
          </h3>

          {activePopup.message && <PopupBody text={activePopup.message} />}

          {activePopup.buttonLink && (
            <div className="pt-4">
              <Link
                href={activePopup.buttonLink}
                onClick={handleClose}
                className="group inline-flex w-full items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-xl font-bold tracking-wider uppercase text-[13px] text-white transition-transform active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #2F5FD0, #4DA3FF)",
                  boxShadow: "0 8px 22px -10px rgba(47,95,208,0.9)",
                }}
              >
                {activePopup.buttonText || "Learn More"}
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the popup body as real content: paragraphs, bullets and **emphasis**.
 * Deliberately tiny — no markdown dependency, no dangerouslySetInnerHTML.
 */
function PopupBody({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="space-y-3">
      {blocks.map((block, bi) => {
        const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
        const isList = lines.every((l) => /^[•\-*]\s+/.test(l));

        if (isList) {
          return (
            <ul key={bi} className="space-y-1.5">
              {lines.map((line, li) => (
                <li key={li} className="flex gap-2 text-[13px] leading-relaxed text-brand-ink-2">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand-neon-blue/70 shrink-0" />
                  <span>{renderEmphasis(line.replace(/^[•\-*]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bi} className="text-[13px] leading-relaxed text-brand-ink-2">
            {lines.map((line, li) => (
              <span key={li}>
                {li > 0 && <br />}
                {renderEmphasis(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** **bold** → <strong>, everything else stays plain text. */
function renderEmphasis(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
