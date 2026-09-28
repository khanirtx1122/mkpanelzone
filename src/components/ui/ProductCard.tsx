"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  Crown,
  Calendar,
  Clock,
  Package,
  Headset,
  ArrowRight,
  Check,
} from "lucide-react";
import { productContent } from "@/lib/productContent";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  slug: string;
  coverImageUrl?: string | null;
}

function getProductMeta(slug: string, index: number) {
  // Badge
  let badge = "";
  if (slug.includes("lifetime")) badge = "BEST SELLER";
  else if (slug.includes("3-months")) badge = "BEST VALUE";
  else if (slug.includes("weekly")) badge = "TRIAL";
  else if (slug.includes("setup") || slug.includes("support")) badge = "ADD-ON";

  // Icon
  let Icon = Shield;
  if (slug.includes("3-months")) Icon = Crown;
  else if (slug.includes("monthly")) Icon = Calendar;
  else if (slug.includes("weekly")) Icon = Clock;
  else if (slug.includes("setup")) Icon = Package;
  else if (slug.includes("support")) Icon = Headset;

  // Accent
  const cycle = index % 3;
  const accent = cycle === 1 ? "red" : cycle === 2 ? "neutral" : "blue";

  return { badge, Icon, accent };
}

export function ProductCard({
  product,
  index = 0,
  featured = false,
}: {
  product: Product;
  index?: number;
  featured?: boolean;
}) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const { badge, Icon, accent } = getProductMeta(product.slug, index);
  const content = productContent[product.slug];

  const isBlue = accent === "blue";
  const isRed = accent === "red";

  // Accent colour values
  const accentHex = isBlue ? "#4DA3FF" : isRed ? "#FF2D55" : "#94A3B8";
  const accentAlpha = isBlue
    ? "rgba(77,163,255,0.18)"
    : isRed
    ? "rgba(255,45,85,0.15)"
    : "rgba(148,163,184,0.10)";
  const accentBorder = isBlue
    ? "rgba(77,163,255,0.30)"
    : isRed
    ? "rgba(255,45,85,0.28)"
    : "rgba(148,163,184,0.22)";
  const glowBg = isBlue
    ? "rgba(47,95,208,0.12)"
    : isRed
    ? "rgba(179,18,47,0.10)"
    : "rgba(148,163,184,0.06)";

  const badgeClass = isBlue
    ? "bg-brand-neon-blue/10 border-brand-neon-blue/30 text-brand-neon-blue"
    : isRed
    ? "bg-brand-neon-red/10 border-brand-neon-red/30 text-brand-neon-red"
    : "bg-surface-glass border-border-subtle text-foreground/70";

  const ctaGradient = isRed
    ? "linear-gradient(135deg,#7A0E23,#B3122F)"
    : "linear-gradient(135deg,#1E3FA8,#2F5FD0)";
  const ctaShadow = isRed
    ? "0 4px 16px rgba(179,18,47,0.32)"
    : "0 4px 16px rgba(47,95,208,0.32)";
  const ctaBorder = isRed
    ? "rgba(255,45,85,0.35)"
    : "rgba(77,163,255,0.35)";

  const coverImage = product.coverImageUrl || content?.image;

  // Mark animated after entrance so it never replays on re-mount
  React.useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      el.dataset.animated = "true";
    }, 700 + index * 70);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      ref={cardRef}
      className="h-full relative group/card card-entrance"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Link
        href={`/products/${product.slug}`}
        className="block h-full tap-flat press-98 focus-visible:outline-2 focus-visible:outline-brand-neon-blue focus-visible:outline-offset-2 rounded-[22px]"
        aria-label={`${product.name} — PKR ${product.price.toFixed(0)}`}
      >
        <div 
          className="relative flex flex-col h-full rounded-[22px] overflow-hidden border transition-colors duration-200 group-hover/card:border-[color:var(--border-subtle-hover)]"
          style={{ background: "var(--surface)", borderColor: "var(--border-subtle)" }}
        >
          {/* Top-edge highlight */}
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: "var(--border-top-highlight)" }} />

          {/* Hover edge light — restrained, accent-matched */}
          <div
            className="absolute inset-x-0 top-0 h-[2px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${accentHex}, transparent)` }}
          />

          {/* Featured accent edges */}
          {featured && (
            <>
              <div className="absolute top-0 left-0 w-16 h-[2px] bg-gradient-to-r from-brand-neon-blue to-transparent rounded-tl-[22px] opacity-80 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-16 h-[2px] bg-gradient-to-l from-brand-neon-red to-transparent rounded-br-[22px] opacity-80 pointer-events-none" />
            </>
          )}

          {/* ── IMAGE AREA ── */}
          <div className="relative w-full overflow-hidden bg-surface-raised" style={{ aspectRatio: "16/8" }}>
            {coverImage ? (
              <>
                <Image
                  src={coverImage}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover/card:scale-[1.025]"
                  sizes="(max-width: 640px) 95vw, (max-width: 1024px) 48vw, 33vw"
                  loading={index < 3 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 pointer-events-none card-img-overlay" />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 40% 60% at 8% 50%, ${glowBg}, transparent 70%)`,
                  }}
                />
              </>
            ) : (
              /* Placeholder */
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: `radial-gradient(ellipse at 30% 40%, ${accentAlpha}, transparent 65%), var(--surface-raised)`,
                }}
              >
                <Icon
                  size={48}
                  style={{
                    color: accentHex,
                    filter: `drop-shadow(0 0 16px ${accentAlpha})`,
                  }}
                />
              </div>
            )}

            {/* Badge */}
            {badge && (
              <div className="absolute top-3.5 left-3.5 z-10">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[9px] sm:text-[10px] font-extrabold tracking-[0.14em] uppercase backdrop-blur-[6px] ${badgeClass}`}
                >
                  {badge}
                </span>
              </div>
            )}

            {/* Icon tag */}
            <div
              className="absolute bottom-3.5 right-3.5 z-10 w-9 h-9 rounded-[10px] flex items-center justify-center backdrop-blur-[6px] border"
              style={{ background: "rgba(15,23,42,0.55)", borderColor: accentBorder }}
            >
              <Icon size={18} style={{ color: accentHex }} />
            </div>
          </div>

          {/* ── CARD BODY ── */}
          <div className="flex flex-col flex-1 p-4 sm:p-5">
            {/* Product name */}
            <h3 
              className="font-extrabold text-foreground tracking-tight leading-tight mb-1.5 line-clamp-2"
              style={{ fontSize: "clamp(17px,4.5vw,21px)" }}
            >
              {product.name}
            </h3>

            {/* Short description */}
            <p className="text-[12px] sm:text-[13px] text-brand-ink-3 leading-relaxed mb-3.5 line-clamp-2 flex-none">
              {product.description}
            </p>

            {/* Key features */}
            {content && content.highlights.length > 0 && (
              <ul className="space-y-1.5 mb-4 flex-1">
                {content.highlights.slice(0, 3).map((highlight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check
                      size={12}
                      className="shrink-0 mt-[3px]"
                      style={{ color: accentHex }}
                    />
                    <span className="text-[11px] sm:text-[12px] text-foreground/80 leading-snug">
                      {highlight}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Divider */}
            <div className="h-px w-full mb-3.5 mt-auto" style={{ background: "var(--border-subtle)" }} />

            {/* ── PRICE + CTA ── */}
            <div className="flex items-center justify-between gap-3 min-w-0">
              {/* Price */}
              <div className="flex flex-col min-w-0">
                <span
                  className="flex items-baseline gap-1.5 min-w-0"
                  aria-label={`PKR ${product.price.toFixed(0)}`}
                >
                  <span className="text-[10px] font-bold text-brand-ink-3 uppercase tracking-[0.1em] self-center pt-px">
                    PKR
                  </span>
                  <span
                    className="tabular-nums font-extrabold text-foreground tracking-tight leading-none truncate"
                    style={{ fontSize: "clamp(17px,4.8vw,22px)" }}
                  >
                    {product.price.toFixed(0)}
                  </span>
                </span>
                {content && (
                  <span className="text-[10px] sm:text-[11px] text-brand-ink-3 font-medium mt-0.5 uppercase tracking-wide">
                    {content.durationLabel}
                  </span>
                )}
              </div>

              {/* CTA */}
              <div
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[11px] text-[11px] sm:text-[12px] font-bold tracking-[0.05em] uppercase text-white border shrink-0 transition-transform duration-300 group-hover/card:scale-[1.03]"
                style={{
                  background: ctaGradient,
                  boxShadow: ctaShadow,
                  borderColor: ctaBorder,
                }}
              >
                VIEW
                <ArrowRight
                  size={12}
                  className="transition-transform duration-300 group-hover/card:translate-x-0.5"
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
