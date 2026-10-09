"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function StickyPurchaseBar({ price, slug, name }: { price: number, slug: string, name: string }) {
  const [isVisible, setIsVisible] = useState(false);

  /* Older WebKit builds have no IntersectionObserver. Without this guard the
     constructor would throw and take the whole purchase bar down on exactly the
     devices that need it most. Support is read once during render, and the bar
     simply stays visible where the observer is unavailable — no state update
     inside the effect. */
  const supportsObserver = typeof IntersectionObserver !== "undefined";

  useEffect(() => {
    if (!supportsObserver) return;

    const mainCta = document.getElementById("main-cta");
    if (!mainCta) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(mainCta);
    return () => observer.disconnect();
  }, [supportsObserver]);

  if (!isVisible && supportsObserver) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4 sm:pb-6 pt-4 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
      <div className="pointer-events-auto bg-surface-glass backdrop-blur-2xl border border-border-subtle p-3 sm:p-4 rounded-2xl flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div>
          <div className="text-[11px] sm:text-[12px] font-bold text-brand-ink-3 uppercase tracking-wider line-clamp-1">{name}</div>
          <div className="text-[18px] sm:text-[20px] font-extrabold text-foreground">PKR {price.toFixed(2)}</div>
        </div>
        <Link 
          href={`/checkout/${slug}`}
          className="group relative h-11 sm:h-12 px-6 rounded-xl flex items-center justify-center transition-all active:scale-[0.98] overflow-hidden shadow-[0_4px_16px_rgba(47,95,208,0.32)] border border-[rgba(77,163,255,0.35)]"
          style={{ background: "linear-gradient(135deg,#1E3FA8,#2F5FD0)" }}
        >
          <span className="relative z-10 text-[12px] sm:text-[13px] font-bold tracking-[0.05em] uppercase text-white flex items-center gap-2 whitespace-nowrap">
            Purchase
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>
    </div>
  );
}
