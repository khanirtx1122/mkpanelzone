"use client";

import * as React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import Image from "next/image";
import { Shield, Crown, Calendar, Clock, Package, Headset, ArrowRight, Check } from "lucide-react";
import { productContent } from "@/lib/productContent";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  slug: string;
  coverImageUrl?: string | null;
}

const getProductTheme = (slug: string, index: number) => {
  let badge = "";
  if (slug.includes("lifetime")) badge = "BEST SELLER";
  else if (slug.includes("3-months")) badge = "BEST VALUE";
  else if (slug.includes("weekly")) badge = "TRIAL";
  else if (slug.includes("setup") || slug.includes("support")) badge = "ADD-ON";

  let Icon = Shield;
  if (slug.includes("3-months")) Icon = Crown;
  else if (slug.includes("monthly")) Icon = Calendar;
  else if (slug.includes("weekly")) Icon = Clock;
  else if (slug.includes("setup")) Icon = Package;
  else if (slug.includes("support")) Icon = Headset;

  const cycle = index % 3;
  let accent = "blue";
  if (cycle === 1) accent = "red";
  else if (cycle === 2) accent = "mix";

  return { badge, Icon, accent };
};

export function ProductCard({ 
  product, 
  index = 0,
  featured = false
}: { 
  product: Product; 
  index?: number;
  featured?: boolean;
}) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const { badge, Icon, accent } = getProductTheme(product.slug, index);
  const content = productContent[product.slug];
  
  const isRed = accent === "red";
  
  const iconColor = isRed ? "text-brand-neon-red" : "text-brand-neon-blue";
  const iconBg = isRed ? "bg-brand-neon-red/10 border-brand-neon-red/30" : "bg-brand-neon-blue/10 border-brand-neon-blue/30";
  const hoverBorder = isRed ? "group-hover/card:border-brand-neon-red/45" : "group-hover/card:border-brand-neon-blue/45";

  // Mark card as animated after first appearance to prevent replay on re-mount
  React.useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      el.dataset.animated = "true";
    }, 700 + index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      ref={cardRef}
      className="h-full relative group/card card-entrance"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/*
        Glow layer — opacity transition only (no filter/blur change per spec 6.1)
        Pseudo-element trick: this div starts opacity-0, goes to opacity-100 on hover.
        The blur is baked in at render time (no repaint on hover).
      */}
      <div
        className={`absolute -inset-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 rounded-[24px] blur-xl pointer-events-none
          ${isRed ? "bg-brand-neon-red/8" : "bg-brand-neon-blue/8"}`}
        aria-hidden
      />

      <GlassCard
        className={`relative p-3 sm:p-5 md:p-6 flex flex-col h-full border-border-subtle ${hoverBorder} overflow-hidden`}
        important={featured}
      >
        {/* Top Row: Icon + Badge */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3 sm:mb-5">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-xl border flex items-center justify-center shrink-0 ${iconBg} ${iconColor} overflow-hidden relative`}>
            {(product.coverImageUrl || content?.image) ? (
              <Image src={(product.coverImageUrl || content?.image)!} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 32px, 40px" />
            ) : (
              <>
                <Icon size={16} className="sm:hidden" />
                <Icon size={20} className="hidden sm:block" />
              </>
            )}
          </div>
          {badge && (
            <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border text-[8px] sm:text-[10px] font-extrabold tracking-widest uppercase whitespace-nowrap text-center ${iconBg} ${iconColor}`}>
              {badge}
            </div>
          )}
        </div>
        
        {/* Content */}
        <h3 className="text-[14px] leading-tight sm:text-lg font-extrabold text-foreground mb-1 tracking-tight line-clamp-2">{product.name}</h3>
        <p className="text-brand-ink-3 mb-3 sm:mb-4 flex-none leading-snug text-[11px] sm:text-[13px] line-clamp-2">
          {product.description}
        </p>

        {/* What's Included */}
        {content && content.highlights.length > 0 && (
          <ul className="mb-4 sm:mb-6 space-y-1.5 sm:space-y-2 flex-1">
            {content.highlights.slice(0, 3).map((highlight, i) => (
              <li key={i} className="flex items-start gap-1.5 sm:gap-2">
                <Check size={12} className="text-brand-neon-blue mt-0.5 shrink-0 sm:w-3.5 sm:h-3.5" />
                <span className="text-[10px] sm:text-[12px] text-foreground/80 leading-tight">{highlight}</span>
              </li>
            ))}
          </ul>
        )}
        
        {/* Divider */}
        <div className="h-px w-full bg-[var(--line-color)] mb-3 sm:mb-4 mt-auto" />

        {/* Bottom Row: Price + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col">
            {/* tabular-nums: prices won't shift during hydration or data updates */}
            <span className="tabular text-[16px] sm:text-xl font-extrabold text-foreground tracking-tight leading-none">
              PKR {product.price.toFixed(2)}
            </span>
            {content && (
              <span className="text-[9px] sm:text-[11px] text-brand-ink-3 font-medium mt-0.5 uppercase tracking-wide">{content.durationLabel}</span>
            )}
          </div>
          
          {/*
            CTA: min-h-[48px] on mobile (44px+ tap target).
            press-feedback via active:scale on the link (no box-shadow transition).
            ArrowRight translate is transform-only (safe, won't cause layout).
          */}
          <Link
            href={`/products/${product.slug}`}
            className={`group/btn relative min-h-[48px] sm:h-10 px-3 sm:px-5 rounded-md sm:rounded-lg flex items-center justify-center border
              active:scale-[0.975] transition-[transform,opacity] duration-[100ms]
              overflow-hidden w-full sm:w-auto
              ${
                isRed
                  ? "bg-brand-red-900/40 border-brand-red-500/30 text-white hover:border-brand-red-500/50"
                  : "bg-brand-blue-900/40 border-brand-blue-500/30 text-white hover:border-brand-blue-500/50"
              }`}
          >
            {/* Opacity-only glow on hover — no filter change (per spec 6.1) */}
            <div className={`absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none rounded-md sm:rounded-lg
              ${isRed ? "bg-brand-neon-red/12" : "bg-brand-neon-blue/12"}`}
            />
            <span className="relative z-10 text-[10px] sm:text-[12px] font-bold tracking-[0.05em] uppercase flex items-center gap-1.5 whitespace-nowrap">
              Select
              {/* transform-only arrow — safe per spec 6.1 */}
              <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform duration-200" />
            </span>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}


export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  slug: string;
  coverImageUrl?: string | null;
}

const getProductTheme = (slug: string, index: number) => {
  let badge = "";
  if (slug.includes("lifetime")) badge = "BEST SELLER";
  else if (slug.includes("3-months")) badge = "BEST VALUE";
  else if (slug.includes("weekly")) badge = "TRIAL";
  else if (slug.includes("setup") || slug.includes("support")) badge = "ADD-ON";

  let Icon = Shield;
  if (slug.includes("3-months")) Icon = Crown;
  else if (slug.includes("monthly")) Icon = Calendar;
  else if (slug.includes("weekly")) Icon = Clock;
  else if (slug.includes("setup")) Icon = Package;
  else if (slug.includes("support")) Icon = Headset;

  const cycle = index % 3;
  let accent = "blue";
  if (cycle === 1) accent = "red";
  else if (cycle === 2) accent = "mix"; 

  return { badge, Icon, accent };
};

export function ProductCard({ 
  product, 
  index = 0,
  featured = false
}: { 
  product: Product; 
  index?: number;
  featured?: boolean;
}) {
  const { badge, Icon, accent } = getProductTheme(product.slug, index);
  const content = productContent[product.slug];
  
  const isBlue = accent === "blue";
  const isRed = accent === "red";
  
  const iconColor = isRed ? "text-brand-neon-red" : "text-brand-neon-blue";
  const iconBg = isRed ? "bg-brand-neon-red/10 border-brand-neon-red/30" : "bg-brand-neon-blue/10 border-brand-neon-blue/30";
  const hoverBorder = isRed ? "group-hover/card:border-brand-neon-red/50" : "group-hover/card:border-brand-neon-blue/50";
  const glowShadow = isRed ? "shadow-[0_0_15px_rgba(255,45,85,0.15)]" : "shadow-[0_0_15px_rgba(77,163,255,0.15)]";

  return (
    <div className="h-full relative group/card">
      {/* Background Hover Glow - Disabled on low perf */}
      <div className={`absolute -inset-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-[24px] blur-xl pointer-events-none ${isRed ? 'bg-brand-neon-red/10' : 'bg-brand-neon-blue/10'} html-[data-perf='low']:hidden`} />

      <GlassCard 
        className={`relative p-3 sm:p-5 md:p-6 flex flex-col h-full transition-all duration-300 border-border-subtle ${hoverBorder} ${glowShadow} overflow-hidden html-[data-perf='full']:group-hover/card:-translate-y-1 bg-surface-glass`}
        important={featured}
      >
        {/* Edge lights - active on hover */}
        <div className={`absolute top-0 left-0 w-16 h-[1px] bg-gradient-to-r from-brand-neon-blue to-transparent opacity-0 transition-opacity duration-300 html-[data-perf='full']:group-hover/card:opacity-100`} />
        <div className={`absolute bottom-0 right-0 w-16 h-[1px] bg-gradient-to-l from-brand-neon-red to-transparent opacity-0 transition-opacity duration-300 html-[data-perf='full']:group-hover/card:opacity-100`} />

        {/* Top Row: Icon + Badge */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3 sm:mb-5">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-xl border flex items-center justify-center shrink-0 ${iconBg} ${iconColor} transition-transform duration-300 shadow-sm html-[data-perf='full']:group-hover/card:scale-110 overflow-hidden relative`}>
            {(product.coverImageUrl || content?.image) ? (
              <Image src={(product.coverImageUrl || content?.image)!} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 32px, 40px" />
            ) : (
              <>
                <Icon size={16} className="sm:hidden" />
                <Icon size={20} className="hidden sm:block" />
              </>
            )}
          </div>
          {badge && (
            <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border text-[8px] sm:text-[10px] font-extrabold tracking-widest uppercase shadow-sm whitespace-nowrap text-center ${iconBg} ${iconColor}`}>
              {badge}
            </div>
          )}
        </div>
        
        {/* Content */}
        <h3 className="text-[14px] leading-tight sm:text-lg font-extrabold text-foreground mb-1 tracking-tight line-clamp-2">{product.name}</h3>
        <p className="text-brand-ink-3 mb-3 sm:mb-4 flex-none leading-snug text-[11px] sm:text-[13px] line-clamp-2">
          {product.description}
        </p>

        {/* What's Included */}
        {content && content.highlights.length > 0 && (
          <ul className="mb-4 sm:mb-6 space-y-1.5 sm:space-y-2 flex-1">
            {content.highlights.slice(0, 3).map((highlight, i) => (
              <li key={i} className="flex items-start gap-1.5 sm:gap-2">
                <Check size={12} className="text-brand-neon-blue mt-0.5 shrink-0 sm:w-3.5 sm:h-3.5" />
                <span className="text-[10px] sm:text-[12px] text-foreground/80 leading-tight">{highlight}</span>
              </li>
            ))}
          </ul>
        )}
        
        {/* Divider */}
        <div className="h-[1px] w-full bg-border mb-3 sm:mb-4 mt-auto" />

        {/* Bottom Row: Price/Duration + Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col">
            <span className="text-[16px] sm:text-xl font-extrabold text-foreground tracking-tight leading-none">PKR {product.price.toFixed(2)}</span>
            {content && (
              <span className="text-[9px] sm:text-[11px] text-brand-ink-3 font-medium mt-0.5 uppercase tracking-wide">{content.durationLabel}</span>
            )}
          </div>
          
          <Link 
            href={`/products/${product.slug}`}
            className={`group/btn relative h-9 sm:h-10 px-3 sm:px-5 rounded-md sm:rounded-lg flex items-center justify-center border transition-all active:scale-[0.98] overflow-hidden w-full sm:w-auto ${
              isRed 
                ? "bg-brand-red-900/40 border-brand-red-500/30 text-white shadow-[0_0_10px_rgba(255,45,85,0.2)] hover:bg-brand-red-900/60" 
                : "bg-brand-blue-900/40 border-brand-blue-500/30 text-white shadow-[0_0_10px_rgba(77,163,255,0.2)] hover:bg-brand-blue-900/60"
            }`}
          >
            <div className={`absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none rounded-md sm:rounded-lg ${
              isRed ? "bg-gradient-to-r from-brand-neon-red/20 to-transparent" : "bg-gradient-to-r from-brand-neon-blue/20 to-transparent"
            }`} />
            <span className="relative z-10 text-[10px] sm:text-[12px] font-bold tracking-[0.05em] uppercase flex items-center gap-1.5 whitespace-nowrap">
              Select
              <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

