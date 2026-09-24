"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, ArrowRight, Lock, Mail, MessageCircle, Video } from "lucide-react";
import { TechLabel } from "@/components/ui/Tech";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/support", label: "Support" },
];

const ACCOUNT = [{ href: "/access", label: "Customer Access" }];

const LEGAL = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
];

export interface FooterProps {
  /** `footer_copyright` setting */
  copyright?: string;
  /** `footer_description` setting */
  description?: string;
  /** `footer_social_discord` setting */
  discord?: string;
  /** `footer_social_youtube` setting */
  youtube?: string;
  /** `content_contact_email` setting */
  contactEmail?: string;
}

/**
 * Footer — part of the product, not an afterthought (spec §58).
 *
 * Rebuilt in the reference idiom: it opens with the same annotation row and
 * hairline the hero uses, repeats the wordmark at display scale with the second
 * line stroked rather than filled, and runs its column headers in the monospace
 * annotation layer. The effect is that the page closes the way it opened rather
 * than trailing off into a generic link list.
 *
 * Only public routes are ever rendered here. Admin (`/mkpanelzoneadmin`),
 * agent (`/agent`) and the management entry (`/mk-agents`) are deliberately
 * absent — private routes stay private (spec §59).
 *
 * Copy is driven by the footer/content settings from Control Room. Every prop
 * is optional and falls back to the designed default, so an unconfigured site
 * looks intentional rather than empty.
 */
export function Footer({
  copyright,
  description,
  discord,
  youtube,
  contactEmail,
}: FooterProps = {}) {
  const pathname = usePathname();

  if (
    pathname?.startsWith("/mkpanelzoneadmin") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/mk-agents")
  ) {
    return null;
  }

  const year = new Date().getFullYear();

  /* External channels are surfaced only when actually configured. */
  const channels: { href: string; label: string; Icon: typeof Mail; external: boolean }[] = [];
  if (discord) channels.push({ href: discord, label: "Discord", Icon: MessageCircle, external: true });
  if (youtube) channels.push({ href: youtube, label: "YouTube", Icon: Video, external: true });
  if (contactEmail)
    channels.push({ href: `mailto:${contactEmail}`, label: "Email", Icon: Mail, external: false });

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border-subtle">
      <div
        className="pointer-events-none absolute inset-0 ambient-blue opacity-60"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {/* Opening annotation row — the same device the hero uses, so the page
            closes with the rhythm it opened with. */}
        <div className="flex items-center gap-4 pt-14 sm:pt-16">
          <TechLabel tone="bright" size="sm">
            footer
          </TechLabel>
          <span className="h-px flex-1 bg-[color:var(--line-color)]" />
          <TechLabel tone="dim" size="sm">
            {year}
          </TechLabel>
        </div>

        {/* ── Wordmark — repeats the hero mark, second line stroked ── */}
        <Link
          href="/"
          aria-label="MK Panel Zone — Home"
          className="mt-10 inline-block rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)]"
        >
          <span className="display display-tight block text-[length:var(--text-display-sm)] text-foreground">
            MK PANEL
            <br />
            <span className="text-outline">ZONE</span>
          </span>
        </Link>

        {/* ── Body ── */}
        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-8">
          {/* Statement + verifiable claims */}
          <div className="lg:col-span-5">
            <p className="max-w-[46ch] text-[13.5px] leading-[1.62] text-brand-ink-3">
              {description ||
                /*
                  This fallback previously read "…and device-bound access". A
                  device token is minted on first sign-in but never verified on
                  later logins, so the binding is recorded rather than enforced —
                  the claim was not true. Platform locking *is* enforced, by
                  `customerLogin` and by the dashboard's platform-scoped query.
                */
                "Premium digital products with verified delivery and platform-locked access. Every order is reviewed by hand before access is issued."}
            </p>

            <ul className="mt-7 space-y-3">
              {[
                "Manual payment verification on every order",
                "Setup guides included in your dashboard",
                "Platform-locked access, enforced server-side",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <ShieldCheck
                    size={13}
                    className="mt-[3px] shrink-0 text-brand-ink-4"
                    aria-hidden
                  />
                  <span className="text-[12.5px] leading-relaxed text-brand-ink-3">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns */}
          <div
            className={`grid grid-cols-2 gap-8 lg:col-span-6 lg:col-start-7 ${
              channels.length ? "sm:grid-cols-4" : "sm:grid-cols-3"
            } lg:gap-6`}
          >
            <FooterColumn title="Platform" links={NAV} />
            <FooterColumn title="Account" links={ACCOUNT} />
            <FooterColumn title="Legal" links={LEGAL} />
            {channels.length > 0 && (
              <div className="flex flex-col">
                <TechLabel size="sm" tone="dim" className="mb-4">
                  Connect
                </TechLabel>
                <ul className="flex flex-col gap-3">
                  {channels.map(({ href, label, Icon, external }) => (
                    <li key={label}>
                      <a
                        href={href}
                        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                        className="inline-flex items-center gap-2 text-[13px] text-brand-ink-2 transition-colors duration-150 hover:text-foreground"
                      >
                        <Icon size={12} className="shrink-0 opacity-70" aria-hidden />
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-14 flex flex-col gap-5 border-t border-border-subtle py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-brand-ink-4">
            {copyright || `© ${year} MK Panel Zone. All rights reserved.`}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="inline-flex items-center gap-2">
              <Lock size={11} className="text-brand-ink-4" aria-hidden />
              <TechLabel size="sm" tone="dim">
                Secure portal
              </TechLabel>
            </span>
            <Link href="/products" className="group inline-flex items-center gap-1.5">
              <TechLabel
                size="sm"
                className="transition-colors group-hover:text-foreground"
              >
                Browse products
              </TechLabel>
              <ArrowRight
                size={12}
                className="text-brand-ink-4 transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-col">
      <TechLabel size="sm" tone="dim" className="mb-4">
        {title}
      </TechLabel>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[13px] text-brand-ink-2 transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
