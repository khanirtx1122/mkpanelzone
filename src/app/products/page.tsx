import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./ProductsClient";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' }
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

        <ProductsClient initialProducts={products as any} />
        
      </div>
    </div>
  );
}

