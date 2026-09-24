"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2, SlidersHorizontal } from "lucide-react";

/**
 * FilterBar — the single filter/search language for every admin list page
 * (spec §53: reusable component systems, §23: no ugly default controls).
 *
 * Replaces the half-dozen near-identical hand-rolled filter rows that each
 * admin page used to carry. Behaviour notes:
 *
 * - Search is debounced (320ms) so typing does not fire a server render per
 *   keystroke. Filters apply immediately.
 * - Both use `router.replace(..., { scroll: false })` so the history stack is
 *   not polluted with one entry per character, and the viewport does not jump
 *   back to the top while the operator is filtering.
 * - "ALL" is treated as "no filter" so a cleared select removes the param
 *   entirely rather than leaving `?status=ALL` in the URL.
 */

export interface FilterSelectConfig {
  /** URL search param key, e.g. "platform" */
  key: string;
  /** Accessible label, e.g. "Platform" */
  label: string;
  /** Options; the empty/"ALL" value clears the filter */
  options: { value: string; label: string }[];
  /** Value that means "no filter" — defaults to "ALL" */
  allValue?: string;
}

export interface FilterBarProps {
  /** URL param used for the free-text search. Defaults to "q". */
  searchKey?: string;
  searchPlaceholder?: string;
  /** Hides the search input when a page only needs selects. */
  hideSearch?: boolean;
  selects?: FilterSelectConfig[];
  /** Extra controls rendered on the trailing edge (e.g. "New customer"). */
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchKey = "q",
  searchPlaceholder = "Search…",
  hideSearch = false,
  selects = [],
  actions,
  className = "",
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  const currentSearch = searchParams.get(searchKey) ?? "";
  const [term, setTerm] = React.useState(currentSearch);
  const [syncedSearch, setSyncedSearch] = React.useState(currentSearch);

  /*
    Keep the input in sync when navigation changes the URL from outside — a
    back/forward, a "clear all", or a link from another page.

    This is React's documented "adjusting state when a prop changes" pattern:
    compare against the last value we synced from, and if it differs, set state
    *during render*. React re-renders immediately without committing the first
    pass, which is cheaper than an effect and avoids the cascading second render
    that `react-hooks/set-state-in-effect` warns about.
  */
  if (currentSearch !== syncedSearch) {
    setSyncedSearch(currentSearch);
    setTerm(currentSearch);
  }

  const commit = React.useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `?${query}` : "?", { scroll: false });
      });
    },
    [router, searchParams]
  );

  /* Debounced search — only fires once the operator pauses. */
  React.useEffect(() => {
    if (term === currentSearch) return;
    const timer = window.setTimeout(() => {
      commit((params) => {
        if (term) params.set(searchKey, term);
        else params.delete(searchKey);
      });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [term, currentSearch, commit, searchKey]);

  const setFilter = (key: string, value: string, allValue: string) =>
    commit((params) => {
      if (value && value !== allValue) params.set(key, value);
      else params.delete(key);
    });

  const hasActiveFilters =
    Boolean(currentSearch) ||
    selects.some((s) => Boolean(searchParams.get(s.key)));

  const clearAll = () =>
    commit((params) => {
      params.delete(searchKey);
      selects.forEach((s) => params.delete(s.key));
    });

  return (
    <div
      className={`mat-2 rounded-[16px] p-3 sm:p-3.5 ${className}`}
      role="search"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {!hideSearch && (
          <div className="relative flex-1 min-w-0">
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-brand-ink-3"
              aria-hidden
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin text-brand-ink-2" />
              ) : (
                <Search size={16} />
              )}
            </span>
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-[46px] w-full rounded-[11px] border border-border-subtle bg-[var(--input-bg)] pl-11 pr-10 text-[16px] sm:text-[14px] font-medium text-foreground placeholder:text-brand-ink-3/70 transition-[border-color] duration-150 hover:border-border-strong focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)]"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm("")}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-brand-ink-3 transition-colors hover:text-foreground"
              >
                <X size={15} />
              </button>
            )}
          </div>
        )}

        {selects.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-brand-ink-4 xl:flex"
              aria-hidden
            >
              <SlidersHorizontal size={12} />
              Filter
            </span>
            {selects.map((select) => {
              const allValue = select.allValue ?? "ALL";
              const active = Boolean(searchParams.get(select.key));
              return (
                <label key={select.key} className="relative">
                  <span className="sr-only">{select.label}</span>
                  <select
                    value={searchParams.get(select.key) ?? allValue}
                    onChange={(e) => setFilter(select.key, e.target.value, allValue)}
                    className={`h-[46px] cursor-pointer appearance-none rounded-[11px] border bg-[var(--input-bg)] pl-3.5 pr-9 text-[13px] font-semibold transition-[border-color,color] duration-150 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)] ${
                      active
                        ? "border-border-strong text-foreground"
                        : "border-border-subtle text-brand-ink-2 hover:border-border-strong"
                    }`}
                    style={{
                      backgroundImage:
                        "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2211%22 height=%2211%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236E7A8C%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 13px center",
                      backgroundSize: "11px",
                    }}
                  >
                    <option value={allValue}>{select.label}: All</option>
                    {select.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {active && (
                    <span
                      className="pointer-events-none absolute right-2.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand-blue-400 shadow-[0_0_6px_var(--text-3)]"
                      aria-hidden
                    />
                  )}
                </label>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex h-[46px] items-center gap-1.5 rounded-[11px] border border-border-subtle px-3 text-[12px] font-bold uppercase tracking-[0.06em] text-brand-ink-3 transition-colors hover:border-border-strong hover:text-foreground"
              >
                <X size={13} />
                Reset
              </button>
            )}
          </div>
        )}

        {actions && (
          <div className="flex items-center gap-2.5 lg:ml-auto lg:shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
