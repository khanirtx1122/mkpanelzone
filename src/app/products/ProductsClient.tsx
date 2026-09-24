"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ProductCard, type Product } from "@/components/ui/ProductCard";
import { productContent, globalFAQ } from "@/lib/productContent";
import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Crown,
  PackageSearch,
  X,
} from "lucide-react";
import { Accordion } from "@/components/ui/Accordion";
import { Steps } from "@/components/ui/Steps";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
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

  // Filter & Sort Logic — unchanged behaviour
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    if (categoryParam === "panels") {
      result = result.filter((p) => !p.slug.includes("setup") && !p.slug.includes("support"));
    } else if (categoryParam === "add-ons") {
      result = result.filter((p) => p.slug.includes("setup") || p.slug.includes("support"));
    }

    if (searchParam) {
      const q = searchParam.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          /* `description` is nullable in the database — without the guard this
             threw a TypeError and took the whole product search down for any
             product saved without a description. */
          (p.description ?? "").toLowerCase().includes(q)
      );
    }

    if (sortParam === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortParam === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else {
      const order = [
        "elite-panel-lifetime",
        "mk-panel-3-months",
        "mk-panel-monthly",
        "mk-panel-weekly",
        "mk-setup-pack",
        "mk-priority-support",
      ];
      result.sort((a, b) => {
        const indexA = order.indexOf(a.slug);
        const indexB = order.indexOf(b.slug);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });
    }

    return result;
  }, [initialProducts, categoryParam, searchParam, sortParam]);

  const hasActiveFilters = categoryParam !== "all" || searchParam !== "" || sortParam !== "featured";
  const spotlightProduct = initialProducts.find((p) => p.slug === "elite-panel-lifetime");
  const showSpotlight = !hasActiveFilters && spotlightProduct;
  const panelProducts = initialProducts.filter(
    (p) => !p.slug.includes("setup") && !p.slug.includes("support")
  );

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* ── TOOLBAR ───────────────────────────────────────────── */}
      <div className="sticky top-[76px] z-40 -mx-4 border-b border-border-subtle bg-[color:var(--background)]/85 px-4 py-3 backdrop-blur-xl sm:top-[88px] sm:mx-0 sm:rounded-[14px] sm:border sm:border-border-subtle sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { key: "all", label: "All" },
              { key: "panels", label: "Panels" },
              { key: "add-ons", label: "Add-ons" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                aria-pressed={categoryParam === key}
                className={`filter-chip${categoryParam === key ? " active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search + sort */}
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="relative min-w-0 flex-1 sm:w-[230px]">
              <Search
                size={13}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink-4"
                aria-hidden
              />
              <input
                type="text"
                placeholder="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search products"
                className="h-[38px] w-full rounded-full border border-border-subtle bg-[var(--input-bg)] pl-9 pr-9 text-[13px] font-medium text-foreground transition-colors placeholder:text-brand-ink-4 hover:border-border-strong focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-brand-ink-4 transition-colors hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="relative shrink-0">
              <select
                value={sortParam}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort products"
                className="h-[38px] cursor-pointer appearance-none rounded-full border border-border-subtle bg-[var(--input-bg)] pl-3.5 pr-9 text-[11.5px] font-bold uppercase tracking-[0.06em] text-foreground transition-colors hover:border-border-strong focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-border)]"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
              </select>
              <SlidersHorizontal
                size={12}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-ink-4"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIVE FILTER SUMMARY ─────────────────────────────── */}
      {hasActiveFilters && (
        <div
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border-subtle bg-surface-raised px-4 py-3"
        >
          <span className="text-[13px] font-medium text-brand-ink-3">
            Showing{" "}
            <span className="font-bold text-foreground">{filteredProducts.length}</span>{" "}
            {filteredProducts.length === 1 ? "result" : "results"}
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.07em] text-brand-ink-2 transition-colors hover:text-foreground"
          >
            <X size={12} aria-hidden />
            Clear filters
          </button>
        </div>
      )}

      {/* ── SPOTLIGHT ─────────────────────────────────────────── */}
      {showSpotlight && spotlightProduct && (
        <section>
          <ScrollReveal>
            <div className="mb-5 flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--text-4)]" aria-hidden />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-ink-3">
                Spotlight
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={60}>
            <div className="relative overflow-hidden rounded-[22px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)]">
              <span className="absolute inset-x-0 top-0 z-20 h-px bg-[var(--border-top-highlight)]" aria-hidden />

              <div className="grid lg:grid-cols-12">
                {/* Visual side — dimensional, lit from the top-left */}
                <div className="relative overflow-hidden border-b border-border-subtle lg:col-span-5 lg:border-b-0 lg:border-r">
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(80% 70% at 30% 25%, var(--ambient-strong) 0%, transparent 68%), linear-gradient(160deg, var(--surface-raised), var(--background))",
                    }}
                    aria-hidden
                  />
                  <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-60" aria-hidden />

                  <div className="relative flex min-h-[240px] items-center justify-center p-10 sm:min-h-[320px]">
                    {/* Thin orbital geometry — the only "3D object" here */}
                    <div className="relative flex h-[170px] w-[170px] items-center justify-center sm:h-[220px] sm:w-[220px]">
                      <span className="animate-slow-spin absolute inset-0 rounded-full border border-border-strong" />
                      <span
                        className="animate-slow-spin-rev absolute inset-[14%] rounded-full border border-[var(--ambient-strong)]"
                        style={{ borderStyle: "dashed" }}
                      />
                      <span className="animate-slow-spin absolute inset-[28%] rounded-full border border-[var(--ambient-strong)]" />
                      <span
                        className="flex h-[62px] w-[62px] items-center justify-center rounded-[18px] border border-border-strong sm:h-[76px] sm:w-[76px]"
                        style={{
                          background:
                            "linear-gradient(160deg, var(--ambient-strong), var(--ambient-blue))",
                          boxShadow: "0 8px 30px var(--ambient-strong)",
                        }}
                      >
                        <Crown className="h-7 w-7 text-brand-ink-2 sm:h-8 sm:w-8" aria-hidden />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content side */}
                <div className="relative lg:col-span-7">
                  <div className="p-6 sm:p-9 lg:p-11">
                    <StatusBadge tone="info" size="sm" icon={Crown}>
                      Lifetime Licence
                    </StatusBadge>

                    <h3 className="mt-5 text-[26px] font-extrabold leading-[1.1] tracking-[-0.026em] text-foreground sm:text-[34px]">
                      {spotlightProduct.name}
                    </h3>

                    <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-brand-ink-3 sm:text-[15px]">
                      {spotlightProduct.description}
                    </p>

                    {productContent[spotlightProduct.slug]?.highlights && (
                      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                        {productContent[spotlightProduct.slug].highlights.map((hl, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle2
                              size={15}
                              className="mt-[2px] shrink-0 text-brand-ink-2"
                              aria-hidden
                            />
                            <span className="text-[13px] leading-snug text-brand-ink-2">{hl}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-t border-border-subtle pt-6">
                      <div>
                        <span className="tabular block text-[30px] font-extrabold leading-none tracking-[-0.03em] text-foreground sm:text-[36px]">
                          <span className="mr-1.5 text-[13px] font-bold text-brand-ink-3">PKR</span>
                          {spotlightProduct.price.toFixed(0)}
                        </span>
                        <span className="mt-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-brand-ink-4">
                          One-time payment
                        </span>
                      </div>

                      <Link
                        href={`/products/${spotlightProduct.slug}`}
                        className="group relative inline-flex h-[50px] items-center gap-2.5 overflow-hidden rounded-[12px] border border-white/[0.14] px-6 text-[13px] font-bold uppercase tracking-[0.06em] text-white transition-transform duration-100 active:scale-[0.978]"
                        style={{
                          background:
                            "linear-gradient(168deg,#3478E8 0%,#2457C5 58%,#1C3D91 100%)",
                          boxShadow: "0 1px 2px rgba(0,0,0,.4), 0 8px 22px var(--ambient-strong)",
                        }}
                      >
                        <span className="absolute inset-x-0 top-0 h-px bg-white/[0.16]" aria-hidden />
                        Get lifetime access
                        <ArrowRight
                          size={15}
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ── GRID ──────────────────────────────────────────────── */}
      <section className="min-h-[320px]">
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No products match those filters"
            description="Try a different search term, or reset the filters to see the full catalogue."
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-[46px] items-center gap-2 rounded-[12px] border border-border-subtle bg-foreground/[0.03] px-5 text-[12.5px] font-bold uppercase tracking-[0.07em] text-foreground transition-colors hover:border-border-strong"
              >
                Reset filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            <AnimatePresence mode="popLayout">
              {filteredProducts.slice(0, 6).map((product, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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

      {/* ── COMPARE PLANS ─────────────────────────────────────── */}
      {!hasActiveFilters && panelProducts.length >= 2 && (
        <section className="hidden md:block">
          <ScrollReveal>
            <SectionHeading
              eyebrow="Compare"
              title="What's different between the plans"
              description="The core panel is the same across packages — what changes is how long you receive updates and how quickly support responds."
              accent="blue"
            />
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="mt-9 overflow-hidden rounded-[18px] mat-2">
              <div className="overflow-x-auto styled-scrollbar">
                <table className="w-full min-w-[640px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-raised/60">
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.13em] text-brand-ink-3">
                        Feature
                      </th>
                      {panelProducts.map((p) => (
                        <th key={p.id} className="px-5 py-4">
                          <div className="text-[14px] font-extrabold tracking-[-0.01em] text-foreground">
                            {p.name.replace("MK Panel - ", "")}
                          </div>
                          <div className="tabular mt-1 text-[12.5px] font-bold text-brand-ink-2">
                            PKR {p.price.toFixed(0)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--border-subtle)]">
                    {[
                      { label: "Updates", key: "updates" as const },
                      { label: "Setup files", key: "setupFiles" as const },
                      { label: "Tutorials", key: "tutorials" as const },
                      { label: "Support level", key: "supportLevel" as const },
                    ].map(({ label, key }) => (
                      <tr key={key} className="transition-colors hover:bg-foreground/[0.02]">
                        <td className="px-5 py-4 text-[13px] font-semibold text-brand-ink-2">
                          {label}
                        </td>
                        {panelProducts.map((p) => (
                          <td key={p.id} className="px-5 py-4 text-[13px] text-brand-ink-3">
                            {productContent[p.slug]?.features[key] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ── HOW ORDERING WORKS ────────────────────────────────── */}
      {!hasActiveFilters && (
        <section>
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-[22px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] p-6 sm:p-10 lg:p-14">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 70% at 15% 0%, var(--ambient-strong) 0%, transparent 62%), radial-gradient(50% 60% at 88% 100%, var(--ambient-strong) 0%, transparent 62%)",
                }}
                aria-hidden
              />
              <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-45" aria-hidden />

              <div className="relative">
                <SectionHeading
                  eyebrow="Process"
                  title="How ordering works"
                  description="A deliberate, manual process — it is what keeps access exclusive and keeps failures visible instead of silent."
                  align="center"
                  accent="blue"
                />

                <div className="mt-12">
                  <Steps
                    steps={[
                      {
                        title: "Select a plan",
                        description: "Choose the package that fits your needs and proceed to checkout.",
                      },
                      {
                        title: "Make payment",
                        description:
                          "Pay using the available methods and take a screenshot of the confirmed transaction.",
                      },
                      {
                        title: "Submit proof",
                        description:
                          "Upload your payment proof securely on the checkout page and confirm the amount.",
                      },
                      {
                        title: "Access granted",
                        description:
                          "Our team verifies manually (1–12h). Once cleared, your credentials are issued.",
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ── FAQ + SUPPORT ─────────────────────────────────────── */}
      {!hasActiveFilters && (
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <ScrollReveal>
              <h2 className="mb-7 text-[22px] font-extrabold tracking-[-0.02em] text-foreground sm:text-[26px]">
                Frequently asked questions
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={60}>
              <Accordion items={globalFAQ} />
            </ScrollReveal>
          </div>

          <div className="space-y-5 lg:col-span-5">
            <ScrollReveal from="right" delay={60}>
              <div className="rounded-[18px] mat-2 p-6">
                <span
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] border"
                  style={{
                    borderColor: "rgba(77,163,255,0.26)",
                    background: "var(--ambient-strong)",
                  }}
                  aria-hidden
                >
                  <ShieldCheck size={22} className="text-brand-ink-2" />
                </span>
                <h3 className="text-[16.5px] font-bold tracking-[-0.012em] text-foreground">
                  Secure &amp; private
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-brand-ink-3">
                  Manual verification keeps the panel exclusive. Nothing is
                  auto-issued, and no payment detail is ever stored in the browser.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal from="right" delay={130}>
              <div
                className="relative overflow-hidden rounded-[18px] border p-6"
                style={{
                  borderColor: "rgba(201,39,77,0.24)",
                  background:
                    "linear-gradient(165deg, var(--ambient-strong) 0%, var(--surface-raised) 62%)",
                }}
              >
                <span
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] border"
                  style={{
                    borderColor: "rgba(201,39,77,0.28)",
                    background: "var(--ambient-strong)",
                  }}
                  aria-hidden
                >
                  <Zap size={22} className="text-brand-red-400" />
                </span>
                <h3 className="text-[16.5px] font-bold tracking-[-0.012em] text-foreground">
                  Need priority support?
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-brand-ink-3">
                  Get one-to-one assistance with installation, configuration and
                  troubleshooting.
                </p>
                <Link
                  href="/products/mk-priority-support"
                  className="group mt-5 inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-[12px] border border-white/[0.14] px-5 text-[12.5px] font-bold uppercase tracking-[0.06em] text-white transition-transform duration-100 active:scale-[0.978]"
                  style={{
                    background: "linear-gradient(168deg,#C9274D 0%,#A51C3C 60%,#771329 100%)",
                    boxShadow: "0 1px 2px rgba(0,0,0,.4), 0 6px 18px rgba(165,28,60,.26)",
                  }}
                >
                  Get support add-on
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}
    </div>
  );
}
