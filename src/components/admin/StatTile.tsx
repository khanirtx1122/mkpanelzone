import * as React from "react";

/**
 * StatTile — the shared metric tile used across the admin control centre
 * (spec §53: one reusable system; §22: real values, never decorative).
 *
 * Extracted because seven admin pages had each grown their own near-identical
 * copy of this markup. Values are always passed in from a real database
 * aggregation by the caller — this component never invents a number.
 */

export type StatTone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_TEXT: Record<StatTone, string> = {
  neutral: "text-foreground",
  success: "text-[color:var(--status-success-text)]",
  warning: "text-[color:var(--status-warning-text)]",
  danger: "text-[color:var(--status-danger-text)]",
  info: "text-brand-ink-2",
};

export function StatTile({
  label,
  value,
  tone = "neutral",
  icon,
  hint,
  className = "",
}: {
  label: string;
  value: number | string;
  tone?: StatTone;
  /** Small Lucide icon rendered beside the label */
  icon?: React.ReactNode;
  /** Optional one-line qualifier shown under the value */
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`mat-2 rounded-[14px] px-3.5 py-3 ${className}`}>
      <div className="mb-1.5 flex items-center gap-1.5 text-brand-ink-4">
        {icon}
        <span className="truncate text-[9.5px] font-bold uppercase tracking-[0.13em]">
          {label}
        </span>
      </div>
      <p className={`tabular text-[21px] font-extrabold leading-none ${TONE_TEXT[tone]}`}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[10.5px] leading-snug text-brand-ink-4">{hint}</p>}
    </div>
  );
}

/** Responsive grid wrapper so every metric strip spaces identically. */
export function StatGrid({
  children,
  cols = 4,
  className = "",
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass =
    cols === 2
      ? "grid-cols-2"
      : cols === 3
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2 lg:grid-cols-4";

  return <div className={`mb-5 grid gap-3 ${colClass} ${className}`}>{children}</div>;
}
