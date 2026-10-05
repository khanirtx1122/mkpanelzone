import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { effectivePrice, getGlobalOffer } from "@/lib/pricing";
import { ProductsClient } from "./ProductsClient";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/* Served from cache and refreshed in the background — public pages must not be
   rendered from scratch on every visit, nor frozen at build time. The previous
   `force-dynamic` opt-out meant every visit re-queried the catalogue. */
export const revalidate = 60;

export default async function ProductsPage() {
  const [productsRaw, offer] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    }),
    getGlobalOffer(),
  ]);
  // Deterministic pricing (product sale > global offer) — the grid must show
  // exactly what checkout will charge.
  const products = productsRaw.map((p) => {
    const e = effectivePrice(p, offer);
    return { ...p, price: e.price, originalPrice: e.source ? e.originalPrice : null };
  });

  return (
    <div className="relative min-h-screen pt-20 sm:pt-28 pb-20">
      {/* Subtle static atmospheric lighting — no animation, cheap on mobile */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-64 left-0 w-[500px] h-[500px] bg-brand-neon-red/5 rounded-full blur-[120px] pointer-events-none heavy-layer" />
      
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] sm:text-[13px] font-bold tracking-wide uppercase text-brand-ink-3 mb-6 sm:mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-foreground">Products</span>
        </nav>

        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <h1 className="text-[34px] sm:text-5xl md:text-6xl font-extrabold text-foreground tracking-tight relative inline-block">
                PRODUCTS
                <div className="absolute -bottom-2 sm:-bottom-3.5 left-0 w-full h-[2px] bg-gradient-to-r from-brand-neon-blue via-brand-neon-red to-transparent" />
              </h1>
              <p className="text-brand-ink-3 mt-6 sm:mt-7 max-w-xl text-[13px] sm:text-[15px] leading-relaxed">
                Premium tools, tutorials, and panels. All purchases are bound to a single device for maximum security.
              </p>
            </div>
            <div className="text-[11px] sm:text-[13px] font-bold text-brand-ink-3 uppercase tracking-widest px-4 py-2 rounded-full border border-border-subtle bg-surface-glass whitespace-nowrap w-fit">
              <span className="text-foreground">{products.length}</span> AVAILABLE
            </div>
          </div>
        </div>

        {/* ProductsClient reads useSearchParams, which requires a Suspense
            boundary for the page to stay prerenderable/cacheable. */}
        <Suspense fallback={<ProductsGridSkeleton />}>
          <ProductsClient initialProducts={products as any} />
        </Suspense>
        
      </div>
    </div>
  );
}

/** Static, animation-free placeholder shown while the grid hydrates. */
function ProductsGridSkeleton() {
  return (
    <div
      aria-hidden
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[22px] border border-border-subtle bg-surface-glass overflow-hidden"
        >
          <div className="aspect-[16/8] bg-foreground/5 sk-shimmer" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-3/5 rounded bg-foreground/5 sk-shimmer" />
            <div className="h-3 w-4/5 rounded bg-foreground/5 sk-shimmer" />
            <div className="h-9 w-full rounded-[12px] bg-foreground/5 sk-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

