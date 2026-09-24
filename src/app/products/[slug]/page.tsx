import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  Crown,
  ArrowRight,
  Clock,
  ShieldCheck,
  Layers,
  Headset,
} from "lucide-react";
import { productContent, globalFAQ, trustList } from "@/lib/productContent";
import { Accordion } from "@/components/ui/Accordion";
import { Steps } from "@/components/ui/Steps";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductVideoPlayer } from "@/components/ui/ProductVideoPlayer";
import { StickyPurchaseBar } from "./StickyPurchaseBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { slug: resolvedParams.slug, active: true },
    });
    if (!product) return { title: "Product Not Found" };
    return {
      title: `${product.name} | MK Panel Zone`,
      description: product.description || undefined,
      openGraph: {
        title: product.name,
        description: product.description || undefined,
        type: "website",
      },
    };
  } catch {
    return { title: "MK Panel Zone" };
  }
}

const getBadgeForSlug = (slug: string) => {
  if (slug.includes("lifetime")) return "Best Seller";
  if (slug.includes("3-months")) return "Best Value";
  if (slug.includes("weekly")) return "Trial";
  if (slug.includes("setup") || slug.includes("support")) return "Add-on";
  return "";
};

export default async function ProductDetailsPage({ params }: Props) {
  const resolvedParams = await params;

  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug, active: true },
  });

  if (!product) notFound();

  const content = productContent[product.slug];
  const badge = getBadgeForSlug(product.slug);
  const detailFAQs = globalFAQ.slice(0, 3);

  const relatedProducts = await prisma.product.findMany({
    where: { active: true, slug: { not: product.slug } },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://mkpanel.zone/products/${product.slug}`,
    },
  };

  const heroImage = product.coverImageUrl || content?.image;

  return (
    <div className="relative min-h-screen pb-24 pt-[104px] sm:pt-[124px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Background depth */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px]"
        style={{
          background:
            "radial-gradient(55% 55% at 82% 0%, var(--ambient-strong) 0%, transparent 66%), radial-gradient(45% 45% at 6% 34%, var(--ambient-strong) 0%, transparent 66%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-grid opacity-45"
        style={{
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.8), transparent)",
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.8), transparent)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.11em] text-brand-ink-3"
        >
          <Link href="/products" className="transition-colors hover:text-foreground">
            Products
          </Link>
          <ChevronRight size={12} className="opacity-50" aria-hidden />
          <span className="truncate text-brand-ink-2 max-w-[220px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* ── LEFT: IMMERSIVE VISUAL ── */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[104px]">
              {product.videoEnabled && product.demoVideoUrl ? (
                <ScrollReveal from="left">
                  <ProductVideoPlayer
                    videoUrl={product.demoVideoUrl}
                    posterUrl={product.demoVideoPosterUrl}
                    coverImageUrl={heroImage}
                    productName={product.name}
                    autoplay={product.videoAutoplay}
                    muted={product.videoMutedDefault}
                    loop={product.videoLoop}
                  />
                </ScrollReveal>
              ) : (
                <ScrollReveal from="left">
                  <div className="relative aspect-square w-full overflow-hidden rounded-[24px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)]">
                    <span className="absolute inset-x-0 top-0 z-20 h-px bg-[var(--border-top-highlight)]" aria-hidden />

                    {heroImage ? (
                      <>
                        <Image
                          src={heroImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 46vw"
                          priority
                        />
                        <span
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(to bottom, rgba(7,10,15,0.04) 0%, rgba(7,10,15,0.20) 55%, rgba(7,10,15,0.72) 100%)",
                          }}
                          aria-hidden
                        />
                      </>
                    ) : (
                      <>
                        <span
                          className="absolute inset-0"
                          style={{
                            background:
                              "radial-gradient(75% 70% at 32% 28%, var(--ambient-strong) 0%, transparent 68%), linear-gradient(160deg, var(--surface-raised), var(--background))",
                          }}
                          aria-hidden
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative flex h-[180px] w-[180px] items-center justify-center sm:h-[220px] sm:w-[220px]">
                            <span className="animate-slow-spin absolute inset-0 rounded-full border border-border-strong" />
                            <span
                              className="animate-slow-spin-rev absolute inset-[15%] rounded-full border border-[var(--ambient-strong)]"
                              style={{ borderStyle: "dashed" }}
                            />
                            <Crown className="h-14 w-14 text-brand-ink-2 sm:h-16 sm:w-16" aria-hidden />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Floating meta chips over the visual */}
                    <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
                      {content?.durationLabel && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[rgba(7,10,15,0.55)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.09em] text-white/85 backdrop-blur-[8px]">
                          <Clock size={10} aria-hidden />
                          {content.durationLabel}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(61,220,151,0.28)] bg-[rgba(7,10,15,0.55)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.09em] text-[color:var(--status-success-text)] backdrop-blur-[8px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                        In stock
                      </span>
                    </div>
                  </div>
                </ScrollReveal>
              )}

              {/* Trust panel under the visual — desktop only */}
              <ScrollReveal from="left" delay={100}>
                <ul className="mt-6 hidden space-y-3 rounded-[16px] border border-border-subtle bg-surface-raised p-5 lg:block">
                  {trustList.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={15}
                        className="mt-[2px] shrink-0 text-brand-ink-2"
                        aria-hidden
                      />
                      <span className="text-[12.5px] leading-relaxed text-brand-ink-2">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            </div>
          </div>

          {/* ── RIGHT: DETAILS ── */}
          <div className="lg:col-span-7">
            <ScrollReveal>
              <div className="mb-9">
                {badge && (
                  <StatusBadge tone="info" size="sm" icon={Crown}>
                    {badge}
                  </StatusBadge>
                )}

                <h1
                  className="mt-5 font-extrabold leading-[1.05] tracking-[-0.032em] text-foreground"
                  style={{ fontSize: "clamp(30px, 6vw, 54px)" }}
                >
                  {product.name}
                </h1>

                <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
                  <span
                    className="tabular font-extrabold leading-none tracking-[-0.03em] text-foreground"
                    style={{ fontSize: "clamp(30px, 6.5vw, 44px)" }}
                  >
                    <span className="mr-2 text-[14px] font-bold text-brand-ink-3">PKR</span>
                    {product.price.toFixed(0)}
                  </span>
                  {content && (
                    <span className="mb-1 text-[12px] font-bold uppercase tracking-[0.11em] text-brand-ink-3">
                      {content.durationLabel}
                    </span>
                  )}
                </div>

                <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-brand-ink-2 sm:text-[16px]">
                  {product.description}
                </p>
              </div>
            </ScrollReveal>

            {/* ── PURCHASE ── */}
            <ScrollReveal delay={70}>
              <div id="main-cta" className="mb-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={`/checkout/${product.slug}`}
                    className="group relative inline-flex h-[56px] items-center justify-center gap-2.5 overflow-hidden rounded-[13px] border border-white/[0.14] px-8 text-[14px] font-bold uppercase tracking-[0.065em] text-white transition-transform duration-100 active:scale-[0.978]"
                    style={{
                      background:
                        "linear-gradient(168deg,#3478E8 0%,#2457C5 58%,#1C3D91 100%)",
                      boxShadow:
                        "0 1px 2px rgba(0,0,0,.4), 0 10px 28px var(--ambient-strong)",
                    }}
                  >
                    <span className="absolute inset-x-0 top-0 h-px bg-white/[0.16]" aria-hidden />
                    <span
                      className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/[0.10] skew-x-[-16deg] transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-[440%]"
                      aria-hidden
                    />
                    Purchase now
                    <ArrowRight
                      size={17}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>

                  <Link
                    href="/support"
                    className="inline-flex h-[56px] items-center justify-center gap-2.5 rounded-[13px] border border-border-subtle bg-foreground/[0.025] px-6 text-[13px] font-bold uppercase tracking-[0.065em] text-foreground transition-colors hover:border-border-strong hover:bg-foreground/[0.05]"
                  >
                    <Headset size={15} className="text-brand-ink-2" aria-hidden />
                    Ask a question
                  </Link>
                </div>

                {/* Mobile trust list */}
                <ul className="mt-6 space-y-2.5 lg:hidden">
                  {trustList.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={15}
                        className="mt-[2px] shrink-0 text-brand-ink-2"
                        aria-hidden
                      />
                      <span className="text-[12.5px] leading-relaxed text-brand-ink-3">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            {/* ── POLICY ── */}
            <ScrollReveal delay={110}>
              <div
                className="mb-10 flex items-start gap-4 rounded-[16px] border p-5"
                style={{
                  borderColor: "var(--status-danger-border)",
                  background: "var(--status-danger-bg)",
                }}
              >
                <ShieldAlert
                  size={19}
                  className="mt-[2px] shrink-0 text-[color:var(--status-danger-text)]"
                  aria-hidden
                />
                <div>
                  <h4 className="text-[14.5px] font-bold tracking-[-0.008em] text-foreground">
                    Strict device policy
                  </h4>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-brand-ink-2">
                    All purchases are final and issued for one device. Sharing or
                    reselling an account is a breach of the licence and results in a
                    permanent ban without refund. Changing hardware is fine — contact
                    support and we will transfer the access.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* ── WHAT'S INCLUDED ── */}
            {content && (
              <ScrollReveal delay={140}>
                <div className="mb-12">
                  <SectionHeading
                    eyebrow="Included"
                    title="What you get"
                    accent="blue"
                    className="mb-6"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {content.whatsIncluded.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-[14px] border border-border-subtle bg-surface-raised p-4 transition-colors hover:border-border-strong"
                      >
                        <CheckCircle2
                          size={16}
                          className="mt-[2px] shrink-0 text-brand-ink-2"
                          aria-hidden
                        />
                        <span className="text-[13px] font-medium leading-snug text-brand-ink-2">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Feature spec strip */}
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { Icon: Layers, label: "Updates", value: content.features.updates },
                      { Icon: ShieldCheck, label: "Setup files", value: content.features.setupFiles },
                      { Icon: CheckCircle2, label: "Tutorials", value: content.features.tutorials },
                      { Icon: Headset, label: "Support", value: content.features.supportLevel },
                    ].map(({ Icon, label, value }) => (
                      <div
                        key={label}
                        className="rounded-[14px] border border-border-subtle bg-surface/50 p-4"
                      >
                        <Icon size={14} className="mb-2.5 text-brand-ink-4" aria-hidden />
                        <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-brand-ink-4">
                          {label}
                        </p>
                        <p className="mt-1 text-[13px] font-bold text-foreground">
                          {value && value !== "-" ? value : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* ── HOW TO ORDER ── */}
            <ScrollReveal delay={170}>
              <div className="mb-12">
                <SectionHeading
                  eyebrow="Process"
                  title="How to order"
                  accent="blue"
                  className="mb-7"
                />
                <div className="rounded-[18px] border border-border-subtle bg-surface-raised p-6 sm:p-8">
                  <Steps
                    steps={[
                      {
                        title: "Checkout",
                        description:
                          "Proceed to checkout and pick the payment method that suits you.",
                      },
                      {
                        title: "Transfer",
                        description:
                          "Send the exact amount. Keep the confirmation screenshot — you will need it.",
                      },
                      {
                        title: "Upload proof",
                        description:
                          "Attach the screenshot and confirm the amount you sent on the checkout page.",
                      },
                      {
                        title: "Access granted",
                        description:
                          "We verify manually (1–12h) and issue your credentials into your dashboard.",
                      },
                    ]}
                  />
                </div>
              </div>
            </ScrollReveal>

            {/* ── FAQ ── */}
            <ScrollReveal delay={200}>
              <div>
                <SectionHeading
                  eyebrow="Answers"
                  title="Frequently asked questions"
                  accent="blue"
                  className="mb-6"
                />
                <Accordion items={detailFAQs} />
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* ── RELATED ── */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 border-t border-border-subtle pt-14 sm:mt-24">
            <ScrollReveal>
              <SectionHeading
                eyebrow="Keep looking"
                title="Related products"
                accent="crimson"
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

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <StickyPurchaseBar price={product.price} slug={product.slug} name={product.name} />
    </div>
  );
}
