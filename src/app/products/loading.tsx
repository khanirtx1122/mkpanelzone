/**
 * PRODUCTS ROUTE LOADING SHELL.
 * Paints the real page frame immediately (breadcrumb + title + a 2-up mobile /
 * 3-up desktop grid skeleton) so navigating from Home never shows a frozen
 * screen. The skeleton mirrors the real grid's responsive column count, so the
 * layout does not jump when the products arrive.
 */
export default function ProductsLoading() {
  return (
    <div className="relative min-h-screen pt-20 sm:pt-28 pb-20">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="h-4 w-32 rounded bg-foreground/5 mb-6 sm:mb-8" />

        {/* Header */}
        <div className="mb-10 sm:mb-14 space-y-5">
          <div className="h-10 sm:h-14 w-56 rounded-lg bg-foreground/5" />
          <div className="h-4 w-full max-w-xl rounded bg-foreground/5" />
        </div>

        {/* Grid — same responsive columns as the real page */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="rounded-[22px] border overflow-hidden animate-pulse"
              style={{ borderColor: "var(--border-subtle)", background: "var(--surface)" }}
            >
              <div className="aspect-[4/3] bg-foreground/[0.06]" />
              <div className="p-3 sm:p-4 lg:p-5 space-y-3">
                <div className="h-4 w-3/4 rounded bg-foreground/[0.07]" />
                <div className="h-3 w-1/2 rounded bg-foreground/[0.05]" />
                <div className="h-9 w-full rounded-[11px] bg-foreground/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
