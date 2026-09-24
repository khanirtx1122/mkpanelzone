"use client";

import { useIsClient } from "@/lib/useIsClient";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type PremiumModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** sm = confirmations, md = forms, lg = previews/editors */
  size?: "sm" | "md" | "lg" | "xl";
  /** Tone the top accent rule to the intent of the dialog */
  tone?: "neutral" | "danger" | "info";
  closeOnBackdrop?: boolean;
};

const SIZE: Record<NonNullable<PremiumModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const TONE_RULE: Record<NonNullable<PremiumModalProps["tone"]>, string> = {
  /* The neutral tone previously used the same blue gradient as `info`, so a
     plain confirmation dialog announced itself in the accent colour. Neutral is
     now actually neutral; only `info` carries the accent. */
  neutral: "from-[color:var(--text-3)] via-[color:var(--text-4)] to-transparent",
  info: "from-brand-blue-500/60 via-brand-blue-400/20 to-transparent",
  danger: "from-brand-red-500/60 via-brand-red-500/20 to-transparent",
};

/**
 * PremiumModal — one modal system for the entire app (spec §29).
 *
 * Replaces the ad-hoc fixed-position dialogs that were scattered through
 * the admin panel. Provides: background dim + blur, depth shift, scale +
 * opacity entrance, focus trapping, Escape support, body scroll lock and
 * focus restoration.
 */
export function PremiumModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  tone = "neutral",
  closeOnBackdrop = true,
}: PremiumModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);
  /* Client detection without a cascading render — see src/lib/useIsClient.ts */
  const mounted = useIsClient();

  // Escape + scroll lock + focus restoration
  React.useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      // Focus trap
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => {
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusables?.[0]?.focus();
    }, 60);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={closeOnBackdrop ? onClose : undefined}
            className="absolute inset-0"
            style={{
              background: "rgba(4,6,10,0.68)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
            aria-hidden
          />

          {/* Panel — bottom sheet on mobile, floating surface on desktop */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            initial={{ opacity: 0, scale: 0.975, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: 10 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full ${SIZE[size]} mat-5 rounded-t-[22px] sm:rounded-[20px] overflow-hidden max-h-[92vh] flex flex-col`}
          >
            {/* Intent accent rule */}
            <div
              className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${TONE_RULE[tone]}`}
              aria-hidden
            />

            {(title || description) && (
              <header className="px-5 sm:px-6 pt-5 pb-4 border-b border-border-subtle shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {title && (
                      <h3 className="text-[17px] sm:text-[19px] font-extrabold text-foreground tracking-tight">
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p className="mt-1.5 text-[13px] text-brand-ink-3 leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="shrink-0 -mr-1 -mt-1 h-9 w-9 rounded-[10px] flex items-center justify-center text-brand-ink-3 hover:text-foreground hover:bg-foreground/6 transition-colors"
                  >
                    <X size={17} />
                  </button>
                </div>
              </header>
            )}

            <div className="px-5 sm:px-6 py-5 overflow-y-auto styled-scrollbar flex-1">
              {children}
            </div>

            {footer && (
              <footer className="px-5 sm:px-6 py-4 border-t border-border-subtle bg-surface/60 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
