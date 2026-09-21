"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  
  if (pathname?.startsWith("/mkpanelzoneadmin") || pathname?.startsWith("/agent") || pathname?.startsWith("/mk-agents")) {
    return null;
  }

  return (
    <footer className="border-t border-border-subtle mt-20 relative">
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-brand-neon-blue to-transparent opacity-50 shadow-[0_0_10px_var(--color-brand-neon-blue)]" />
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-brand-ink-3 text-sm">
          &copy; {new Date().getFullYear()} MK Panel Zone. All rights reserved.
        </div>
        <div className="flex items-center gap-6 text-sm text-brand-ink-3">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/support" className="hover:text-foreground transition-colors">
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
