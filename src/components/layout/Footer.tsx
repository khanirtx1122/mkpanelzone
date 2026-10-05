"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";

/** Inline WhatsApp glyph — avoids pulling a brand-icon dependency. */
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function Footer({
  whatsappHref,
  socialLinks = [],
}: {
  whatsappHref?: string | null;
  socialLinks?: { platform: string; url: string }[];
}) {
  const pathname = usePathname();

  if (
    pathname?.startsWith("/mkpanelzoneadmin") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/mk-agents")
  ) {
    return null;
  }

  return (
    <footer className="border-t border-border-subtle relative bg-background" data-analytics-section="footer">
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

          <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* Owner-managed social links — admin-controlled, icon per platform */}
            {socialLinks.map((link) => (
              <a
                key={link.platform + link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.platform}
                className="text-[12px] font-bold capitalize text-brand-ink-3 hover:text-brand-neon-blue transition-colors duration-150"
              >
                {link.platform}
              </a>
            ))}

            {/* WhatsApp support — the single support entry point */}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with support on WhatsApp"
                className="flex items-center gap-1.5 text-[12px] font-bold text-brand-ink-3 hover:text-[#25D366] transition-colors duration-150"
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center border border-border-subtle text-[#25D366]">
                  <WhatsAppIcon size={15} />
                </span>
                Support
              </a>
            )}

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
      </div>
    </footer>
  );
}
