import Link from "next/link";
import { ArrowRight, Layers, Wrench } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import type { Product } from "@/components/ui/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

/**
 * MainProductsSection — the full catalogue, grouped and art-directed
 * (spec §13).
 *
 * Rather than one flat grid of equal tiles, products are split into the two
 * things they actually are — access packages and add-ons — and each group
 * gets an editorial header. Within a group the first card is allowed to
 * span wider on large screens so the eye has an entry point.
 *
 * The grouping is derived from the real product data (slug shape), and if a
 * product does not match either group it still appears under "All products"
 * so nothing is ever hidden.
 */
export function MainProductsSection({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return null;

  const isAddOn = (slug: string) =>
    slug.includes("setup") || slug.includes("support");

  const panels = products.filter((p) => !isAddOn(p.slug));
  const addOns = products.filter((p) => isAddOn(p.slug));

  const groups = [
    {
      key: "panels",
      title: "Access Packages",
      description:
        "Time-based panel access with updates and setup files included.",
      Icon: Layers,
      accent: "blue" as const,
      items: panels,
    },
    {
      key: "addons",
      title: "Add-ons & Support",
      description:
        "One-time extras: guided setup packs and priority assistance.",
      Icon: Wrench,
      accent: "crimson" as const,
      items: addOns,
    },
  ].filter((g) => g.items.length > 0);

  const ungrouped =
    panels.length === 0 && addOns.length === 0 ? products : [];

  return (
    <section className="relative py-16 sm:py-20 lg:py-24">
      {/* Narrative tone shift — this section sits slightly darker than the
          featured showcase above it, creating section continuity (§57). */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, var(--surface) 18%, var(--surface) 82%, transparent 100%)",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-[0.55]" aria-hidden />

      <div className="relative mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <ScrollReveal>
          <SectionHeading
            eyebrow="The Ecosystem"
            title="Everything in the catalogue"
            description="Real inventory, real pricing, verified manually. Pick the shape of access that suits how you work."
            accent="blue"
            actions={
              <Link
                href="/products"
                className="group inline-flex h-[42px] items-center gap-2 rounded-[11px] border border-border-subtle px-4 text-[12px] font-bold uppercase tracking-[0.07em] text-foreground transition-colors hover:border-border-strong hover:bg-foreground/[0.04]"
              >
                Compare all
                <ArrowRight
                  size={13}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            }
          />
        </ScrollReveal>

        {/* ── Grouped catalogue ── */}
        <div className="mt-12 space-y-16 sm:space-y-20">
          {groups.map((group, gi) => (
            <div key={group.key}>
              <ScrollReveal>
                <div className="mb-7 flex items-center gap-3.5">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-[12px] border"
                    style={{
                      borderColor:
                        group.accent === "crimson"
                          ? "rgba(201,39,77,0.26)"
                          : "rgba(77,163,255,0.26)",
                      background:
                        group.accent === "crimson"
                          ? "var(--ambient-strong)"
                          : "var(--ambient-strong)",
                    }}
                    aria-hidden
                  >
                    <group.Icon
                      size={17}
                      style={{
                        color: group.accent === "crimson" ? "#E4536F" : "#4DA3FF",
                      }}
                    />
                  </span>
                  <div>
                    <h3 className="text-[17px] font-extrabold tracking-[-0.016em] text-foreground">
                      {group.title}
                    </h3>
                    <p className="mt-1 text-[12.5px] text-brand-ink-3">{group.description}</p>
                  </div>
                  <span className="ml-auto hidden text-[10.5px] font-bold uppercase tracking-[0.13em] text-brand-ink-4 sm:block">
                    {group.items.length} item{group.items.length === 1 ? "" : "s"}
                  </span>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {group.items.map((product, i) => (
                  <div
                    key={product.id}
                    className={
                      /* First card of the first group earns extra width on
                         desktop so the grid has a clear entry point. */
                      gi === 0 && i === 0 ? "lg:col-span-1" : ""
                    }
                  >
                    <ProductCard
                      product={product}
                      index={gi * 3 + i}
                      featured={gi === 0 && i === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Safety net — never hide a product that matched no group */}
          {ungrouped.length > 0 && (
            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {ungrouped.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
