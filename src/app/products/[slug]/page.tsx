import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, ShieldAlert, ChevronRight, Crown, ArrowRight } from "lucide-react";
import { productContent, globalFAQ, trustList } from "@/lib/productContent";
import { Accordion } from "@/components/ui/Accordion";
import { Steps } from "@/components/ui/Steps";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductVideoPlayer } from "@/components/ui/ProductVideoPlayer";
import { StickyPurchaseBar } from "./StickyPurchaseBar";
import { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug, active: true },
  });

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `${product.name} | MK Panel Zone`,
    description: product.description || undefined,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      type: 'website',
    }
  };
}

const getBadgeForSlug = (slug: string) => {
  if (slug.includes("lifetime")) return "BEST SELLER";
  if (slug.includes("3-months")) return "BEST VALUE";
  if (slug.includes("weekly")) return "TRIAL";
  if (slug.includes("setup") || slug.includes("support")) return "ADD-ON";
  return "";
};

/* Served from cache and refreshed in the background — public pages must not be rendered from scratch on every visit, nor frozen at build time. */
export const revalidate = 60;

export default async function ProductDetailsPage({ params }: Props) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug, active: true },
  });

  if (!product) {
    notFound();
  }

  const content = productContent[product.slug];
  const badge = getBadgeForSlug(product.slug);
  
  // Specific FAQs for detail page (top 3)
  const detailFAQs = globalFAQ.slice(0, 3);

  // Fetch 3 related products
  const relatedProducts = await prisma.product.findMany({
    where: { 
      active: true,
      slug: { not: product.slug } 
    },
    take: 3,
    orderBy: { createdAt: 'desc' }
  });

  // Generate JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": `https://mkpanel.zone/products/${product.slug}`
    }
  };

  return (
    <div className="relative min-h-screen pt-24 sm:pt-32 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-neon-blue/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-brand-neon-red/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] sm:text-[13px] font-bold tracking-wide uppercase text-brand-ink-3 mb-6 sm:mb-8">
          <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
          <ChevronRight size={14} />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-24">
          
          {/* LEFT COL: ARTWORK (Sticky on Desktop) */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-[100px]">
              {product.videoEnabled && product.demoVideoUrl ? (
                <ProductVideoPlayer
                  videoUrl={product.demoVideoUrl}
                  posterUrl={product.demoVideoPosterUrl}
                  coverImageUrl={product.coverImageUrl || content?.image}
                  productName={product.name}
                  autoplay={product.videoAutoplay}
                  muted={product.videoMutedDefault}
                  loop={product.videoLoop}
                />
              ) : (
                <div className="relative aspect-square w-full rounded-[32px] overflow-hidden border border-border-subtle bg-surface-glass shadow-2xl flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(77,163,255,0.1),transparent_70%)]" />
                  {(product.coverImageUrl || content?.image) ? (
                    <Image 
                      src={(product.coverImageUrl || content?.image)!} 
                      alt={product.name} 
                      fill 
                      className="object-cover" 
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority 
                    />
                  ) : (
                    <div className="relative w-40 h-40 sm:w-56 sm:h-56 rounded-full border-[2px] border-brand-neon-blue/20 flex items-center justify-center animate-[spin_40s_linear_infinite] html-[data-perf='low']:animate-none">
                      <div className="absolute inset-0 border border-brand-neon-blue/10 rounded-full scale-110" />
                      <div className="absolute inset-0 border border-brand-neon-blue/5 rounded-full scale-125" />
                      <Crown className="w-16 h-16 sm:w-24 sm:h-24 text-brand-neon-blue drop-shadow-[0_0_20px_rgba(77,163,255,0.5)] animate-[spin_40s_linear_infinite_reverse] html-[data-perf='low']:animate-none" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COL: DETAILS */}
          <div className="lg:col-span-7">
            {/* Header section */}
            <div className="mb-8 sm:mb-12">
              {badge && (
                <div className="inline-flex px-2.5 py-1 rounded-full border border-brand-neon-blue/30 bg-brand-neon-blue/10 text-[10px] sm:text-[12px] font-extrabold tracking-widest uppercase text-brand-neon-blue mb-4 shadow-sm">
                  {badge}
                </div>
              )}
              
              <h1 className="font-extrabold text-foreground mb-4 sm:mb-6 tracking-tight line-clamp-2" style={{ fontSize: "clamp(26px, 6vw, 60px)" }}>
                {product.name}
              </h1>
              
              <div className="flex items-end gap-3 mb-6">
                <div className="font-extrabold text-foreground tracking-tight" style={{ fontSize: "clamp(32px, 7vw, 48px)" }}>PKR {product.price.toFixed(2)}</div>
                {content && (
                  <div className="text-[12px] sm:text-[14px] text-brand-ink-3 font-bold uppercase tracking-widest mb-1.5">{content.durationLabel}</div>
                )}
              </div>

              <p className="text-brand-ink-3 text-[15px] sm:text-[17px] leading-relaxed max-w-2xl">
                {product.description}
              </p>
            </div>

            {/* Main CTA (Observed by StickyPurchaseBar) */}
            <div id="main-cta" className="mb-10 sm:mb-12">
              <Link 
                href={`/checkout/${product.slug}`}
                className="group relative h-14 sm:h-16 px-8 rounded-xl flex items-center justify-center bg-foreground border border-transparent transition-all active:scale-[0.98] overflow-hidden w-full sm:w-auto sm:inline-flex"
              >
                <div className="absolute inset-0 bg-foreground group-hover:bg-foreground/90 transition-colors" />
                <span className="relative z-10 text-[14px] sm:text-[16px] font-extrabold tracking-[0.05em] uppercase text-background flex items-center gap-2 whitespace-nowrap">
                  Purchase Now
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              
              {/* Trust List */}
              <ul className="mt-6 space-y-2 sm:space-y-3">
                {trustList.map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-brand-ink-3 text-[13px] sm:text-[15px]">
                    <CheckCircle2 size={16} className="text-brand-neon-blue shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strict Policy Alert */}
            <GlassCard className="border-brand-neon-red/30 bg-brand-neon-red/5 p-4 sm:p-6 flex items-start gap-3 sm:gap-4 shadow-[0_0_20px_rgba(255,45,85,0.05)] mb-12 sm:mb-16">
              <ShieldAlert className="text-brand-neon-red shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
              <div>
                <h4 className="text-foreground font-bold mb-1 tracking-wide text-[14px] sm:text-[16px]">Strict Device Policy</h4>
                <p className="text-[12px] sm:text-[14px] text-brand-ink-3 leading-relaxed">
                  All purchases are final and securely bound to ONE device. Attempting to share accounts will result in an immediate, permanent ban.
                </p>
              </div>
            </GlassCard>

            {/* What's Included */}
            {content && (
              <div className="mb-12 sm:mb-16 html-[data-perf='full']:content-visibility-auto">
                <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mb-6">What's Included</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {content.whatsIncluded.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-surface-glass border border-border-subtle p-4 rounded-xl">
                      <CheckCircle2 size={18} className="text-brand-neon-blue shrink-0 mt-0.5" />
                      <span className="text-foreground font-medium text-[14px] sm:text-[15px]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How Ordering Works */}
            <div className="mb-12 sm:mb-16 html-[data-perf='full']:content-visibility-auto">
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mb-8">How to Order</h3>
              <div className="bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8">
                <Steps 
                  steps={[
                    { title: "Checkout", description: "Proceed to checkout and select your preferred payment method." },
                    { title: "Transfer", description: "Send the exact amount using Crypto or Bank Transfer." },
                    { title: "Upload Proof", description: "Attach a screenshot of your successful transaction." },
                    { title: "Access Granted", description: "We verify manually (1-12h). You will receive your access details once verified." }
                  ]}
                />
              </div>
            </div>

            {/* FAQs */}
            <div className="html-[data-perf='full']:content-visibility-auto">
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mb-6">Frequently Asked Questions</h3>
              <Accordion items={detailFAQs} />
            </div>

          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-border-subtle pt-16 sm:pt-24 html-[data-perf='full']:content-visibility-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p as any} index={i} />
              ))}
            </div>
          </div>
        )}
        
      </div>
      
      <StickyPurchaseBar price={product.price} slug={product.slug} name={product.name} />
    </div>
  );
}

