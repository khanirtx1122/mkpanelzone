"use client";

import { ShieldCheck, Zap } from "lucide-react";
import { HeroProductSlider } from "@/components/home/HeroProductSlider";
import type { Product } from "@/components/ui/ProductCard";

export function Hero({ products }: { products: Product[] }) {
  return (
    <section className="relative hero-bg overflow-x-hidden pt-[80px] sm:pt-[96px] pb-6 sm:pb-10">
      {/* Top edge accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-neon-blue/20 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-2 text-center">

        {/* Premium badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full border border-brand-blue-500/25 animate-subtle-float"
          style={{ background: "var(--surface-glass)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-neon-blue animate-dot-pulse flex-shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-brand-neon-blue uppercase whitespace-nowrap">
            Premium Digital Platform
          </span>
        </div>

        {/* H1 — clamp() so it never overflows 320px */}
        <h1
          className="font-extrabold text-foreground tracking-tight leading-[1.1] mb-4"
          style={{ fontSize: "clamp(28px, 8.5vw, 48px)" }}
        >
          MK PANEL ZONE<br/>
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(90deg, #4DA3FF 0%, #2F5FD0 60%)" }}
          >
            TRUSTED
          </span>
          <br />
          PRODUCTS
        </h1>

        {/* Sub-text */}
        <p
          className="text-brand-ink-3 leading-relaxed mb-6 max-w-md mx-auto"
          style={{ fontSize: "clamp(13px, 3.8vw, 15px)" }}
        >
          Premium digital products, trusted access and everything you need in one place.
        </p>
      </div>
      
      {/* Product Slider replacing old chips */}
      <HeroProductSlider products={products} />
    </section>
  );
}
