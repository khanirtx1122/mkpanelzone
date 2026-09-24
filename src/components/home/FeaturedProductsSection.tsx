import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Clock, Crown, Shield, Calendar, Package, Headset } from "lucide-react";
import { productContent } from "@/lib/productContent";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Product } from "@/components/ui/ProductCard";

/*
  This file used to declare its own `Product` interface. It was a near-copy of
  the shared one in ProductCard, except that it typed `description` as
  non-nullable — which is what forced `as any` at every call site, because the
  database column is `String?`. Importing the single shared type removes the
  duplication and the casts together.
*/

/**
 * ProductIcon — renders the icon that represents a product slug.
 *
 * This replaces an `iconFor(slug)` helper that *returned a component*, which was
 * then used as `<Icon />`. The reference it returned was perfectly stable, but
 * `react-hooks/static-components` cannot know that a function call returns a
 * constant, so it flagged all three call sites as "creating a component during
 * render" — and a component created during render loses its state on every
 * parent render, so the rule is worth honouring rather than suppressing.
 *
 * Declaring a real component and rendering literal elements inside it makes the
 * stability obvious: every icon is a module-level import.
 */
function ProductIcon({
  slug,
  size,
  className,
  style,
}: {
  slug: string;
  size: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const common = { size, className, style, "aria-hidden": true } as const;

  if (slug.includes("3-months")) return <Crown {...common} />;
  if (slug.includes("monthly")) return <Calendar {...common} />;
  if (slug.includes("weekly")) return <Clock {...common} />;
  if (slug.includes("setup")) return <Package {...common} />;
  if (slug.includes("support")) return <Headset {...common} />;
  return <Shield {...common} />;
}

function badgeFor(slug: string) {
  if (slug.includes("lifetime")) return "Best Seller";
  if (slug.includes("3-months")) return "Best Value";
  if (slug.includes("weekly")) return "Trial";
  if (slug.includes("setup") || slug.includes("support")) return "Add-on";
  return "";
}

/**
 * FeaturedProductsSection — editorial product hierarchy (spec §13).
 *
 * Deliberately NOT "three identical cards in a row". The lead product gets a
 * full-width showcase with its own lighting and a real feature list; the two
 * supporting products sit beside it at a smaller scale. The data stays fully
 * dynamic — only the composition is fixed.
 */
export function FeaturedProductsSection({ products }: { products: Product[] }) {
  if (!products?.length) return null;

  const [lead, ...rest] = products;
  const secondary = rest.slice(0, 2);
  const leadContent = productContent[lead.slug];
  const leadImage = lead.coverImageUrl || leadContent?.image;

  return (
    <section className="relative py-16 sm:py-20 lg:py-24">
      {/* Section continuity: accent light fades in from the section above */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background:
            "linear-gradient(180deg, var(--background) 0%, transparent 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-border-strong to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <ScrollReveal>
          <SectionHeading
            eyebrow="Featured"
            title={
              <>
                Chosen by the people who
                <br className="hidden sm:block" /> actually use it
              </>
            }
            description="Our most requested packages, with the setup support that keeps them working."
            accent="blue"
            actions={
              <Link
                href="/products"
                className="group inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.08em] text-brand-ink-3 transition-colors hover:text-foreground"
              >
                All products
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            }
          />
        </ScrollReveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-12 lg:gap-6">
          {/* ── LEAD SHOWCASE ── */}
          <ScrollReveal className="lg:col-span-7" from="left">
            <Link
              href={`/products/${lead.slug}`}
              className="group block h-full rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
            >
              <article className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] transition-[border-color,box-shadow] duration-[var(--duration-normal)] hover:border-[color:var(--border-strong)] hover:shadow-[var(--shadow-raised)]">
                <span className="absolute inset-x-0 top-0 z-20 h-px bg-[var(--border-top-highlight)]" aria-hidden />

                {/* Immersive visual */}
                <div className="relative w-full overflow-hidden bg-surface-raised" style={{ aspectRatio: "16/8" }}>
                  {leadImage ? (
                    <>
                      <Image
                        src={leadImage}
                        alt={lead.name}
                        fill
                        className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
                        sizes="(max-width: 1024px) 100vw, 58vw"
                        priority
                      />
                      <span
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to bottom, rgba(7,10,15,0.04) 0%, rgba(7,10,15,0.34) 58%, rgba(7,10,15,0.86) 100%)",
                        }}
                        aria-hidden
                      />
                      <span
                        className="absolute inset-0"
                        style={{
                          background:
                            "radial-gradient(60% 75% at 2% 60%, var(--ambient-strong), transparent 72%)",
                        }}
                        aria-hidden
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(70%_70%_at_35%_40%,var(--ambient-strong),transparent_70%)]">
                      <ProductIcon slug={lead.slug} size={52} className="text-brand-ink-2" />
                    </div>
                  )}

                  <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
                    <StatusBadge tone="info" size="sm" icon={Crown}>
                      {badgeFor(lead.slug) || "Premium"}
                    </StatusBadge>
                    {leadContent?.durationLabel && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[rgba(7,10,15,0.5)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.09em] text-white/85 backdrop-blur-[8px]">
                        <Clock size={10} aria-hidden />
                        {leadContent.durationLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-foreground sm:text-[26px]">
                    {lead.name}
                  </h3>
                  <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-brand-ink-3">
                    {lead.description}
                  </p>

                  {leadContent?.highlights && (
                    <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                      {leadContent.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check size={13} className="mt-[3px] shrink-0 text-brand-ink-2" aria-hidden />
                          <span className="text-[12.5px] leading-snug text-brand-ink-2">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-border-subtle pt-5">
                    <div>
                      <span className="tabular block text-[26px] font-extrabold leading-none tracking-[-0.025em] text-foreground">
                        <span className="mr-1.5 text-[12px] font-bold text-brand-ink-3">PKR</span>
                        {lead.price.toFixed(0)}
                      </span>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.09em] text-[color:var(--status-success-text)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                        Available now
                      </span>
                    </div>

                    <span
                      className="inline-flex h-[46px] items-center gap-2 rounded-[12px] border border-white/[0.14] px-5 text-[12.5px] font-bold uppercase tracking-[0.06em] text-white transition-transform duration-[var(--duration-fast)] group-hover:scale-[1.03]"
                      style={{
                        background: "linear-gradient(168deg,#3478E8 0%,#2457C5 58%,#1C3D91 100%)",
                        boxShadow: "0 1px 2px rgba(0,0,0,.4), 0 8px 22px var(--ambient-strong)",
                      }}
                    >
                      View product
                      <ArrowRight size={14} aria-hidden />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          </ScrollReveal>

          {/* ── SECONDARY ── */}
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 lg:gap-6">
            {secondary.map((product, i) => (
              <ScrollReveal key={product.id} from="right" delay={90 + i * 80}>
                <SecondaryCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SecondaryCard({ product }: { product: Product }) {
  const content = productContent[product.slug];
  const image = product.coverImageUrl || content?.image;
  /*
    This alternated crimson and deep blue by grid position. Rotating the brand
    hues by index is decoration — the two cards read as a set because of their
    shared layout, not because one is pink and one is blue.
  */
  const accent = "var(--text-2)";
  const accentSoft = "var(--ambient-strong)";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block h-full rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
    >
      <article className="relative flex h-full items-stretch overflow-hidden rounded-[18px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] transition-[border-color,transform,box-shadow] duration-[var(--duration-normal)] hover:-translate-y-[3px] hover:border-[color:var(--border-strong)] hover:shadow-[var(--shadow-raised)]">
        <span className="absolute inset-x-0 top-0 z-20 h-px bg-[var(--border-top-highlight)]" aria-hidden />

        {/* Visual — a portrait strip, so the two supporting cards read as a set
            but never mirror the lead showcase. */}
        <div className="relative w-[36%] shrink-0 overflow-hidden bg-surface-raised">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              className="object-cover transition-transform duration-[620ms] group-hover:scale-[1.05]"
              sizes="(max-width: 640px) 40vw, 200px"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: `radial-gradient(80% 80% at 40% 40%, ${accentSoft}, transparent 70%)` }}
            >
              <ProductIcon slug={product.slug} size={30} style={{ color: accent }} />
            </div>
          )}
          <span
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, ${accentSoft}, transparent 70%)`,
            }}
            aria-hidden
          />
          <span
            className="absolute inset-y-0 right-0 w-px bg-border-subtle"
            aria-hidden
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div className="mb-2.5 flex items-center gap-2">
            <ProductIcon slug={product.slug} size={14} style={{ color: accent }} />
            {badgeFor(product.slug) && (
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.13em]" style={{ color: accent }}>
                {badgeFor(product.slug)}
              </span>
            )}
          </div>

          <h3 className="text-[16px] font-extrabold leading-snug tracking-[-0.014em] text-foreground line-clamp-2">
            {product.name}
          </h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-brand-ink-3 line-clamp-2">
            {product.description}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-border-subtle pt-3.5">
            <span className="tabular text-[18px] font-extrabold leading-none tracking-[-0.02em] text-foreground">
              <span className="mr-1 text-[10px] font-bold text-brand-ink-3">PKR</span>
              {product.price.toFixed(0)}
            </span>
            <ArrowRight
              size={15}
              className="text-brand-ink-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
              aria-hidden
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
