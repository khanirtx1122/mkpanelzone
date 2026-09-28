"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, Check } from "lucide-react";

/**
 * Professional confirmation dialog for destructive actions (no browser confirm()).
 * Focus-trapped, Escape closes, restores focus on close, mobile-friendly.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = true,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "pending" | "success">("idle");
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement;
      setPhase("idle");
      const t = window.setTimeout(() => {
        dialogRef.current?.querySelector<HTMLElement>("button[data-confirm]")?.focus();
      }, 30);
      return () => window.clearTimeout(t);
    }
    // restore focus after close
    if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "pending") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>("button");
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, phase, onClose]);

  if (!open) return null;

  const confirm = async () => {
    if (phase !== "idle") return;
    setPhase("pending");
    try {
      await onConfirm();
      setPhase("success");
      window.setTimeout(onClose, 650);
    } catch {
      setPhase("idle"); // caller toasts the error; keep dialog retryable
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4" role="presentation">
      <div
        className="absolute inset-0 bg-black/60 modal-backdrop"
        onClick={() => phase !== "pending" && onClose()}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-in relative w-full sm:max-w-sm bg-[#0E1420] border border-white/10 rounded-2xl p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          {danger && <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />}
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            {body && <p className="text-sm text-brand-ink-3 mt-1 leading-snug">{body}</p>}
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={phase === "pending"}
            className="admin-press flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-confirm
            onClick={confirm}
            disabled={phase !== "idle"}
            aria-busy={phase === "pending"}
            className={`admin-press flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase border inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
              phase === "success"
                ? "bg-green-500/15 text-green-400 border-green-500/30"
                : danger
                  ? "bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/30"
                  : "bg-brand-blue-500 hover:bg-brand-blue-600 text-white border-brand-blue-400/30"
            }`}
          >
            {phase === "pending" ? (
              <><Loader2 size={15} className="animate-spin" /> Working…</>
            ) : phase === "success" ? (
              <><Check size={15} /> Done</>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
