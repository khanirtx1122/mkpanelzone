"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ProductCard, type Product } from "@/components/ui/ProductCard";
import { productContent, globalFAQ } from "@/lib/productContent";
import { Search, SlidersHorizontal, ArrowRight, Check, CheckCircle2, ShieldCheck, Zap, Crown } from "lucide-react";
import { Accordion } from "@/components/ui/Accordion";
import { Steps } from "@/components/ui/Steps";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State from URL
  const categoryParam = searchParams.get("category") || "all";
  const searchParam = searchParams.get("q") || "";
  const sortParam = searchParams.get("sort") || "featured";

  const [searchQuery, setSearchQuery] = useState(searchParam);

  // Debounce search to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) params.set("q", searchQuery);
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, pathname, router, searchParams]);

  // Handlers for URL updates
  const setCategory = (c: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (c === "all") params.delete("category");
    else params.set("category", c);
    router.push(`${pathname}?${params.toString()}`);
  };

  const setSort = (s: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (s === "featured") params.delete("sort");
    else params.set("sort", s);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    router.push(pathname);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    if (categoryParam === "panels") {
      result = result.filter(p => !p.slug.includes("setup") && !p.slug.includes("support"));
    } else if (categoryParam === "add-ons") {
      result = result.filter(p => p.slug.includes("setup") || p.slug.includes("support"));
    }

    if (searchParam) {
      const q = searchParam.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    if (sortParam === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortParam === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else {
      // featured
      const order = ["elite-panel-lifetime", "mk-panel-3-months", "mk-panel-monthly", "mk-panel-weekly", "mk-setup-pack", "mk-priority-support"];
      result.sort((a, b) => {
        const indexA = order.indexOf(a.slug);
        const indexB = order.indexOf(b.slug);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });
    }

    return result;
  }, [initialProducts, categoryParam, searchParam, sortParam]);

  const hasActiveFilters = categoryParam !== "all" || searchParam !== "" || sortParam !== "featured";
  const spotlightProduct = initialProducts.find(p => p.slug === "elite-panel-lifetime");
  const showSpotlight = !hasActiveFilters && spotlightProduct;
  
  const panelProducts = initialProducts.filter(p => !p.slug.includes("setup") && !p.slug.includes("support"));

  return (
    <div className="space-y-12 sm:space-y-20 mb-24">
      {/* TOOLBAR — premium filter chips */}
      <div className="sticky top-[60px] sm:top-[72px] z-40 bg-background/85 backdrop-blur-xl border-b border-border-subtle py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="max-w-[1120px] mx-auto flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          
          {/* Premium filter chips — horizontally scrollable */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { key: "all", label: "All" },
              { key: "panels", label: "Panels" },
              { key: "add-ons", label: "Add-Ons" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`filter-chip${categoryParam === key ? " active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative flex-1 min-w-0 sm:w-[220px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink-3" />
              <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-glass border border-border-subtle rounded-full h-[36px] pl-8 pr-4 text-[13px] text-foreground placeholder:text-brand-ink-3/50 focus:outline-none focus:border-brand-neon-blue transition-colors"
              />
            </div>
            
            <div className="relative shrink-0">
              <select
                value={sortParam}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-surface-glass border border-border-subtle rounded-full h-[36px] pl-3 pr-9 text-[12px] font-bold text-foreground focus:outline-none focus:border-brand-neon-blue cursor-pointer uppercase tracking-wide"
              >
                <option value="featured" className="bg-background normal-case font-normal">Featured</option>
                <option value="price-asc" className="bg-background normal-case font-normal">Price ↑</option>
                <option value="price-desc" className="bg-background normal-case font-normal">Price ↓</option>
              </select>
              <SlidersHorizontal size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-ink-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER RESULTS INFO */}
      {hasActiveFilters && (
        <div aria-live="polite" className="flex items-center justify-between text-[13px] sm:text-[15px] font-medium text-brand-ink-3 max-w-[1120px] mx-auto">
          <span>Found <span className="text-foreground">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'result' : 'results'}</span>
          <button onClick={clearFilters} className="text-brand-neon-red hover:text-foreground transition-colors underline underline-offset-4 decoration-brand-neon-red/50 hover:decoration-white">
            Clear filters
          </button>
        </div>
      )}

      {/* SPOTLIGHT */}
      {showSpotlight && spotlightProduct && (
        <section className="max-w-[1120px] mx-auto">
          <h2 className="text-[10px] sm:text-[12px] font-bold text-brand-neon-blue uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-neon-blue shadow-[0_0_8px_rgba(77,163,255,0.8)] animate-pulse" />
            Featured Spotlight
          </h2>
          
          <div className="relative rounded-[24px] overflow-hidden border border-border-subtle bg-surface shadow-2xl flex flex-col md:flex-row group/spotlight html-[data-perf='full']:hover:border-brand-neon-blue/50 transition-colors duration-500">
            {/* Artwork */}
            <div className="w-full md:w-[45%] lg:w-1/2 relative bg-gradient-to-br from-brand-neon-blue/20 to-transparent p-8 sm:p-12 min-h-[200px] sm:min-h-[300px] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(77,163,255,0.15),transparent_60%)]" />
              {/* Abstract 3D shape / visual */}
              <div className="relative w-32 h-32 sm:w-48 sm:h-48 rounded-full border-[2px] border-brand-neon-blue/30 flex items-center justify-center animate-[spin_30s_linear_infinite] html-[data-perf='low']:animate-none">
                <div className="absolute inset-0 border border-brand-neon-blue/20 rounded-full scale-110" />
                <div className="absolute inset-0 border border-brand-neon-blue/10 rounded-full scale-125" />
                <Crown className="w-12 h-12 sm:w-16 sm:h-16 text-brand-neon-blue drop-shadow-[0_0_15px_rgba(77,163,255,0.5)] animate-[spin_30s_linear_infinite_reverse] html-[data-perf='low']:animate-none" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 sm:p-8 md:p-12 flex flex-col justify-center relative z-10 bg-gradient-to-r from-transparent via-[#03040A]/80 to-[#03040A]">
              <div className="inline-flex px-2.5 py-1 rounded-full border border-brand-neon-blue/30 bg-brand-neon-blue/10 text-[10px] font-extrabold tracking-widest uppercase text-brand-neon-blue mb-4 sm:mb-6 w-fit shadow-sm">
                LIFETIME LICENSE
              </div>
              
              <h3 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 sm:mb-6 tracking-tight line-clamp-2">
                {spotlightProduct.name}
              </h3>
              
              <p className="text-brand-ink-3 text-[13px] sm:text-[15px] md:text-[17px] leading-relaxed mb-6 sm:mb-8 line-clamp-3 max-w-xl">
                {spotlightProduct.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10 max-w-xl">
                {productContent[spotlightProduct.slug]?.highlights.map((hl, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-brand-neon-blue shrink-0" />
                    <span className="text-foreground/80 font-medium text-[12px] sm:text-[14px]">{hl}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mt-auto border-t border-white/10 pt-6">
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">PKR {spotlightProduct.price.toFixed(2)}</div>
                  <div className="text-[11px] sm:text-[13px] text-brand-ink-3 font-medium uppercase tracking-wide mt-1">One-time payment</div>
                </div>
                
                <Link 
                  href={`/products/${spotlightProduct.slug}`}
                  className="group relative h-12 sm:h-14 px-8 rounded-lg flex items-center justify-center bg-white border border-transparent transition-all active:scale-[0.98] overflow-hidden w-full sm:w-auto ml-auto"
                >
                  <span className="relative z-10 text-[13px] sm:text-[15px] font-bold tracking-[0.05em] uppercase text-background flex items-center gap-2 whitespace-nowrap">
                    Get Lifetime
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* GRID */}
      <section className="max-w-[1120px] mx-auto min-h-[400px]">
        {filteredProducts.length === 0 ? (
           <div className="text-center py-32 border border-white/5 rounded-2xl bg-white/[0.02]">
             <Search size={48} className="mx-auto text-brand-ink-3 mb-6 opacity-50" />
             <h3 className="text-xl font-bold text-foreground mb-2">No products found</h3>
             <p className="text-brand-ink-3">Try adjusting your search or filters to find what you&apos;re looking for.</p>
             <button onClick={clearFilters} className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-foreground rounded-full font-bold text-sm transition-colors">
               Reset all filters
             </button>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.slice(0, 6).map((product, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, layout: { duration: 0.3 } }}
                  key={product.id}
                >
                  <ProductCard product={product} index={i} />
                </motion.div>
              ))}
              {filteredProducts.slice(6).map((product, i) => (
                <div key={product.id}>
                  <ProductCard product={product} index={i + 6} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* COMPARE PLANS (Desktop Only, if >= 2 panels) */}
      {!hasActiveFilters && panelProducts.length >= 2 && (
        <section className="max-w-[1120px] mx-auto hidden md:block html-[data-perf='full']:content-visibility-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4">Compare Panel Plans</h2>
            <p className="text-brand-ink-3">Detailed breakdown of what&apos;s included in each package.</p>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-6 text-brand-ink-3 font-bold text-[14px]">Features</th>
                  {panelProducts.map(p => (
                    <th key={p.id} className="p-6">
                      <div className="text-foreground font-extrabold text-lg">{p.name.replace('MK Panel - ', '')}</div>
                      <div className="text-brand-neon-blue font-bold mt-1">PKR {p.price.toFixed(2)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[14px] text-foreground/80">
                <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-6 font-medium">Updates</td>
                  {panelProducts.map(p => <td key={p.id} className="p-6">{productContent[p.slug]?.features.updates}</td>)}
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-6 font-medium">Setup Files</td>
                  {panelProducts.map(p => <td key={p.id} className="p-6">{productContent[p.slug]?.features.setupFiles}</td>)}
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-6 font-medium">Tutorials</td>
                  {panelProducts.map(p => <td key={p.id} className="p-6">{productContent[p.slug]?.features.tutorials}</td>)}
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-6 font-medium">Support Level</td>
                  {panelProducts.map(p => <td key={p.id} className="p-6">{productContent[p.slug]?.features.supportLevel}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* HOW ORDERING WORKS */}
      {!hasActiveFilters && (
        <section className="max-w-[1120px] mx-auto html-[data-perf='full']:content-visibility-auto">
          <div className="bg-gradient-to-br from-[#0a0f16] to-black border border-white/10 rounded-[24px] p-6 sm:p-12 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-neon-blue/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-neon-red/10 blur-[100px] pointer-events-none" />
            
            <div className="text-center mb-10 sm:mb-16 relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-4">How Ordering Works</h2>
              <p className="text-brand-ink-3 max-w-xl mx-auto">A secure, manual process to ensure the safety and exclusivity of our tools.</p>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
              <Steps 
                steps={[
                  { title: "Select a Plan", description: "Choose the package that fits your needs and proceed to checkout." },
                  { title: "Make Payment", description: "Pay using Crypto or Bank Transfer and take a screenshot of the receipt." },
                  { title: "Submit Proof", description: "Upload your payment proof securely on our checkout page." },
                  { title: "Manual Verification", description: "Our team reviews the payment (1-12 hours). Once verified, you get instant access." }
                ]}
              />
            </div>
          </div>
        </section>
      )}

      {/* FAQ & SUPPORT */}
      {!hasActiveFilters && (
        <section className="max-w-[1120px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 html-[data-perf='full']:content-visibility-auto">
          <div className="lg:col-span-7">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-8">Frequently Asked Questions</h2>
            <Accordion items={globalFAQ} />
          </div>
          
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-glass border border-border-subtle rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center">
              <ShieldCheck className="w-12 h-12 text-brand-neon-blue mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Secure & Private</h3>
              <p className="text-brand-ink-3 text-sm mb-6">Our manual verification ensures that the panel remains exclusive and undetected.</p>
            </div>
            
            <div className="bg-gradient-to-r from-brand-neon-blue/20 to-brand-neon-red/20 border border-border-subtle rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center">
              <Zap className="w-12 h-12 text-foreground drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Need Priority Support?</h3>
              <p className="text-foreground/80 text-sm mb-6">Get 1-on-1 assistance with setup and troubleshooting.</p>
              <Link href="/products/mk-priority-support" className="px-6 py-3 bg-foreground text-background font-bold text-sm rounded-lg hover:scale-105 transition-transform w-full">
                Get Support Add-on
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
