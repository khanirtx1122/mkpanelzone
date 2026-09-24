import * as React from "react";
import Link from "next/link";

/**
 * FilterChipRow — link-driven filter chips for server-rendered list pages.
 *
 * Complements FilterBar (which is client-side and writes URL params). Some
 * admin pages — resources, for example — filter on two independent axes and
 * benefit from visible chip rails that are shareable, bookmarkable links and
 * work without JavaScript. These chips are pure anchors, so this stays a
 * server component with zero client bundle cost.
 */

export interface FilterChipOption {
  value: string;
  label: string;
  href: string;
}

export function FilterChipRow({
  label,
  options,
  activeValue,
  className = "",
}: {
  /** Row label, e.g. "Platform" */
  label: string;
  /** The "all" option is just another entry with value "" */
  options: FilterChipOption[];
  activeValue: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2.5 lg:flex-row lg:items-center ${className}`}>
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.13em] text-brand-ink-4 lg:w-[86px]">
        {label}
      </span>
      <div
        className="mask-edges-x -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 no-scrollbar lg:pb-0"
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const active = option.value === activeValue;
          return (
            <Link
              key={option.value || "__all__"}
              href={option.href}
              aria-current={active ? "true" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-[9px] border px-3 py-1.5 text-[11.5px] font-bold tracking-[0.03em] transition-colors duration-150 ${
                active
                  ? "border-border-strong bg-foreground/[0.08] text-foreground"
                  : "border-transparent text-brand-ink-3 hover:bg-foreground/[0.045] hover:text-foreground"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
