"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldAlert, Home, Package, MessageCircle, ChevronDown, UserPlus, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useFreePanel } from "@/components/freepanel/FreePanelProvider";
import { useSessionHint } from "./useSessionHint";

const navLinks = [
  { href: "/",         label: "Home",    Icon: Home },
  { href: "/products", label: "Products", Icon: Package },
  { href: "/support",  label: "Support",  Icon: MessageCircle },
];

export function Navbar({ isLoggedIn: isLoggedInProp }: { isLoggedIn?: boolean }) {
  /* The session hint is read in the browser so the root layout never has to
     touch cookies() — that read made every public page render dynamically.
     The prop is still honoured when a caller passes it explicitly. */
  const sessionHint = useSessionHint();
  const isLoggedIn = sessionHint || !!isLoggedInProp;
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [resellerOpen, setResellerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const { openFreePanel, available: freePanelAvailable } = useFreePanel();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (
    pathname?.startsWith("/mkpanelzoneadmin") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/mk-agents")
  ) return null;

  return (
    <>
      <nav
        className="fixed inset-x-0 z-50"
        style={{
          top: scrolled ? "8px" : "12px",
          transition: "top 300ms cubic-bezier(.22,1,.36,1)",
          paddingLeft: "max(12px, env(safe-area-inset-left))",
          paddingRight: "max(12px, env(safe-area-inset-right))",
          paddingTop: "max(8px, env(safe-area-inset-top))",
        }}
      >
        <div
          className="max-w-7xl mx-auto h-[60px] flex items-center justify-between rounded-[18px] px-3 sm:px-4 md:px-6"
          style={{
            background: scrolled ? "var(--surface-glass)" : "transparent",
            backdropFilter: scrolled ? "blur(16px) saturate(160%)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(16px) saturate(160%)" : "none",
            border: scrolled ? "1px solid var(--border-subtle)" : "1px solid transparent",
            boxShadow: scrolled ? "var(--shadow-glass)" : "none",
            transition: "background 300ms, border-color 300ms, box-shadow 300ms",
          }}
        >
          {/* ── LOGO ── */}
          {/*
            320px budget: logo ≈ 120px + gap(8px) + theme(42px) + menu(42px) = 212px
            Never exceeds screen. Logo text shrinks via clamp.
          */}
          <Link
            href="/"
            className="brand-loop wordmark flex-shrink-0 focus-visible:outline-2 focus-visible:outline-brand-neon-blue focus-visible:outline-offset-2 rounded-lg px-1 pb-1 pt-0.5"
            aria-label="MK Panel Zone — Home"
          >
            <span
              className="wordmark-mk"
              style={{ fontSize: "clamp(13px,4vw,16px)" }}
            >
              MK
            </span>
            <span
              className="wordmark-zone"
              style={{ fontSize: "clamp(11px,3.4vw,14px)" }}
            >
              PANEL ZONE
            </span>
          </Link>

          {/* ── DESKTOP NAV (md+) ── */}
          <div
            className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2"
            onMouseLeave={() => setHoveredPath(null)}
          >
            {navLinks.map((link) => {
              const isActive  = pathname === link.href;
              const isHovered = hoveredPath === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredPath(link.href)}
                  className={`relative px-4 py-2 text-[13px] font-bold tracking-[0.07em] uppercase rounded-full transition-colors duration-200 ${
                    isActive ? "text-foreground" : "text-brand-ink-3 hover:text-foreground"
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>
                  {isHovered && (
                    <motion.span
                      layoutId="nav-hover"
                      className="absolute inset-0 rounded-full"
                      style={{ background: "rgba(255,255,255,0.07)" }}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-brand-blue-500"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── RIGHT ACTIONS ── */}
          {/*
            On very small screens (< 360px): ThemeToggle + Menu only.
            On ≥ 360px: Add a minimal icon-only shield button.
            On ≥ sm: Show label text.
          */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ThemeToggle />

            {/* FREE PANEL — compact premium CTA; label from ≥390px, icon-only below */}
            {freePanelAvailable && (
              <button
                onClick={openFreePanel}
                aria-label="Claim free PC panel — 5 days free access"
                className="hidden sm:flex h-[42px] items-center gap-1.5 rounded-[12px] px-2.5 min-[390px]:px-3 border active:scale-[0.96] transition-[background-color,border-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-brand-neon-blue focus-visible:outline-offset-2"
                style={{
                  background: "linear-gradient(135deg,rgba(30,63,168,0.22),rgba(47,95,208,0.16))",
                  borderColor: "rgba(77,163,255,0.35)",
                  boxShadow: "0 0 0 1px rgba(77,163,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <span
                  className="w-[6px] h-[6px] rounded-full shrink-0"
                  style={{ background: "#4DA3FF", boxShadow: "0 0 6px rgba(77,163,255,0.8)" }}
                />
                <span className="hidden min-[390px]:block text-[10.5px] font-extrabold tracking-[0.1em] uppercase text-brand-neon-blue whitespace-nowrap">
                  FREE PANEL
                </span>
              </button>
            )}

            {/* Access button — icon always, label on ≥360px */}
            <Link
              href={isLoggedIn ? "/dashboard" : "/access"}
              aria-label={isLoggedIn ? "My Panel" : "Customer Access"}
              className="relative h-[42px] flex items-center rounded-[12px] px-2 sm:px-3 border transition-[background-color,border-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-brand-neon-blue focus-visible:outline-offset-2 active:scale-[0.96]"
              style={{
                background: "rgba(47,95,208,0.12)",
                borderColor: "rgba(77,163,255,0.28)",
              }}
            >
              <div
                className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)" }}
              >
                <ShieldAlert size={14} className="text-brand-neon-blue" />
              </div>
              {/* Label hides on tiny screens to prevent overflow */}
              <span className="hidden min-[360px]:block ml-2 text-[11px] sm:text-[12px] font-bold tracking-[0.08em] uppercase text-foreground whitespace-nowrap">
                {isLoggedIn ? "MY PANEL" : "ACCESS"}
              </span>
              {isLoggedIn && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-neon-blue rounded-full" />
              )}
            </Link>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden w-[42px] h-[42px] rounded-[12px] flex items-center justify-center border text-brand-ink-2 hover:text-foreground active:scale-[0.95] transition-[transform,color] duration-100"
              style={{ background: "var(--surface-glass)", borderColor: "var(--border-subtle)" }}
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(15,23,42,0.82)", backdropFilter: "blur(10px)" }}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed z-50 md:hidden flex flex-col gap-1 p-3 rounded-[22px] overflow-hidden"
              style={{
                top: "80px",
                left: "12px",
                right: "12px",
                background: "var(--surface-glass)",
                backdropFilter: "blur(20px) saturate(160%)",
                WebkitBackdropFilter: "blur(20px) saturate(160%)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-glass)",
              }}
            >
              {/* Subtle top glow */}
              <div className="absolute inset-0 pointer-events-none rounded-[22px]"
                style={{ background: "linear-gradient(to bottom,rgba(47,95,208,0.06),transparent)" }} />

              {/* Nav links */}
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.04, duration: 0.2, ease: [0.22,1,.36,1] }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`relative h-[52px] flex items-center gap-3.5 px-4 rounded-[14px] text-[14px] font-extrabold tracking-[0.06em] uppercase transition-colors duration-200 ${
                        isActive
                          ? "text-foreground"
                          : "text-brand-ink-3 hover:text-foreground"
                      }`}
                      style={{
                        background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                        border: isActive ? "1px solid var(--border-subtle)" : "1px solid transparent",
                      }}
                    >
                      {/* Active accent bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[50%] bg-brand-neon-blue rounded-r-full" />
                      )}
                      <link.Icon size={17} className={isActive ? "text-brand-neon-blue" : "text-brand-ink-3"} />
                      <span>{link.label}</span>
                    </Link>
                  </motion.div>
                );
              })}

              <div className="h-px mx-2 my-1" style={{ background: "var(--border-subtle)" }} />

              {/* Free Panel CTA */}
              {freePanelAvailable && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      openFreePanel();
                    }}
                    className="w-full h-[52px] flex items-center gap-3 px-4 rounded-[14px] font-extrabold tracking-[0.06em] uppercase text-brand-neon-blue text-[14px] active:scale-[0.975] transition-transform duration-100 border"
                    style={{
                      background: "rgba(47,95,208,0.12)",
                      borderColor: "rgba(77,163,255,0.30)",
                    }}
                  >
                    <span
                      className="w-[7px] h-[7px] rounded-full shrink-0"
                      style={{ background: "#4DA3FF", boxShadow: "0 0 8px rgba(77,163,255,0.8)" }}
                    />
                    <span>FREE PANEL — 5 DAYS</span>
                  </button>
                </motion.div>
              )}

              {/* Customer Access CTA */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.22, ease: [0.22,1,.36,1] }}
              >
                <Link
                  href={isLoggedIn ? "/dashboard" : "/access"}
                  onClick={() => setIsOpen(false)}
                  className="h-[52px] flex items-center gap-3 px-4 rounded-[14px] font-extrabold tracking-[0.06em] uppercase text-white relative overflow-hidden text-[14px] active:scale-[0.975] transition-transform duration-100"
                  style={{
                    background: "linear-gradient(135deg,#1E3FA8,#2F5FD0)",
                    boxShadow: "0 4px 14px rgba(47,95,208,0.3)",
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-px rounded-t-[14px]" style={{ background: "rgba(255,255,255,0.12)" }} />
                  <ShieldAlert size={17} className="shrink-0" />
                  <span>{isLoggedIn ? "MY PANEL" : "CUSTOMER ACCESS"}</span>
                </Link>
              </motion.div>

              {/* Reseller Program — red-accented, equally prominent to Customer
                  Access. Expands into Join / Login rather than navigating away. */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.22, ease: [0.22,1,.36,1] }}
              >
                <button
                  type="button"
                  onClick={() => setResellerOpen((v) => !v)}
                  aria-expanded={resellerOpen}
                  className="w-full h-[52px] flex items-center gap-3 px-4 rounded-[14px] font-extrabold tracking-[0.06em] uppercase text-white relative overflow-hidden text-[14px] active:scale-[0.975] transition-transform duration-100 border"
                  style={{
                    background: "linear-gradient(135deg, rgba(190,30,60,0.92), rgba(239,68,68,0.82))",
                    borderColor: "rgba(255,120,140,0.35)",
                    boxShadow: "0 4px 14px rgba(190,30,60,0.28)",
                  }}
                >
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: "#FFD5DD", boxShadow: "0 0 8px rgba(255,213,221,0.9)" }}
                  />
                  <span className="flex-1 text-left">RESELLER PROGRAM</span>
                  <ChevronDown
                    size={16}
                    className="shrink-0 transition-transform duration-200"
                    style={{ transform: resellerOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {resellerOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.22,1,.36,1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1.5 pl-2 space-y-1.5">
                        <Link
                          href="/reseller"
                          onClick={() => setIsOpen(false)}
                          className="h-[46px] flex items-center gap-3 px-4 rounded-[12px] text-[13px] font-bold tracking-[0.05em] uppercase text-brand-ink-2 hover:text-white transition-colors"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}
                        >
                          <UserPlus size={16} className="shrink-0 text-red-400" />
                          <span>Join Reseller Program</span>
                        </Link>
                        <Link
                          href="/mkpanelzoneagents"
                          onClick={() => setIsOpen(false)}
                          className="h-[46px] flex items-center gap-3 px-4 rounded-[12px] text-[13px] font-bold tracking-[0.05em] uppercase text-brand-ink-2 hover:text-white transition-colors"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}
                        >
                          <LogIn size={16} className="shrink-0 text-red-400" />
                          <span>Reseller Login</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
