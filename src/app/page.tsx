import { Hero } from "@/components/home/Hero";
import { MainProductsSection } from "@/components/home/MainProductsSection";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { CinematicIntro } from "@/components/ui/CinematicIntro";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Shield, Zap, Sparkles, ArrowRight, Users, Lock, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  // Fetch up to 9 products for the main grid
  const mainProducts = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 9,
  });

  // Reuse the top 3 for the featured section below
  const featuredProducts = mainProducts.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <CinematicIntro />

      {/* 1. Compact hero */}
      <Hero products={mainProducts as any} />

      {/* 2. Main Products Grid - directly after hero */}
      <MainProductsSection products={mainProducts as any} />

      {/* 3. Featured Products - kept functionality */}
      <FeaturedProductsSection products={featuredProducts as any} />

      {/* 4. Stats strip */}
      <section className="py-12 sm:py-14 border-y border-border-subtle bg-surface/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-3 gap-3 sm:gap-6">
          {[
            { value: "5K+", label: "Active Members", Icon: Users },
            { value: "100%", label: "Secure", Icon: Lock },
            { value: "24/7", label: "Elite Support", Icon: Clock },
          ].map(({ value, label, Icon }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <Icon size={14} className="text-brand-neon-blue shrink-0" />
                <span className="text-[22px] sm:text-[30px] md:text-[36px] font-extrabold text-foreground tabular tracking-tight">
                  {value}
                </span>
              </div>
              <p className="text-[10px] sm:text-[12px] font-bold tracking-[0.12em] text-brand-ink-3 uppercase">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Benefits */}
      <section className="py-14 sm:py-20 relative bg-surface/30 border-b border-border-subtle">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[10px] font-bold tracking-[0.18em] text-brand-ink-3 uppercase mb-3">
              Why Choose Us
            </p>
            <h2 className="font-extrabold text-foreground tracking-tight" style={{ fontSize: "clamp(26px, 6vw, 40px)" }}>
              BUILT FOR EXCELLENCE
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                Icon: Shield,
                title: "Device-Bound Security",
                desc: "Every purchase is cryptographically bound to your device for maximum security.",
                color: "blue",
              },
              {
                Icon: Zap,
                title: "Instant Delivery",
                desc: "Get immediate access right after your payment proof is verified.",
                color: "red",
              },
              {
                Icon: Sparkles,
                title: "Premium Quality",
                desc: "Meticulously crafted configurations that dominate the competition.",
                color: "neutral",
              },
            ].map(({ Icon, title, desc, color }) => (
              <div key={title} className="flex flex-col items-center text-center gap-4 group">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 ${
                    color === "blue"
                      ? "bg-brand-neon-blue/8 border-brand-neon-blue/25 text-brand-neon-blue"
                      : color === "red"
                      ? "bg-brand-neon-red/8 border-brand-neon-red/25 text-brand-neon-red"
                      : "bg-surface-glass border-border-subtle text-brand-ink-2"
                  }`}
                >
                  <Icon size={22} />
                </div>
                <h3 className="text-[15px] sm:text-[16px] font-bold text-foreground tracking-wide">
                  {title}
                </h3>
                <p className="text-[13px] sm:text-[14px] text-brand-ink-3 leading-relaxed max-w-[260px]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Customer Access CTA */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(47,95,208,0.07)_0%,_transparent_60%)] pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <p className="text-[10px] font-bold tracking-[0.18em] text-brand-ink-3 uppercase mb-4">
            Ready to Start?
          </p>
          <h2 className="font-extrabold text-foreground mb-4 tracking-tight" style={{ fontSize: "clamp(28px, 6vw, 44px)" }}>
            GET YOUR ACCESS
          </h2>
          <p className="text-[14px] sm:text-[16px] text-brand-ink-3 mb-8 leading-relaxed max-w-sm mx-auto">
            Browse our premium products and get instant access after verification.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs mx-auto sm:max-w-none">
            <Link
              href="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-6 rounded-[12px] font-bold tracking-[0.05em] uppercase text-white transition-all active:scale-[0.975]"
              style={{
                background: "linear-gradient(135deg,#1E3FA8,#2F5FD0)",
                boxShadow: "0 4px 14px rgba(47,95,208,0.3)",
              }}
            >
              VIEW PRODUCTS <ArrowRight size={16} className="ml-2" />
            </Link>
            <Button size="default" variant="glass" asChild className="w-full sm:w-auto h-12 rounded-[12px]">
              <Link href="/access">CUSTOMER ACCESS</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
