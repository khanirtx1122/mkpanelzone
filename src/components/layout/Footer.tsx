"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  if (
    pathname?.startsWith("/mkpanelzoneadmin") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/mk-agents")
  ) {
    return null;
  }

  return (
    <footer className="border-t border-border-subtle relative bg-background">
      {/* Premium neon top accent line */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-brand-neon-blue/25 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Top row: brand + description */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 mb-10">
          {/* Brand */}
          <div className="flex flex-col gap-3 max-w-xs">
            <Link href="/" className="text-[16px] font-extrabold tracking-[0.1em] text-foreground flex items-center gap-2 w-fit">
              <span className="neon-text-blue">MK</span>
              <span className="neon-text-red-edge font-medium">PANEL ZONE</span>
            </Link>
            <p className="text-[13px] text-brand-ink-3 leading-relaxed">
              Premium digital products and resources. Configured, verified, and secured.
            </p>
            <div className="flex items-center gap-1.5 text-[12px] text-brand-ink-3 font-medium mt-1">
              <ShieldCheck size={13} className="text-brand-neon-blue shrink-0" />
              Device-bound security on all purchases
            </div>
          </div>

          {/* Links columns */}
          <div className="flex flex-row gap-10 sm:gap-16">
            {/* Navigation */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold tracking-[0.18em] text-brand-ink-3 uppercase mb-1">
                Navigation
              </p>
              {[
                { href: "/", label: "Home" },
                { href: "/products", label: "Products" },
                { href: "/support", label: "Support" },
                { href: "/access", label: "Customer Access" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] text-brand-ink-3 hover:text-foreground transition-colors duration-150 py-0.5 w-fit group flex items-center gap-1"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold tracking-[0.18em] text-brand-ink-3 uppercase mb-1">
                Legal
              </p>
              {[
                { href: "/terms", label: "Terms of Service" },
                { href: "/privacy", label: "Privacy Policy" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] text-brand-ink-3 hover:text-foreground transition-colors duration-150 py-0.5 w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border-subtle mb-7" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-brand-ink-3 text-center sm:text-left">
            &copy; {new Date().getFullYear()} MK Panel Zone. All rights reserved.
          </p>

          <Link
            href="/products"
            className="flex items-center gap-1.5 text-[12px] font-bold text-brand-ink-3 hover:text-brand-neon-blue transition-colors duration-150 group"
          >
            Browse Products
            <ArrowRight
              size={12}
              className="group-hover:translate-x-0.5 transition-transform duration-150"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
