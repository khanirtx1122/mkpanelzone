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
  type LucideIcon,
} from "lucide-react";
import { productContent } from "@/lib/productContent";

export interface Product {
  id: string;
  name: string;
  /**
   * Nullable, matching the database column (`Product.description` is `String?`).
   *
   * This was previously declared as `string`, which is why every call site had
   * to cast with `as any` to pass Prisma rows in — and it hid a real crash:
   * `ProductsClient` ran `.toLowerCase()` straight on this field.
   */
  description: string | null;
  price: number;
  slug: string;
  coverImageUrl?: string | null;
}

/* ── Product presentation metadata ───────────────────────────────
   Badge and icon are derived from the slug so the visual language stays
   consistent everywhere a product is rendered. */
export function getProductMeta(slug: string) {
  let badge = "";
  if (slug.includes("lifetime")) badge = "BEST SELLER";
  else if (slug.includes("3-months")) badge = "BEST VALUE";
  else if (slug.includes("weekly")) badge = "TRIAL";
  else if (slug.includes("setup") || slug.includes("support")) badge = "ADD-ON";

  let Icon: LucideIcon = Shield;
  if (slug.includes("3-months")) Icon = Crown;
  else if (slug.includes("monthly")) Icon = Calendar;
  else if (slug.includes("weekly")) Icon = Clock;
  else if (slug.includes("setup")) Icon = Package;
  else if (slug.includes("support")) Icon = Headset;

  return { badge, Icon };
}

/**
 * The single product tone — achromatic, used by every card.
 *
 * This replaces a map that rotated deep blue → crimson → steel by grid
 * position. Rotating hue by index is decoration: it turned a product grid into
 * a wall of coloured gradients and spent the brand colours on nothing. In the
 * reference art direction the rhythm comes from type scale, index numbering and
 * layout, not from colour.
 */
export const PRODUCT_TONE = {
  text: "var(--text-2)",
  soft: "var(--ambient-blue)",
  border: "var(--border-subtle)",
  /** Outlined, not filled — the page's one solid CTA belongs to the hero. */
  cta: "transparent",
  shadow: "none",
} as const;

