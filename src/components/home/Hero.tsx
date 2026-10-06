import Link from "next/link";
import { HeroProductSlider } from "@/components/home/HeroProductSlider";
import { HeroSocialRotator } from "@/components/home/HeroSocialRotator";
import type { Product } from "@/components/ui/ProductCard";
import { getHeroCta } from "@/lib/freePanel";
import { getHeroSocialLinks } from "@/lib/social";

/**
 * Hero — server component so the Owner-configured Top CTA and the admin-managed
 * social links read directly from the database with zero client fetch.
 */
export async function Hero({ products }: { products: Product[] }) {
  const [cta, socialLinks] = await Promise.all([getHeroCta(), getHeroSocialLinks()]);

  return (
    <section className="relative hero-bg overflow-x-hidden pt-[80px] sm:pt-[96px] pb-6 sm:pb-10" data-analytics-section="hero">
      {/* Top edge accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-neon-blue/20 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-0 text-center">

        {/* Compact hero CTA slot — same footprint, three possible states:
            1. admin-configured social links → rotating social CTA
            2. admin-configured single CTA   → static CTA chip
            3. nothing configured            → static brand badge */}
        {socialLinks.length > 0 ? (
          <HeroSocialRotator links={socialLinks} />
        ) : cta.enabled ? (
          <Link
            href={cta.link}
            {...(cta.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            data-analytics-click="cta:hero"
            className="hero-cta group inline-flex items-center gap-2 pl-2.5 pr-2 h-[34px] mb-4 rounded-full border border-brand-blue-500/35 active:scale-[0.97] transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-brand-neon-blue focus-visible:outline-offset-2"
            style={{
              background:
                "linear-gradient(135deg, rgba(30,63,168,0.20), rgba(47,95,208,0.10))",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.10), 0 0 14px rgba(47,95,208,0.14)",
            }}
          >
            <span
              className="w-[6px] h-[6px] rounded-full shrink-0"
              style={{ background: "#4DA3FF", boxShadow: "0 0 7px rgba(77,163,255,0.85)" }}
            />
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.16em] text-brand-neon-blue uppercase whitespace-nowrap">
              {cta.text}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-brand-neon-blue/80 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full border border-brand-blue-500/25 animate-subtle-float"
            style={{ background: "var(--surface-glass)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-neon-blue animate-dot-pulse flex-shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-brand-neon-blue uppercase whitespace-nowrap">
              Premium Digital Platform
            </span>
          </div>
        )}

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
          className="text-brand-ink-3 leading-relaxed mb-4 max-w-md mx-auto"
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
