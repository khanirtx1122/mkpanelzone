"use client";

import { useIsClient } from "@/lib/useIsClient";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  /** ms; pass 0 for a sticky toast */
  duration?: number;
};

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const TONE: Record<ToastType, { icon: typeof CheckCircle2; className: string; bar: string }> = {
  success: {
    icon: CheckCircle2,
    className: "text-[color:var(--status-success-text)]",
    bar: "bg-[color:var(--status-success-text)]",
  },
  error: {
    icon: XCircle,
    className: "text-[color:var(--status-danger-text)]",
    bar: "bg-[color:var(--status-danger-text)]",
  },
  warning: {
    icon: AlertTriangle,
    className: "text-[color:var(--status-warning-text)]",
    bar: "bg-[color:var(--status-warning-text)]",
  },
  info: {
    icon: Info,
    className: "text-[color:var(--status-info-text)]",
    bar: "bg-[color:var(--status-info-text)]",
  },
};

/**
 * ToastProvider — the single notification system for the whole app
 * (spec §30). Compact, iconographic, auto-dismissing, capped at 4
 * concurrent toasts so a burst of failures cannot cover the screen.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timers = React.useRef<Record<string, number>>({});
  /* Client detection without a cascading render — see src/lib/useIsClient.ts */
  const mounted = useIsClient();

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const toast = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = t.duration ?? 4200;

      setToasts((prev) => [...prev, { ...t, id }].slice(-4));

      if (duration > 0) {
        timers.current[id] = window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      success: (message, description) => toast({ type: "success", message, description }),
      error: (message, description) => toast({ type: "error", message, description }),
      warning: (message, description) => toast({ type: "warning", message, description }),
      info: (message, description) => toast({ type: "info", message, description }),
    }),
    [toast, dismiss]
  );

  React.useEffect(() => {
    const t = timers.current;
    return () => {
      Object.values(t).forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="fixed z-[200] pointer-events-none flex flex-col gap-2.5
                       bottom-0 right-0 left-0 items-stretch px-3 pb-3
                       sm:left-auto sm:bottom-5 sm:right-5 sm:px-0 sm:pb-0 sm:w-[360px] sm:items-end"
            role="region"
            aria-label="Notifications"
          >
            <AnimatePresence initial={false}>
              {toasts.map((t) => {
                const tone = TONE[t.type];
                const Icon = tone.icon;
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-auto relative overflow-hidden w-full
                               mat-5 rounded-[14px] px-4 py-3.5 flex items-start gap-3"
                  >
                    <Icon size={17} className={`${tone.className} shrink-0 mt-[1px]`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-foreground leading-snug">
                        {t.message}
                      </p>
                      {t.description && (
                        <p className="mt-1 text-[12px] text-brand-ink-3 leading-relaxed">
                          {t.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(t.id)}
                      aria-label="Dismiss notification"
                      className="shrink-0 -mr-1 -mt-0.5 h-7 w-7 rounded-[8px] flex items-center justify-center text-brand-ink-3 hover:text-foreground hover:bg-foreground/6 transition-colors"
                    >
                      <X size={14} />
                    </button>
                    {(t.duration ?? 4200) > 0 && (
                      <motion.span
                        className={`absolute bottom-0 left-0 h-[2px] ${tone.bar} opacity-50`}
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: (t.duration ?? 4200) / 1000, ease: "linear" }}
                        aria-hidden
                      />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
