"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { productContent } from "@/lib/productContent";
import { getProductMeta } from "@/components/ui/ProductCard";
import type { Product } from "@/components/ui/ProductCard";

/**
 * HeroProductSlider — the hero's product showcase rail (spec §8, §12).
 *
 * Rebuilt as a snap-scrolling rail rather than a JS-driven infinite
 * carousel: native scroll gives momentum, keyboard support and accessibility
 * for free, the arrow controls simply page the container, and the whole
 * thing keeps working if JavaScript is slow to hydrate. Edge fades signal
 * that more content exists without adding chrome.
 */
export function HeroProductSlider({ products }: { products: Product[] }) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const items = React.useMemo(() => products.slice(0, 8), [products]);

  const sync = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const page = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 280);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      {/* Edge fades — signal overflow without extra chrome */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-[color:var(--background)] to-transparent transition-opacity duration-300 sm:w-16 ${
          atStart ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-[color:var(--background)] to-transparent transition-opacity duration-300 sm:w-16 ${
          atEnd ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      />

      {/* Arrow controls — desktop only; native swipe handles touch */}
      <button
        type="button"
        onClick={() => page(-1)}
        disabled={atStart}
        aria-label="Scroll products left"
        className="absolute left-3 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border-subtle bg-[var(--surface-glass)] text-brand-ink-2 backdrop-blur-md transition-[opacity,transform,border-color] duration-200 hover:border-border-strong hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-0 lg:flex"
      >
        <ChevronLeft size={17} />
      </button>
      <button
        type="button"
        onClick={() => page(1)}
        disabled={atEnd}
        aria-label="Scroll products right"
        className="absolute right-3 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border-subtle bg-[var(--surface-glass)] text-brand-ink-2 backdrop-blur-md transition-[opacity,transform,border-color] duration-200 hover:border-border-strong hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-0 lg:flex"
      >
        <ChevronRight size={17} />
      </button>

      <div
        ref={scrollerRef}
        className="snap-scroll-x no-scrollbar gap-3.5 px-4 pb-2 sm:gap-4 sm:px-6"
        role="region"
        aria-label="Featured products"
        tabIndex={0}
      >
        {items.map((product, i) => (
          <ShowcaseCard key={product.id} product={product} index={i} />
        ))}
        {/* Trailing spacer so the last card can snap clear of the edge */}
        <div className="w-1 shrink-0 sm:w-4" aria-hidden />
      </div>
    </div>
  );
}

function ShowcaseCard({ product, index }: { product: Product; index: number }) {
  const { badge, Icon } = getProductMeta(product.slug);
  const content = productContent[product.slug];
  const image = product.coverImageUrl || content?.image;

  /* Achromatic — the previous version picked one of three brand hues by grid
     position, which is decoration rather than information. */
  const accentColor = "var(--text-2)";
  const accentSoft = "var(--ambient-blue)";

  return (
    <div
      className="snap-item w-[78vw] max-w-[300px] shrink-0 sm:w-[300px]"
      style={{ scrollMarginLeft: "1rem" }}
    >
      <Link
        href={`/products/${product.slug}`}
        className="group block h-full rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
        aria-label={`${product.name} — PKR ${product.price.toFixed(0)}`}
      >
        <article className="relative flex h-full flex-col overflow-hidden rounded-[18px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] transition-[border-color,transform,box-shadow] duration-[var(--duration-normal)] ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-[3px] hover:border-[color:var(--border-strong)] hover:shadow-[var(--shadow-raised)]">
          <span className="absolute inset-x-0 top-0 z-20 h-px bg-[var(--border-top-highlight)]" aria-hidden />

          {/* Visual */}
          <div className="relative w-full overflow-hidden bg-surface-raised" style={{ aspectRatio: "16/10" }}>
            {image ? (
              <Image
                src={image}
                alt=""
                fill
                className="object-cover transition-transform duration-[620ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
                sizes="300px"
                loading={index < 3 ? "eager" : "lazy"}
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: `radial-gradient(70% 70% at 35% 40%, ${accentSoft}, transparent 68%)` }}
              >
                <Icon size={34} style={{ color: accentColor }} />
              </div>
            )}

            <span
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(7,10,15,0.06) 0%, rgba(7,10,15,0.42) 62%, rgba(7,10,15,0.80) 100%)",
              }}
              aria-hidden
            />
            <span
              className="absolute inset-0"
              style={{ background: `radial-gradient(58% 70% at 3% 55%, ${accentSoft}, transparent 72%)` }}
              aria-hidden
            />

            {badge && (
              <span
                className="absolute left-3 top-3 z-10 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.13em] backdrop-blur-[8px]"
                style={{ color: accentColor, borderColor: accentSoft, background: "rgba(7,10,15,0.5)" }}
              >
                {badge}
              </span>
            )}

            {content?.durationLabel && (
              <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-white/10 bg-[rgba(7,10,15,0.5)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white/80 backdrop-blur-[8px]">
                <Clock size={8} aria-hidden />
                {content.durationLabel}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col p-4">
            <h3 className="text-[14.5px] font-extrabold leading-snug tracking-[-0.012em] text-foreground line-clamp-2">
              {product.name}
            </h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-brand-ink-3 line-clamp-2">
              {product.description}
            </p>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-border-subtle pt-3.5">
              <span className="tabular text-[17px] font-extrabold leading-none tracking-[-0.02em] text-foreground">
                <span className="mr-1 text-[10px] font-bold text-brand-ink-3">PKR</span>
                {product.price.toFixed(0)}
              </span>

              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-brand-ink-2 transition-transform duration-200 group-hover:translate-x-0.5">
                View
                <ArrowRight size={12} aria-hidden />
              </span>
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
}
