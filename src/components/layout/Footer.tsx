"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (
    pathname?.startsWith("/mkpanelzoneadmin") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/mk-agents")
  ) {
    return null;
  }

  const links = [
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
    { href: "/support", label: "Support" },
  ];

  return (
    <footer className="border-t border-[var(--border-subtle)] mt-20 relative">
      {/* Neon top-rule — static, no hover animation */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-brand-neon-blue to-transparent opacity-40" />

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Copyright */}
        <div className="text-brand-ink-3 text-sm text-center md:text-left">
          &copy; {new Date().getFullYear()} MK Panel Zone. All rights reserved.
        </div>

        {/* Links — 44px tap area via py-3 */}
        <nav aria-label="Footer navigation">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block px-3 py-3 text-sm text-brand-ink-3 hover:text-foreground transition-colors duration-[var(--duration-fast,150ms)] rounded-lg focus-visible:outline-2 focus-visible:outline-brand-neon-blue"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
