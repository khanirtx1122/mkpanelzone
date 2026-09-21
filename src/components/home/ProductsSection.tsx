import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Server, Crosshair, ArrowRight } from "lucide-react";

export function ProductsSection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-brand-red-500 uppercase">Premium Arsenal</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">FEATURED CONFIGURATIONS</h2>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link href="/products">
              View All Products <ArrowRight size={16} className="ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GlassCard className="p-8 flex flex-col group hover:-translate-y-1 transition-transform duration-obsidian border-border-subtle hover:border-brand-blue-500/30">
            <div className="flex justify-between items-start mb-12">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue-500/10 border border-brand-blue-500/30 flex items-center justify-center text-brand-blue-500 mb-6 group-hover:scale-110 transition-transform duration-obsidian">
                <Crosshair size={24} />
              </div>
              <div className="px-3 py-1 rounded-full bg-brand-blue-500/10 border border-brand-blue-500/30 text-[10px] font-bold tracking-widest text-brand-blue-500 uppercase">
                Best Seller
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-foreground mb-3 tracking-tight">MK Panel Core</h3>
            <p className="text-brand-ink-3 mb-8 flex-1 leading-relaxed text-[15px]">
              The flagship configuration. Undetectable architecture with kernel-level integration. Designed for ultimate precision.
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-2xl font-extrabold text-foreground tracking-tight">PKR 49.99</span>
              <Button variant="outline" asChild className="group-hover:bg-brand-blue-500 group-hover:text-foreground group-hover:border-brand-blue-500 transition-colors">
                <Link href="/products">Select</Link>
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-8 flex flex-col group hover:-translate-y-1 transition-transform duration-obsidian border-border-subtle hover:border-brand-red-500/30">
            <div className="w-12 h-12 rounded-2xl bg-brand-red-500/10 border border-brand-red-500/30 flex items-center justify-center text-brand-red-500 mb-12 group-hover:scale-110 transition-transform duration-obsidian">
              <Server size={24} />
            </div>
            <h3 className="text-2xl font-extrabold text-foreground mb-3 tracking-tight">MK VIP Bypass</h3>
            <p className="text-brand-ink-3 mb-8 flex-1 leading-relaxed text-[15px]">
              Advanced security circumvention. Operates entirely in memory with polymorphic signatures. Complete anonymity.
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-2xl font-extrabold text-foreground tracking-tight">PKR 89.99</span>
              <Button variant="outline" asChild className="group-hover:bg-brand-red-500 group-hover:text-foreground group-hover:border-brand-red-500 transition-colors">
                <Link href="/products">Select</Link>
              </Button>
            </div>
          </GlassCard>
        </div>
        
        <Button variant="ghost" asChild className="w-full mt-8 md:hidden text-brand-ink-3">
          <Link href="/products">
            View All Products <ArrowRight size={16} className="ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
