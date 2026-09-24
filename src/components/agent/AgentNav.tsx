"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, UserPlus } from "lucide-react";

/**
 * AgentNav — the two-destination navigation for the agent workstation
 * (spec §28).
 *
 * Deliberately minimal: agents do one thing (create customer accounts), so the
 * panel has two screens and no cinematic chrome. The active indicator is a
 * shared layout element so it travels between items instead of cross-fading.
 */

const ITEMS = [
  { href: "/agent", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/agent/create", label: "Create Customer", Icon: UserPlus },
];

export function AgentNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Agent workspace"
      className="flex items-center gap-1 overflow-x-auto no-scrollbar"
    >
      {ITEMS.map(({ href, label, Icon }) => {
        const isActive =
          href === "/agent" ? pathname === "/agent" : pathname?.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex shrink-0 items-center gap-2 rounded-[11px] px-3.5 py-2.5 text-[12.5px] font-bold tracking-[0.02em] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] ${
              isActive ? "text-foreground" : "text-brand-ink-3 hover:text-foreground"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="agent-active-pill"
                className="absolute inset-0 rounded-[11px] border border-border-strong"
                style={{ background: "var(--ambient-strong)" }}
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
                aria-hidden
              />
            )}
            <Icon size={15} className="relative z-10 shrink-0" aria-hidden />
            <span className="relative z-10 whitespace-nowrap">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
