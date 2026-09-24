import * as React from "react";
import type { LucideIcon } from "lucide-react";

/**
 * EmptyState — every list, table and grid in the app renders this instead
 * of a bare "No results" string (spec §41: never look like raw output).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className = "",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-[18px] border border-border-subtle bg-surface/40 ${
        compact ? "px-5 py-10" : "px-6 py-16"
      } ${className}`}
    >
      {Icon && (
        <div className="relative mb-5">
          <div
            className="absolute inset-0 blur-2xl opacity-40 rounded-full"
            style={{ background: "var(--ambient-blue)" }}
            aria-hidden
          />
          <div className="relative h-14 w-14 rounded-[16px] border border-border-subtle bg-surface-raised flex items-center justify-center text-brand-ink-3">
            <Icon size={24} />
          </div>
        </div>
      )}
      <h3 className="text-[15px] font-bold text-foreground tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-brand-ink-3">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/**
 * ErrorState — designed failure surface (spec §41).
 * Clear language, no stack traces, always offers a way forward.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this section. Please try again in a moment.",
  action,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[18px] border border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)] px-6 py-10 text-center ${className}`}
      role="alert"
    >
      <h3 className="text-[15px] font-bold text-[color:var(--status-danger-text)]">
        {title}
      </h3>
      <p className="mt-2 mx-auto max-w-md text-[13px] leading-relaxed text-brand-ink-3">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
