/**
 * PRODUCT DETAIL LOADING SHELL.
 * Mirrors the real two-column layout (media left, buy panel right) so the page
 * never jumps when the product arrives.
 */
export default function ProductDetailLoading() {
  return (
    <div className="relative min-h-screen pt-24 sm:pt-32 pb-24">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 animate-pulse" aria-busy="true">
        <div className="h-4 w-40 rounded bg-foreground/5 mb-6 sm:mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-[4/3] rounded-2xl bg-foreground/[0.06]" />

          <div className="space-y-5">
            <div className="h-9 sm:h-12 w-4/5 rounded-lg bg-foreground/5" />
            <div className="h-10 w-40 rounded-lg bg-foreground/[0.07]" />
            <div className="space-y-2.5 pt-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-3.5 rounded bg-foreground/5" style={{ width: `${88 - i * 8}%` }} />
              ))}
            </div>
            <div className="h-14 w-full rounded-xl bg-foreground/[0.07] mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
