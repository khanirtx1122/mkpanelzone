import { Hero } from "@/components/home/Hero";
import { CinematicIntro } from "@/components/ui/CinematicIntro";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Shield, Zap, Sparkles, Server, Crosshair, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ui/ProductCard";

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <CinematicIntro />
      <Hero>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mt-6">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p as any} index={i} featured={i === 0} />
          ))}
        </div>
      </Hero>
      
      {/* Stats Section */}
      <section className="py-24 relative z-10 -mt-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="text-center group hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-4xl md:text-5xl font-extrabold text-foreground mb-3 tracking-tight group-hover:text-brand-neon-blue group-hover:drop-shadow-[0_0_8px_var(--color-brand-neon-blue)] transition-all">5K+</h3>
            <p className="text-[13px] font-bold tracking-[0.15em] text-brand-ink-3 uppercase">Active Members</p>
          </GlassCard>
          <GlassCard className="text-center group hover:-translate-y-1 transition-all duration-300 border-brand-neon-blue/20 shadow-[0_0_20px_rgba(77,163,255,0.1)]">
            <h3 className="text-4xl md:text-5xl font-extrabold text-foreground mb-3 tracking-tight group-hover:text-brand-neon-blue group-hover:drop-shadow-[0_0_8px_var(--color-brand-neon-blue)] transition-all">100%</h3>
            <p className="text-[13px] font-bold tracking-[0.15em] text-brand-ink-3 uppercase">Secure Architecture</p>
          </GlassCard>
          <GlassCard className="text-center group hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-4xl md:text-5xl font-extrabold text-foreground mb-3 tracking-tight group-hover:text-brand-neon-red group-hover:drop-shadow-[0_0_8px_var(--color-brand-neon-red)] transition-all">24/7</h3>
            <p className="text-[13px] font-bold tracking-[0.15em] text-brand-ink-3 uppercase">Elite Support</p>
          </GlassCard>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative bg-surface/30 border-y border-border-subtle">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">WHY CHOOSE MK PANEL?</h2>
            <p className="text-[17px] text-brand-ink-3 max-w-2xl mx-auto leading-relaxed">
              We provide premium, undetectable, and highly optimized digital resources for our elite customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="w-16 h-16 rounded-2xl bg-brand-neon-blue/10 border border-brand-neon-blue/30 flex items-center justify-center text-brand-neon-blue group-hover:scale-110 group-hover:shadow-[0_0_15px_var(--color-brand-neon-blue)] transition-all duration-300">
                <Shield size={28} />
              </div>
              <h3 className="text-[17px] font-bold text-foreground tracking-wide">Device Bound Security</h3>
              <p className="text-[15px] text-brand-ink-3 leading-relaxed">
                Your purchase is cryptographically bound to your device, ensuring maximum security and exclusivity.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="w-16 h-16 rounded-2xl bg-brand-neon-red/10 border border-brand-neon-red/30 flex items-center justify-center text-brand-neon-red group-hover:scale-110 group-hover:shadow-[0_0_15px_var(--color-brand-neon-red)] transition-all duration-300">
                <Zap size={28} />
              </div>
              <h3 className="text-[17px] font-bold text-foreground tracking-wide">Instant Delivery</h3>
              <p className="text-[15px] text-brand-ink-3 leading-relaxed">
                Get immediate access to your resources right after your payment proof is verified by our system.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="w-16 h-16 rounded-2xl bg-surface-glass border border-border-subtle flex items-center justify-center text-foreground group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-all duration-300">
                <Sparkles size={28} />
              </div>
              <h3 className="text-[17px] font-bold text-foreground tracking-wide">Premium Quality</h3>
              <p className="text-[15px] text-brand-ink-3 leading-relaxed">
                Meticulously crafted configurations and panels that dominate the competition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-brand-blue-900)_0%,_transparent_70%)] opacity-20 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold text-foreground mb-10 tracking-tight">INITIALIZE ACCESS</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/products">VIEW PRODUCTS</Link>
            </Button>
            <Button size="lg" variant="glass" className="w-full sm:w-auto" asChild>
              <Link href="/access">CUSTOMER LOGIN</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
