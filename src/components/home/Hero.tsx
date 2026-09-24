"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { HeroCanvas } from "@/components/three/HeroCanvas";
import { HeroProductSlider } from "@/components/home/HeroProductSlider";
import { TechLabel, TechIndex, TechRule } from "@/components/ui/Tech";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { Product } from "@/components/ui/ProductCard";

/**
 * Hero — the opening composition.
 *
 * ART DIRECTION
 * Rewritten around the reference aesthetic rather than the earlier restrained
 * SaaS layout. Three things carry it:
 *
 *   1. A full-bleed WebGL field of panel outlines behind the type, replacing the
 *      boxed CSS scene that previously sat in the right-hand column. The
 *      composition is now the whole viewport instead of a framed illustration.
 *   2. Genuinely large display type — the wordmark runs to the full fluid
 *      display scale, with the second line stroked rather than filled so it
 *      carries equal scale at lower weight.
 *   3. A monospace annotation layer (section marker, counters, units) that gives
 *      the section an engineered, documented feel.
 *
 * COLOUR
 * Achromatic. The primary action is a solid near-white block; the accent is
 * reserved for focus rings and the live indicator. Previously this hero used a
 * blue gradient CTA, blue icons and blue accent dots — decoration wearing the
 * brand colour, which is what made it read as generic.
 *
 * Everything numeric here is real data. The service indicators that used to sit
 * at the bottom have been replaced because one of them ("device-bound access")
 * claimed an enforcement the code does not implement.
 */
export function Hero({ products }: { products: Product[] }) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* ── Layer 1 — the WebGL field (self-gating; falls back to a static
             treatment on reduced-motion, low-tier and no-WebGL devices) ── */}
      <HeroCanvas />

      {/* ── Layer 2 — content ── */}
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {/* Opening annotation row — names the section the way a comment names a block */}
        <div className="flex items-center justify-between gap-4 pt-[112px] sm:pt-[128px]">
          <TechLabel tone="bright">hero</TechLabel>
          <TechLabel tone="dim" className="hidden sm:inline-flex">
            digital products — manual verification
          </TechLabel>
        </div>

        <TechRule className="mt-4" />

        {/* ── The wordmark ── */}
        <ScrollReveal>
          <h1 className="display display-tight mt-14 text-[length:var(--text-display-lg)] text-foreground sm:mt-16 lg:mt-20">
            MK PANEL
            <br />
            <span className="text-outline">ZONE</span>
          </h1>
        </ScrollReveal>

        {/* ── Supporting copy, set narrow against the wide wordmark ── */}
        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12">
          <ScrollReveal delay={80} className="lg:col-span-5">
            <p className="max-w-[46ch] text-[16px] leading-[1.62] text-brand-ink-2 sm:text-[17px]">
              Premium digital products with verified delivery and platform-locked
              access. Each order is reviewed by hand before access is issued, so
              everything works the first time.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={140} className="lg:col-span-4 lg:col-start-9">
            {/* Real figures only. `products.length` is the live catalogue count. */}
            <dl className="space-y-0">
              {[
                { label: "Catalogue", value: String(products.length).padStart(2, "0") },
                { label: "Platforms", value: "03" },
                { label: "Delivery", value: "Manual" },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 border-t border-border-subtle py-3"
                >
                  <dt>
                    <TechLabel tone="dim" size="sm">
                      {row.label}
                    </TechLabel>
                  </dt>
                  <dd className="font-mono text-[15px] font-medium text-foreground [font-variant-numeric:tabular-nums]">
                    {row.value}
                    <TechIndex current={i + 1} className="ml-3 tech-dim" />
                  </dd>
                </div>
              ))}
            </dl>
          </ScrollReveal>
        </div>

        {/* ── Actions ── */}
        <ScrollReveal delay={200}>
          <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-16">
            <Link
              href="/products"
              className="group inline-flex h-[62px] items-center justify-center gap-3 rounded-[12px] bg-[color:var(--text-1)] px-9 text-[14px] font-bold uppercase tracking-[0.06em] text-[color:var(--background)] transition-[opacity,transform] duration-100 hover:opacity-90 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
            >
              Explore products
              <ArrowRight
                size={17}
                className="transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>

            <Link
              href="/access"
              className="group inline-flex h-[62px] items-center justify-center gap-3 rounded-[12px] border border-border-strong px-9 text-[14px] font-bold uppercase tracking-[0.06em] text-foreground transition-colors duration-200 hover:bg-foreground/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
            >
              Customer access
              <ArrowUpRight
                size={17}
                className="text-brand-ink-3 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </ScrollReveal>

        {/* ── Closing annotation ── */}
        <ScrollReveal delay={260}>
          <div className="mt-16 flex flex-wrap items-center gap-x-7 gap-y-3 pb-20 lg:mt-20">
            {["Manual payment review", "Platform-locked access", "Guided setup"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2.5">
                <span
                  className="h-1 w-1 rounded-full bg-[color:var(--text-4)]"
                  aria-hidden
                />
                <TechLabel size="sm">{item}</TechLabel>
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* ── Product rail — the editorial index below the fold ── */}
      <div className="relative z-10 pb-20 sm:pb-24">
        <div className="mx-auto mb-6 w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <TechLabel tone="bright" size="sm">
              featured
            </TechLabel>
            <span className="h-px flex-1 bg-[color:var(--line-color)]" />
            <Link
              href="/products"
              className="group inline-flex items-center gap-1.5"
            >
              <TechLabel size="sm" className="transition-colors group-hover:text-foreground">
                all products
              </TechLabel>
              <ArrowRight
                size={12}
                className="text-brand-ink-4 transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </div>

        <HeroProductSlider products={products} />
      </div>
    </section>
  );
}
