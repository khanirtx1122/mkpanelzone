"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ShieldAlert,
  Home,
  Package,
  MessageCircle,
  ArrowRight,
  Lock,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TechLabel } from "@/components/ui/Tech";

const NAV_LINKS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/products", label: "Products", Icon: Package },
  { href: "/support", label: "Support", Icon: MessageCircle },
] as const;

/**
 * Navbar — engineered floating navigation (spec §10).
 *
 * At rest it sits integrated with the hero (no chrome). Past 20px of scroll
 * it compacts by 4px, gains the glass material, a hairline border and real
 * depth. The active/hover indicator is a single shared `layoutId` element so
 * it physically travels between links instead of cross-fading.
 */
export function Navbar({
  isLoggedIn,
  logoUrl,
}: {
  isLoggedIn?: boolean;
  /** `design_logo_url` setting — falls back to the MK monogram when unset */
  logoUrl?: string;
}) {
  const pathname = usePathname();
  /*
    The panel is open only while the pathname still matches the one it was
    opened on. This replaces an effect that called `setIsOpen(false)` whenever
    `pathname` changed — which is a cascading render, and redundant because every
    link in the panel already closes it on click. Deriving the state instead
    covers the one case those handlers miss: browser back/forward.
  */
  const [openFor, setOpenFor] = useState<string | null>(null);
  const isOpen = openFor === pathname;
  const setIsOpen = (next: boolean) => setOpenFor(next ? pathname : null);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number | null = null;
    const onScroll = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        setScrolled(window.scrollY > 20);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Body scroll lock + Escape close for the mobile panel
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenFor(null);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  // Admin / agent surfaces have their own chrome
  if (
    pathname?.startsWith("/mkpanelzoneadmin") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/mk-agents")
  ) {
    return null;
  }

  const accessHref = isLoggedIn ? "/dashboard" : "/access";

  return (
    <>
      <nav
        className="fixed inset-x-0 z-50"
        style={{
          top: scrolled ? "10px" : "16px",
          transition: "top 320ms cubic-bezier(.22,1,.36,1)",
          paddingLeft: "max(12px, env(safe-area-inset-left))",
          paddingRight: "max(12px, env(safe-area-inset-right))",
          paddingTop: "max(8px, env(safe-area-inset-top))",
        }}
      >
        <div
          className="mx-auto flex h-[58px] max-w-[1240px] items-center justify-between rounded-[16px] px-3 sm:px-4"
          style={{
            background: scrolled ? "var(--surface-glass)" : "transparent",
            backdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
            border: scrolled ? "1px solid var(--border-subtle)" : "1px solid transparent",
            boxShadow: scrolled ? "var(--shadow-glass)" : "none",
            transition:
              "background 320ms cubic-bezier(.22,1,.36,1), border-color 320ms, box-shadow 320ms",
          }}
        >
          {/* ── BRAND ── */}
          <Link
            href="/"
            aria-label="MK Panel Zone — Home"
            className="group flex shrink-0 items-center gap-2 rounded-[10px] px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
          >
            {/*
              Neutral brand tile. This was a blue-gradient chip with a blue
              border and blue lettering — one of several places the accent was
              used decoratively rather than for an action or an active state.
            */}
            <span className="flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-[9px] border border-border-strong bg-foreground/[0.06] text-[12px] font-extrabold tracking-[0.02em] text-foreground transition-transform duration-300 group-hover:scale-[1.04]">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt=""
                  className="h-full w-full object-contain"
                  loading="eager"
                />
              ) : (
                "MK"
              )}
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[13px] font-extrabold tracking-[0.10em] text-foreground">
                PANEL ZONE
              </span>
              <span className="mt-[3px] hidden text-[9px] font-bold uppercase tracking-[0.16em] text-brand-ink-3 min-[420px]:block">
                Digital Products
              </span>
            </span>
          </Link>

          {/* ── DESKTOP NAV ── */}
          <div
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 md:flex"
            onMouseLeave={() => setHoveredPath(null)}
          >
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const isHovered = hoveredPath === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredPath(link.href)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative rounded-full px-4 py-2 text-[12.5px] font-bold uppercase tracking-[0.075em] transition-colors duration-200 ${
                    isActive ? "text-foreground" : "text-brand-ink-3 hover:text-foreground"
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>

                  {isHovered && !isActive && (
                    <motion.span
                      layoutId="nav-hover-pill"
                      className="absolute inset-0 rounded-full bg-foreground/[0.055]"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                      aria-hidden
                    />
                  )}

                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full border border-border-strong bg-foreground/[0.07]"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── RIGHT ACTIONS ── */}
          <div className="flex shrink-0 items-center gap-2">
            {/*
              This slot previously held a pulsing green dot labelled "Systems
              Online". Nothing in the codebase performs a health check, so the
              indicator asserted a status it had no way to know — the same class
              of problem as a fabricated progress bar. Replaced with a factual
              annotation that costs nothing to keep true.
            */}
            <span className="mr-0.5 hidden items-center gap-2 lg:flex">
              <span className="h-1 w-1 rounded-full bg-[color:var(--text-4)]" aria-hidden />
              <TechLabel size="sm">Manual verification</TechLabel>
            </span>

            <ThemeToggle />

            <Link
              href={accessHref}
              aria-label={isLoggedIn ? "My panel" : "Customer access"}
              className="group relative flex h-[40px] items-center rounded-[11px] border border-border-strong bg-foreground/[0.06] px-2.5 transition-[transform,background-color] duration-200 hover:bg-foreground/[0.10] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] sm:px-3.5"
            >
              <Lock size={13} className="shrink-0 text-brand-ink-2" aria-hidden />
              <span className="ml-2 hidden text-[11px] font-bold uppercase tracking-[0.09em] text-foreground min-[400px]:block">
                {isLoggedIn ? "My Panel" : "Access"}
              </span>
              {isLoggedIn && (
                /* Accent as an active-state indicator — a permitted use. */
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-[color:var(--background)] bg-[color:var(--accent)]"
                  aria-hidden
                />
              )}
            </Link>

            {/* Mobile menu trigger */}
            <button
              type="button"
              className="flex h-[40px] w-[40px] items-center justify-center rounded-[11px] border text-brand-ink-2 transition-[transform,color] duration-100 hover:text-foreground active:scale-[0.95] md:hidden"
              style={{ background: "var(--surface-glass)", borderColor: "var(--border-subtle)" }}
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mk-mobile-nav"
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE FULL-SCREEN PANEL (spec §10) ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(4,6,10,0.72)", backdropFilter: "blur(8px)" }}
              aria-hidden
            />

            <motion.div
              id="mk-mobile-nav"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 z-50 mx-3 overflow-hidden rounded-[22px] mat-5 md:hidden"
              style={{
                top: "calc(env(safe-area-inset-top, 0px) + 78px)",
                maxHeight: "calc(100dvh - 100px)",
              }}
            >
              {/* Depth wash so the panel is not a flat sheet (achromatic) */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 60% at 50% 0%, var(--ambient-blue) 0%, transparent 62%)",
                }}
                aria-hidden
              />

              <div className="relative flex flex-col p-3">
                <TechLabel size="sm" className="px-3 pb-2 pt-2">
                  Navigate
                </TechLabel>

                {NAV_LINKS.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.055, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`group relative flex h-[58px] items-center gap-3.5 rounded-[14px] px-4 text-[15px] font-bold uppercase tracking-[0.07em] transition-colors duration-200 ${
                          isActive
                            ? "border border-border-strong bg-foreground/[0.07] text-foreground"
                            : "border border-transparent text-brand-ink-3 hover:text-foreground"
                        }`}
                      >
                        {isActive && (
                          <span
                            className="absolute left-0 top-1/2 h-[46%] w-[3px] -translate-y-1/2 rounded-r-full bg-[color:var(--accent)]"
                            aria-hidden
                          />
                        )}
                        <link.Icon
                          size={18}
                          className={isActive ? "text-foreground" : "text-brand-ink-3"}
                          aria-hidden
                        />
                        <span className="flex-1">{link.label}</span>
                        <ArrowRight
                          size={15}
                          className={`transition-transform duration-200 group-hover:translate-x-0.5 ${
                            isActive ? "text-brand-ink-2" : "text-brand-ink-4"
                          }`}
                          aria-hidden
                        />
                      </Link>
                    </motion.div>
                  );
                })}

                <div className="my-2 h-px bg-border-subtle" aria-hidden />

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={accessHref}
                    onClick={() => setIsOpen(false)}
                    className="relative flex h-[56px] items-center gap-3 overflow-hidden rounded-[14px] bg-[color:var(--text-1)] px-4 text-[14px] font-extrabold uppercase tracking-[0.07em] text-[color:var(--background)] transition-transform duration-100 active:scale-[0.98]"
                  >
                    <ShieldAlert size={18} className="shrink-0" aria-hidden />
                    <span>{isLoggedIn ? "My Panel" : "Customer Access"}</span>
                    <ArrowRight size={16} className="ml-auto shrink-0" aria-hidden />
                  </Link>
                </motion.div>

                {/*
                  This line read "Device-bound access · Verified manually". The
                  device binding is recorded on first sign-in but never verified
                  on later logins, so the claim was not true. Platform locking
                  and manual verification are both real.
                */}
                <TechLabel size="sm" className="px-3 pb-1 pt-4 text-center">
                  Platform-locked access · Verified manually
                </TechLabel>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
