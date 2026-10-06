"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, Crown, Calendar, Clock, Package, Headset } from "lucide-react";
import { productContent } from "@/lib/productContent";
import type { Product } from "@/components/ui/ProductCard";
import { Reveal } from "@/components/ui/Reveal";

function getMeta(slug: string) {
  let badge = "";
  if (slug.includes("lifetime")) badge = "BEST SELLER";
  else if (slug.includes("3-months")) badge = "BEST VALUE";
  else if (slug.includes("weekly")) badge = "TRIAL";
  else if (slug.includes("setup") || slug.includes("support")) badge = "ADD-ON";

  let Icon = Shield;
  if (slug.includes("3-months")) Icon = Crown;
  else if (slug.includes("monthly")) Icon = Calendar;
  else if (slug.includes("weekly")) Icon = Clock;
  else if (slug.includes("setup")) Icon = Package;
  else if (slug.includes("support")) Icon = Headset;

  return { badge, Icon };
}

export function CompactProductCard({ product, index }: { product: Product; index: number }) {
  const { badge, Icon } = getMeta(product.slug);
  const content = productContent[product.slug];
  const coverImage = product.coverImageUrl || content?.image;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="rgb-border group flex flex-col rounded-[18px] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-[3px] active:scale-[0.98] card-entrance tap-flat"
      style={{ animationDelay: `${index * 50}ms` }}
      aria-label={`${product.name} — PKR ${product.price.toFixed(0)}`}
    >
      {/* Inner opaque surface — sits above the rotating RGB ring so only the
          card edge ever shows the animation (no colour bleeding into content). */}
      <div className="relative z-[1] flex flex-col flex-1 rounded-[17px] overflow-hidden bg-surface-glass">
      {/* ── IMAGE / ICON AREA ── */}
      <div className="relative w-full aspect-[16/10] bg-surface-raised overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.015]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading={index < 4 ? "eager" : "lazy"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-neon-blue/5 to-transparent">
            <Icon size={40} className="text-brand-neon-blue/80 drop-shadow-[0_0_10px_rgba(77,163,255,0.2)]" />
          </div>
        )}

        {/* Inner gradient overlay for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex flex-col flex-1 p-4">
        
        {badge && (
          <div className="mb-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-brand-neon-blue/10 border border-brand-neon-blue/20 text-[9px] font-bold tracking-[0.1em] uppercase text-brand-neon-blue">
              {badge}
            </span>
          </div>
        )}

        <h3 className="text-[15px] sm:text-[16px] font-bold text-foreground tracking-tight leading-snug mb-3 line-clamp-2">
          {product.name}
        </h3>

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-border-subtle">
          <div className="flex flex-col">
            <span className="text-[16px] sm:text-[18px] font-extrabold text-foreground tracking-tight leading-none">
              PKR {product.price.toFixed(0)}
            </span>
            {content?.durationLabel && (
              <span className="text-[9px] text-brand-ink-3 font-semibold uppercase tracking-wider mt-1">
                {content.durationLabel}
              </span>
            )}
          </div>

          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-[0.05em] uppercase text-white transition-transform duration-300 group-hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg,#1E3FA8,#2F5FD0)",
              boxShadow: "0 2px 8px rgba(47,95,208,0.25)"
            }}
          >
            VIEW
            <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
      </div>
    </Link>
  );
}

export function MainProductsSection({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 relative bg-background border-t border-border-subtle" data-analytics-section="explore_products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <Reveal className="text-center mb-10 sm:mb-12">
          <h2 className="text-[20px] sm:text-[24px] font-extrabold text-foreground tracking-widest uppercase mb-2">
            Explore Products
          </h2>
          <p className="text-[12px] sm:text-[14px] text-brand-ink-3 font-medium">
            Choose the product that fits your setup.
          </p>
        </Reveal>

        {/*
          Grid: 1 col on the narrowest phones, 2 from 380px, 3 from md.
          Each card carries its own scroll reveal so the grid cascades in.
        */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {products.map((product, idx) => (
            <Reveal key={product.id} delay={Math.min(idx, 5) * 60}>
              <CompactProductCard product={product} index={idx} />
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
