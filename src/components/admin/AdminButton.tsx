"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Check, X } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand-blue-500 hover:bg-brand-blue-600 text-white border border-brand-blue-400/30 shadow-[0_4px_14px_rgba(47,95,208,0.25)]",
  secondary:
    "bg-white/5 hover:bg-white/10 text-white border border-white/10",
  danger:
    "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25",
  ghost:
    "bg-transparent hover:bg-white/5 text-brand-ink-2 hover:text-white border border-transparent",
};

type BaseProps = {
  variant?: Variant;
  /** Idle label, e.g. "Save Changes". */
  label: ReactNode;
  /** Processing label, e.g. "Saving…". Defaults to auto -ING form. */
  pendingLabel?: string;
  /** Success label, e.g. "Saved". Default "Saved". */
  successLabel?: string;
  /** How long the ✓ state holds before returning to idle (ms). */
  successHoldMs?: number;
  className?: string;
  children?: ReactNode;
  /** Hide the idle label text and show only the icon while idle (icon buttons). */
  iconOnly?: boolean;
  title?: string;
  /** Associates the button with a form by id (for buttons rendered outside it). */
  form?: string;
};

const AUTO_PENDING: Record<string, string> = {
  "save changes": "Saving…",
  save: "Saving…",
  create: "Creating…",
  import: "Importing…",
  generate: "Generating…",
  publish: "Publishing…",
  delete: "Deleting…",
  archive: "Archiving…",
  reset: "Resetting…",
  update: "Updating…",
  upload: "Uploading…",
  "sign out": "Signing out…",
};

function autoPending(label: string): string {
  const key = label.trim().toLowerCase().replace(/[^a-z ]/g, "");
  for (const [needle, pending] of Object.entries(AUTO_PENDING)) {
    if (key.includes(needle)) return pending;
  }
  return "Working…";
}

/**
 * Submit button bound to a <form action={serverAction}>. Uses useFormStatus so
 * the pending state reflects the REAL in-flight server action — success only
 * shows after the action's redirect/revalidation completes on the server.
 * Double-submit is impossible while pending (button disabled).
 */
export function AdminSubmitButton({
  variant = "primary",
  label,
  pendingLabel,
  successLabel = "Saved",
  successHoldMs = 1100,
  className = "",
  iconOnly = false,
  title,
  form,
  children,
}: BaseProps) {
  const { pending } = useFormStatus();
  const [phase, setPhase] = useState<"idle" | "success">("idle");
  const prevPending = useRef(false);

  useEffect(() => {
    // pending true → false means the server action actually completed.
    if (prevPending.current && !pending) {
      setPhase("success");
      const t = window.setTimeout(() => setPhase("idle"), successHoldMs);
      return () => window.clearTimeout(t);
    }
    prevPending.current = pending;
  }, [pending, successHoldMs]);

  const idleText = iconOnly ? "" : label;
  const text = pending ? (pendingLabel ?? autoPending(typeof label === "string" ? label : "Working")) : phase === "success" ? successLabel : idleText;

  return (
    <button
      type="submit"
      form={form}
      disabled={pending}
      aria-busy={pending}
      title={title}
      className={`admin-press inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold tracking-wider uppercase transition-colors disabled:cursor-not-allowed ${
        phase === "success"
          ? "bg-green-500/15 text-green-400 border border-green-500/30"
          : VARIANT_CLASSES[variant]
      } ${pending ? "opacity-90" : ""} ${className}`}
    >
      {pending ? (
        <Loader2 size={15} className="animate-spin shrink-0" />
      ) : phase === "success" ? (
        <Check size={15} className="shrink-0" />
      ) : (
        children
      )}
      {text && <span className="whitespace-nowrap">{text}</span>}
    </button>
  );
}

/**
 * Same lifecycle for onClick handlers (client mutations like toggles, resets,
 * password sets). Success shows ONLY when `run()` resolves without throwing
 * or returning an error. Error shows TRY AGAIN + toast handled by caller.
 */
export function useActionLifecycle() {
  const [phase, setPhase] = useState<"idle" | "pending" | "success" | "error">("idle");
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const run = async <T,>(fn: () => Promise<T>, opts?: { successHoldMs?: number }): Promise<T | undefined> => {
    if (phase === "pending") return undefined; // rapid-click guard
    setPhase("pending");
    try {
      const result = await fn();
      setPhase("success");
      timer.current = window.setTimeout(() => setPhase("idle"), opts?.successHoldMs ?? 1100);
      return result;
    } catch (err) {
      setPhase("error");
      timer.current = window.setTimeout(() => setPhase("idle"), 1600);
      throw err;
    }
  };

  return { phase, run, isPending: phase === "pending" };
}

/** Tiny inline spinner for rows/toggles not using AdminSubmitButton. */
export function InlineSpinner({ size = 15 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin shrink-0" />;
}
