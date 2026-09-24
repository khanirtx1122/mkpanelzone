import * as React from "react";

/**
 * DataTable — the single table language for the admin control centre
 * (spec §23: "Do NOT use ugly default HTML tables").
 *
 * Server-component safe: these are presentational wrappers only, so admin
 * pages can keep rendering rows directly from Prisma without shipping any
 * client JavaScript. Interaction (search, filters, pagination) lives in the
 * surrounding toolbar / filter components.
 */

export function DataTableShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mat-2 rounded-[16px] overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

/** Toolbar strip sitting above the table — filters on the left, search right. */
export function DataTableToolbar({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-4 sm:px-5 py-3.5 border-b border-border-subtle bg-surface/50 ${className}`}
    >
      {children}
    </div>
  );
}

/** Horizontally scrollable table region with a themed scrollbar. */
export function DataTableScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto styled-scrollbar">
      <table className="w-full min-w-[720px] text-left border-collapse">
        {children}
      </table>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border-subtle bg-surface-raised/60">{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  align = "left",
  className = "",
  width,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  width?: string;
}) {
  return (
    <th
      scope="col"
      style={width ? { width } : undefined}
      className={`px-4 sm:px-5 py-3 text-[10px] font-bold uppercase tracking-[0.13em] text-brand-ink-3 whitespace-nowrap ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

export function DataTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[color:var(--border-subtle)]">{children}</tbody>;
}

export function Tr({
  children,
  className = "",
  interactive = true,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <tr
      className={`transition-colors duration-150 ${
        interactive ? "hover:bg-foreground/[0.025]" : ""
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
  colSpan,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`px-4 sm:px-5 py-3.5 align-middle ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

/** Compact inline action button used in the Actions column. */
export function RowAction({
  children,
  tone = "neutral",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "neutral" | "danger" | "success" | "warning";
}) {
  const toneClass =
    tone === "danger"
      ? "text-[color:var(--status-danger-text)] border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)] hover:brightness-125"
      : tone === "success"
      ? "text-[color:var(--status-success-text)] border-[color:var(--status-success-border)] bg-[color:var(--status-success-bg)] hover:brightness-125"
      : tone === "warning"
      ? "text-[color:var(--status-warning-text)] border-[color:var(--status-warning-border)] bg-[color:var(--status-warning-bg)] hover:brightness-125"
      : "text-brand-ink-2 border-border-subtle bg-foreground/[0.04] hover:text-foreground hover:border-border-strong";

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-[9px] border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors disabled:opacity-50 disabled:pointer-events-none ${toneClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Same visual language as RowAction but as a link (server-safe). */
export function RowActionLink({
  children,
  tone = "neutral",
  className = "",
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  tone?: "neutral" | "danger" | "success" | "warning";
}) {
  const toneClass =
    tone === "danger"
      ? "text-[color:var(--status-danger-text)] border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)] hover:brightness-125"
      : tone === "success"
      ? "text-[color:var(--status-success-text)] border-[color:var(--status-success-border)] bg-[color:var(--status-success-bg)] hover:brightness-125"
      : "text-brand-ink-2 border-border-subtle bg-foreground/[0.04] hover:text-foreground hover:border-border-strong";

  return (
    <a
      className={`inline-flex items-center gap-1.5 rounded-[9px] border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors ${toneClass} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
