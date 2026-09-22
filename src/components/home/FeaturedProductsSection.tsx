import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Crown, Calendar, Clock, Shield, Package, Headset } from "lucide-react";
import { productContent } from "@/lib/productContent";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  slug: string;
  coverImageUrl?: string | null;
}

/* ── helpers ─────────────────────────────────────────────── */
function getMeta(slug: string, index: number) {
  // badge
  const badge =
    slug.includes("lifetime") ? "BEST SELLER" :
    slug.includes("3-months") ? "BEST VALUE"  :
    slug.includes("weekly")   ? "TRIAL"        :
    (slug.includes("setup") || slug.includes("support")) ? "ADD-ON" : "";

  // accent colour
  const cycle  = index % 3;
  const accent = cycle === 1 ? "red" : cycle === 2 ? "neutral" : "blue";

  // icon
  const Icon =
    slug.includes("3-months") ? Crown     :
    slug.includes("monthly")  ? Calendar  :
    slug.includes("weekly")   ? Clock     :
    slug.includes("setup")    ? Package   :
    slug.includes("support")  ? Headset   : Shield;

  return { badge, accent, Icon };
}

/* ── Individual banner card ──────────────────────────────── */
function BannerCard({ product, index }: { product: Product; index: number }) {
  const { badge, accent, Icon } = getMeta(product.slug, index);
  const content = productContent[product.slug];
  const coverImage = product.coverImageUrl || content?.image;

  const isBlue = accent === "blue";
  const isRed  = accent === "red";

  const accentHex   = isBlue ? "#4DA3FF" : isRed ? "#FF2D55" : "#94A3B8";
  const accentAlpha = isBlue ? "rgba(77,163,255,0.18)"  : isRed ? "rgba(255,45,85,0.15)"  : "rgba(148,163,184,0.10)";
  const accentBorder= isBlue ? "rgba(77,163,255,0.30)"  : isRed ? "rgba(255,45,85,0.28)"  : "rgba(148,163,184,0.22)";
  const glowBg      = isBlue ? "rgba(47,95,208,0.12)"   : isRed ? "rgba(179,18,47,0.10)"  : "rgba(148,163,184,0.06)";
  const ctaGrad     = isRed
    ? "linear-gradient(135deg,#7A0E23,#B3122F)"
    : "linear-gradient(135deg,#1E3FA8,#2F5FD0)";
  const ctaShadow   = isRed
    ? "0 4px 16px rgba(179,18,47,0.32)"
    : "0 4px 16px rgba(47,95,208,0.32)";
  const ctaBorder   = isRed ? "rgba(255,45,85,0.35)" : "rgba(77,163,255,0.35)";

  const badgeCls = isBlue
    ? "bg-brand-neon-blue/10 border-brand-neon-blue/30 text-brand-neon-blue"
    : isRed
    ? "bg-brand-neon-red/10  border-brand-neon-red/30  text-brand-neon-red"
    : "bg-surface-glass border-border-subtle text-foreground/70";

  return (
    /* snap-item for carousel, full-width on mobile */
    <div
      className="snap-item w-[calc(100vw-32px)] sm:w-[min(420px,90vw)] md:w-full shrink-0 card-entrance"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <Link
        href={`/products/${product.slug}`}
        className="block rounded-[22px] overflow-hidden press-98 focus-visible:outline-2 focus-visible:outline-brand-neon-blue focus-visible:outline-offset-2 group"
        aria-label={`${product.name} — PKR ${product.price.toFixed(0)}`}
      >
        <div
          className="relative flex flex-col rounded-[22px] overflow-hidden border transition-colors duration-200"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {/* ── TOP HIGHLIGHT ── */}
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: "var(--border-top-highlight)" }} />

          {/* ── LARGE IMAGE BANNER ── */}
          <div
            className="relative w-full overflow-hidden bg-surface-raised"
            style={{ aspectRatio: "16/8" }}   /* Taller than 16/9 for more visual weight */
          >
            {coverImage ? (
              <>
                <Image
                  src={coverImage}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                  sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 768px) 420px, 33vw"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                {/* Gradient vignette — stronger bottom */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.35) 60%, rgba(15,23,42,0.72) 100%)",
                  }}
                />
                {/* Restrained side lighting */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 40% 60% at 8% 50%, ${glowBg}, transparent 70%)`,
                  }}
                />
              </>
            ) : (
              /* Rich placeholder */
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: `radial-gradient(ellipse at 30% 40%, ${accentAlpha}, transparent 65%), var(--surface-raised)`,
                }}
              >
                <Icon
                  size={52}
                  style={{ color: accentHex, filter: `drop-shadow(0 0 16px ${accentAlpha})` }}
                />
              </div>
            )}

            {/* Badge — absolute over image */}
            {badge && (
              <div className="absolute top-3.5 left-3.5 z-10">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[9px] sm:text-[10px] font-extrabold tracking-[0.14em] uppercase backdrop-blur-[6px] ${badgeCls}`}
                >
                  {badge}
                </span>
              </div>
            )}

            {/* Bottom-right product icon tag */}
            <div
              className="absolute bottom-3.5 right-3.5 z-10 w-9 h-9 rounded-[10px] flex items-center justify-center backdrop-blur-[6px] border"
              style={{ background: "rgba(15,23,42,0.55)", borderColor: accentBorder }}
            >
              <Icon size={18} style={{ color: accentHex }} />
            </div>
          </div>

          {/* ── CARD BODY ── */}
          <div className="flex flex-col p-4 sm:p-5">

            {/* Name */}
            <h3
              className="font-extrabold text-foreground tracking-tight leading-tight mb-1.5 line-clamp-2"
              style={{ fontSize: "clamp(17px,4.5vw,21px)" }}
            >
              {product.name}
            </h3>

            {/* Description */}
            <p className="text-[12px] sm:text-[13px] text-brand-ink-3 leading-relaxed mb-3 line-clamp-2">
              {product.description}
            </p>

            {/* Feature highlights */}
            {content?.highlights && content.highlights.length > 0 && (
              <ul className="space-y-1.5 mb-4">
                {content.highlights.slice(0, 3).map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={12} className="shrink-0 mt-[3px]" style={{ color: accentHex }} />
                    <span className="text-[11px] sm:text-[12px] text-foreground/80 leading-snug">{h}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Divider */}
            <div className="h-px w-full mb-3.5" style={{ background: "var(--border-subtle)" }} />

            {/* Price + CTA row */}
            <div className="flex items-center justify-between gap-3 min-w-0">
              {/* Price */}
              <div className="flex flex-col min-w-0">
                <span
                  className="font-extrabold text-foreground tracking-tight leading-none tabular-nums"
                  style={{ fontSize: "clamp(17px,4.8vw,22px)" }}
                >
                  PKR {product.price.toFixed(0)}
                </span>
                {content?.durationLabel && (
                  <span className="text-[10px] sm:text-[11px] text-brand-ink-3 font-medium mt-0.5 uppercase tracking-wide">
                    {content.durationLabel}
                  </span>
                )}
              </div>

              {/* CTA */}
              <div
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[11px] text-[11px] sm:text-[12px] font-bold tracking-[0.05em] uppercase text-white shrink-0 border"
                style={{
                  background: ctaGrad,
                  boxShadow: ctaShadow,
                  borderColor: ctaBorder,
                }}
              >
                VIEW PRODUCT
                <ArrowRight size={12} />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── Section ──────────────────────────────────────────────── */
export function FeaturedProductsSection({ products }: { products: Product[] }) {
  if (!products?.length) return null;

  return (
    <section className="relative bg-background pb-12 sm:pb-16 pt-3">
      {/* Separator */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "var(--border-subtle)" }} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 mb-5 sm:mb-6">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2 h-2 rounded-full animate-dot-pulse flex-shrink-0"
              style={{ background: "#4DA3FF", boxShadow: "0 0 6px rgba(77,163,255,0.7)" }}
            />
            <h2 className="text-[11px] sm:text-[13px] font-bold tracking-[0.18em] text-brand-neon-blue uppercase">
              Featured Products
            </h2>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-[12px] sm:text-[13px] font-bold text-brand-ink-3 hover:text-foreground transition-colors duration-150 group"
          >
            View all
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-150" />
          </Link>
        </div>

        {/* ── Mobile: full-width snap carousel (no side padding — cards fill) ── */}
        <div className="md:hidden overflow-hidden">
          <div className="snap-scroll-x no-scrollbar gap-3 px-4 sm:px-6 pb-4">
            {products.map((p, i) => (
              <BannerCard key={p.id} product={p} index={i} />
            ))}
            {/* Trailing spacer so last card snap is comfortable */}
            <div className="snap-item w-4 shrink-0" aria-hidden />
          </div>

          {/* Progress dots */}
          {products.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-4 px-4">
              {products.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === 0 ? "w-5 h-1.5 bg-brand-neon-blue" : "w-1.5 h-1.5 bg-border-subtle"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop: 2-col then 3-col grid, generous gap ── */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 px-6">
          {products.map((p, i) => (
            <BannerCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
