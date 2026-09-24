import * as React from "react";

/**
 * LoadingState / Skeleton — polished loading feedback (spec §40).
 * Never leave a blank canvas: every async surface gets a shaped skeleton
 * that matches the layout it is replacing.
 */

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`sk-shimmer rounded-[10px] ${className}`}
      style={style}
      aria-hidden
    />
  );
}

/** Generic card-grid skeleton used by products, resources, customers. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="mat-2 rounded-[18px] p-5">
      <Skeleton className="h-32 w-full rounded-[12px] mb-4" />
      <Skeleton className="h-4 w-3/5 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3 mb-2"
          style={{ width: `${88 - i * 16}%` }}
        />
      ))}
      <div className="mt-5 flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-24 rounded-[10px]" />
      </div>
    </div>
  );
}

/** Table skeleton matching the DataTable row rhythm. */
export function SkeletonTable({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full" aria-busy="true" aria-live="polite">
      <div className="flex gap-4 px-5 py-3.5 border-b border-border-subtle">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-5 py-4 border-b border-border-subtle">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-4 flex-1"
              style={{ opacity: 1 - r * 0.09 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Centered spinner for short, indeterminate operations. */
export function LoadingState({
  label = "Loading",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-9 w-9 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border-2 border-border-subtle"
          aria-hidden
        />
        <span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[color:var(--text-2)] animate-spin"
          aria-hidden
        />
      </span>
      <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
        {label}
      </span>
    </div>
  );
}

/** Full-page loading shell used by route-level loading.tsx files. */
export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <LoadingState label={label} />
    </div>
  );
}
