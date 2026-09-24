import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  Lock,
  type LucideIcon,
} from "lucide-react";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "pending";

const TONE_CLASS: Record<StatusTone, string> = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
  neutral: "badge-neutral",
  pending: "badge-warning",
};

const TONE_ICON: Record<StatusTone, LucideIcon | null> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  neutral: null,
  pending: Clock,
};

/**
 * StatusBadge — the single status vocabulary for the entire application
 * (customers, orders, products, resources, agents, proofs).
 *
 * Replaces the ~14 hand-rolled badge variants that existed across the
 * admin panel so status colour means the same thing on every screen.
 */
export function StatusBadge({
  tone = "neutral",
  children,
  icon,
  size = "sm",
  className = "",
  dot = false,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  icon?: LucideIcon | null;
  size?: "xs" | "sm";
  className?: string;
  dot?: boolean;
}) {
  const Icon = icon === undefined ? TONE_ICON[tone] : icon;

  return (
    <span
      className={`${TONE_CLASS[tone]} inline-flex items-center gap-1.5 rounded-full font-bold uppercase whitespace-nowrap ${
        size === "xs"
          ? "px-2 py-[3px] text-[9px] tracking-[0.10em]"
          : "px-2.5 py-1 text-[10px] tracking-[0.08em]"
      } ${className}`}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current shrink-0"
          aria-hidden
        />
      )}
      {Icon && <Icon size={size === "xs" ? 10 : 11} className="shrink-0" aria-hidden />}
      {children}
    </span>
  );
}

/** Convenience mapping used by admin tables so status strings stay in sync. */
export function toneFromStatus(status: string): StatusTone {
  switch (status.toLowerCase()) {
    case "active":
    case "approved":
    case "delivered":
    case "ready":
    case "paid":
    case "success":
      return "success";
    case "pending":
    case "processing":
    case "review":
    case "awaiting":
      return "pending";
    case "disabled":
    case "rejected":
    case "cancelled":
    case "canceled":
    case "failed":
    case "banned":
      return "danger";
    case "inactive":
    case "archived":
      return "neutral";
    default:
      return "info";
  }
}

/** Secure-resource indicator used on dashboard resource cards (spec §19). */
export function SecureResourceBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`badge-info inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${className}`}
    >
      <Lock size={10} aria-hidden />
      Secure Resource
    </span>
  );
}
