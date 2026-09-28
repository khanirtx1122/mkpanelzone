"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "warning" | "info";
type ToastItem = { id: number; kind: ToastKind; title: string; desc?: string };

const DURATION_MS: Record<ToastKind, number> = {
  success: 2800,
  info: 3000,
  warning: 4000,
  error: 5200,
};

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TONE: Record<ToastKind, string> = {
  success: "border-green-500/25 bg-[#0B1A14]",
  error: "border-red-500/30 bg-[#1A0B0F]",
  warning: "border-amber-500/30 bg-[#1A1408]",
  info: "border-brand-blue-500/30 bg-[#0A1220]",
};

const ICON_TONE: Record<ToastKind, string> = {
  success: "text-green-400",
  error: "text-red-400",
  warning: "text-amber-400",
  info: "text-brand-blue-400",
};

type ToastApi = {
  success: (title: string, desc?: string) => void;
  error: (title: string, desc?: string) => void;
  warning: (title: string, desc?: string) => void;
  info: (title: string, desc?: string) => void;
};

const ToastCtx = createContext<ToastApi | null>(null);

export function useAdminToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  // Provider-less usage (e.g. a stray server-rendered tree) must not crash.
  if (!ctx) return { success: () => {}, error: () => {}, warning: () => {}, info: () => {} };
  return ctx;
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [leaving, setLeaving] = useState<Set<number>>(new Set());
  const nextId = useRef(1);
  const timers = useRef<Map<number, number>>(new Map());

  const remove = useCallback((id: number) => {
    setLeaving((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setLeaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 170);
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, desc?: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, kind, title, desc }]);
      const t = window.setTimeout(() => remove(id), DURATION_MS[kind]);
      timers.current.set(id, t);
    },
    [remove]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, d) => push("success", t, d),
      error: (t, d) => push("error", t, d),
      warning: (t, d) => push("warning", t, d),
      info: (t, d) => push("info", t, d),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="admin-toasts fixed z-[200] top-[4.5rem] right-3 left-3 sm:left-auto sm:top-20 sm:right-6 flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto w-full sm:w-[340px] flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl ${TONE[t.kind]} ${
                leaving.has(t.id) ? "toast-out" : "toast-in"
              }`}
            >
              <Icon size={17} className={`mt-0.5 shrink-0 ${ICON_TONE[t.kind]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white leading-snug">{t.title}</p>
                {t.desc && <p className="text-xs text-brand-ink-3 mt-0.5 leading-snug">{t.desc}</p>}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => {
                  const timer = timers.current.get(t.id);
                  if (timer) window.clearTimeout(timer);
                  remove(t.id);
                }}
                className="shrink-0 p-1 -m-1 text-brand-ink-3 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
