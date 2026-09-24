"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * StickyPurchaseBar — mobile purchase affordance.
 *
 * Appears only once the in-page purchase CTA has scrolled out of view, sits
 * above the safe area, and uses the glass material so it never blocks the
 * content behind it.
 */
export function StickyPurchaseBar({
  price,
  slug,
  name,
}: {
  price: number;
  slug: string;
  name: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const mainCta = document.getElementById("main-cta");
    if (!mainCta) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(!entry.isIntersecting),
      { threshold: 0 }
    );

    observer.observe(mainCta);
    return () => observer.disconnect();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-3 pt-6 lg:hidden safe-bottom">
      {/* Gradient scrim so the bar never sits on raw content */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-0"
        style={{
          background:
            "linear-gradient(to top, var(--background) 30%, color-mix(in srgb, var(--background) 80%, transparent) 60%, transparent 100%)",
        }}
        aria-hidden
      />

      <div className="pointer-events-auto relative mx-auto flex max-w-[560px] items-center justify-between gap-4 rounded-[16px] mat-5 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-[10.5px] font-bold uppercase tracking-[0.11em] text-brand-ink-3">
            {name}
          </p>
          <p className="tabular mt-1 text-[18px] font-extrabold leading-none tracking-[-0.02em] text-foreground">
            <span className="mr-1 text-[10px] font-bold text-brand-ink-3">PKR</span>
            {price.toFixed(0)}
          </p>
        </div>

        <Link
          href={`/checkout/${slug}`}
          className="group relative inline-flex h-[46px] shrink-0 items-center gap-2 overflow-hidden rounded-[12px] border border-white/[0.14] px-5 text-[12.5px] font-bold uppercase tracking-[0.06em] text-white transition-transform duration-100 active:scale-[0.978]"
          style={{
            background: "linear-gradient(168deg,#3478E8 0%,#2457C5 58%,#1C3D91 100%)",
            boxShadow: "0 1px 2px rgba(0,0,0,.4), 0 8px 22px var(--ambient-strong)",
          }}
        >
          <span className="absolute inset-x-0 top-0 h-px bg-white/[0.16]" aria-hidden />
          Purchase
          <ArrowRight
            size={14}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}
