"use client";

import { useIsClient } from "@/lib/useIsClient";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ThemeToggle — icon swap only, no layout shift.
 * Reserves its own box before mount so hydration never nudges the navbar.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  /* Client detection without a cascading render — see src/lib/useIsClient.ts */
  const mounted = useIsClient();

  if (!mounted) {
    return (
      <div
        className="h-[40px] w-[40px] rounded-[11px] border border-border-subtle bg-foreground/[0.03]"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-[11px] border border-border-subtle bg-foreground/[0.03] outline-none transition-colors hover:border-border-strong hover:bg-foreground/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] active:scale-[0.95]"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ y: -14, opacity: 0, rotate: -40 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 14, opacity: 0, rotate: 40 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="text-brand-ink-2"
          >
            <Moon size={15} aria-hidden />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ y: -14, opacity: 0, rotate: -40 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 14, opacity: 0, rotate: 40 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="text-foreground"
          >
            <Sun size={16} aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