/**
 * ProductCard — premium product tile (spec §12).
 *
 * Hover response is deliberately restrained: a 2.5% image scale, a single
 * accent-light sweep across the image, a 1.5% lift and a border light-up.
 * No 20-degree tilt, no bouncing, no glow blobs.
 */
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
  const { badge, Icon } = getProductMeta(product.slug);
  const content = productContent[product.slug];
  const tone = PRODUCT_TONE;
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
      className="h-full group/card card-entrance"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Link
        href={`/products/${product.slug}`}
        className="block h-full rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
        aria-label={`${product.name} — PKR ${product.price.toFixed(0)}`}
      >
        <article
          className="relative flex flex-col h-full rounded-[18px] overflow-hidden border transition-[border-color,transform,box-shadow] duration-[var(--duration-normal)] ease-[cubic-bezier(.22,1,.36,1)]
                     border-[color:var(--border-subtle)] bg-[color:var(--surface)]
                     hover:border-[color:var(--border-strong)]
                     hover:-translate-y-[3px] hover:shadow-[var(--shadow-raised)]"
        >
          {/* Top-edge light — every card catches light from above */}
          <span
            className="absolute inset-x-0 top-0 h-px bg-[var(--border-top-highlight)] pointer-events-none z-20"
            aria-hidden
          />

          {/* ── VISUAL ── */}
          <div className="relative w-full overflow-hidden bg-surface-raised" style={{ aspectRatio: "16/9" }}>
            {coverImage ? (
              <>
                <Image
                  src={coverImage}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-[620ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover/card:scale-[1.025]"
                  sizes="(max-width: 640px) 95vw, (max-width: 1024px) 48vw, 33vw"
                  loading={index < 3 ? "eager" : "lazy"}
                />
                {/* Vignette — bottom weighted so type/price stay legible */}
                <span
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(7,10,15,0.02) 0%, rgba(7,10,15,0.28) 62%, rgba(7,10,15,0.70) 100%)",
                  }}
                  aria-hidden
                />
                {/* Accent lighting entering from the left edge */}
                <span
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(60% 70% at 4% 55%, ${tone.soft}, transparent 70%)` }}
                  aria-hidden
                />
                {/* Accent light sweep on hover — plays once, transform only */}
                <span
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover/card:opacity-100"
                  aria-hidden
                >
                  <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/[0.09] skew-x-[-14deg] transition-transform duration-[1000ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover/card:translate-x-[420%]" />
                </span>
              </>
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: `radial-gradient(70% 70% at 32% 40%, ${tone.soft}, transparent 68%), var(--surface-raised)` }}
              >
                <Icon size={44} style={{ color: tone.text }} aria-hidden />
              </div>
            )}

            {/* Badge */}
            {badge && (
              <span
                className="absolute top-3.5 left-3.5 z-10 inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.13em] backdrop-blur-[8px]"
                style={{
                  color: tone.text,
                  borderColor: tone.border,
                  background: "rgba(7,10,15,0.5)",
                }}
              >
                {badge}
              </span>
            )}

            {/* Category / duration chip */}
            {content?.durationLabel && (
              <span className="absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[rgba(7,10,15,0.5)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white/80 backdrop-blur-[8px]">
                <Clock size={9} aria-hidden />
                {content.durationLabel}
              </span>
            )}

            {/* Product identity mark */}
            <span
              className="absolute bottom-3.5 left-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-[9px] border backdrop-blur-[8px]"
              style={{ background: "rgba(7,10,15,0.55)", borderColor: tone.border }}
              aria-hidden
            >
              <Icon size={15} style={{ color: tone.text }} />
            </span>

            {featured && (
              <span
                className="absolute bottom-0 right-0 z-10 h-[2px] w-24 bg-gradient-to-l from-brand-red-500 to-transparent"
                aria-hidden
              />
            )}
          </div>

          {/* ── BODY ── */}
          <div className="flex flex-1 flex-col p-4 sm:p-[18px]">
            <h3 className="mb-1.5 text-[16px] sm:text-[17px] font-extrabold leading-snug tracking-[-0.014em] text-foreground line-clamp-2">
              {product.name}
            </h3>

            <p className="mb-3.5 text-[12.5px] leading-relaxed text-brand-ink-3 line-clamp-2">
              {product.description}
            </p>

            {/* Feature indicators */}
            {content?.highlights && content.highlights.length > 0 && (
              <ul className="mb-4 flex-1 space-y-1.5">
                {content.highlights.slice(0, 3).map((highlight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check
                      size={12}
                      className="mt-[3px] shrink-0"
                      style={{ color: tone.text }}
                      aria-hidden
                    />
                    <span className="text-[11.5px] leading-snug text-brand-ink-2">
                      {highlight}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Price + CTA */}
            <div className="mt-auto flex items-end justify-between gap-3 border-t border-border-subtle pt-3.5">
              <div className="flex min-w-0 flex-col">
                <span className="tabular text-[19px] sm:text-[21px] font-extrabold leading-none tracking-[-0.02em] text-foreground">
                  <span className="mr-1 text-[11px] font-bold text-brand-ink-3">PKR</span>
                  {product.price.toFixed(0)}
                </span>
                <span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[color:var(--status-success-text)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                  Available
                </span>
              </div>

              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-border-strong px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.055em] text-foreground transition-[transform,border-color,background-color] duration-[var(--duration-fast)] group-hover/card:scale-[1.03] group-hover/card:border-[color:var(--text-3)] group-hover/card:bg-foreground/[0.06]"
                style={{ background: tone.cta, boxShadow: tone.shadow }}
              >
                View
                <ArrowRight size={12} className="transition-transform duration-200 group-hover/card:translate-x-0.5" aria-hidden />
              </span>
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
}
