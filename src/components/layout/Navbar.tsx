"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Navbar({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (pathname?.startsWith("/mkpanelzoneadmin") || pathname?.startsWith("/agent") || pathname?.startsWith("/mk-agents")) {
    return null;
  }

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/support", label: "Support" },
  ];

  return (
    <>
      <nav
        className={`fixed left-0 right-0 z-50 transition-[top] duration-300 ease-[var(--ease-obsidian)] px-4 md:px-6 pt-[env(safe-area-inset-top,16px)] ${
          scrolled ? "top-2" : "top-4"
        }`}
      >
        <div
          className={`max-w-7xl mx-auto h-[64px] flex items-center justify-between rounded-[20px] transition-[background-color,border-color] duration-300 ${
            scrolled
              ? "glass-nav shadow-[var(--shadow-glass)]"
              : "bg-transparent border border-transparent"
          } px-4 md:px-6`}
        >
          {/* Logo — neon-breathe removed per spec 6.5 */}
          <Link
            href="/"
            className="text-[15px] sm:text-xl font-extrabold tracking-[0.08em] sm:tracking-[0.1em] text-foreground flex items-center gap-2 group relative px-2 py-1 rounded-lg"
          >
            <div className="absolute bottom-0 left-2 right-2 h-[1px] neon-rule opacity-70 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="relative isolate flex items-center gap-2">
              <span
                data-text="MK"
                className="relative z-10 neon-text-blue before:content-[attr(data-text)] before:absolute before:inset-0 before:neon-text-blue before:animate-neon-power-on group-hover:before:animate-neon-sheen"
              >MK</span>
              <span
                data-text="PANEL ZONE"
                className="relative z-10 text-foreground font-medium neon-text-red-edge before:content-[attr(data-text)] before:absolute before:inset-0 before:neon-text-red-edge before:animate-neon-power-on group-hover:before:animate-neon-sheen"
              >PANEL ZONE</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div
            className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2"
            onMouseLeave={() => setHoveredPath(null)}
          >
            {links.map((link) => {
              const isActive = pathname === link.href;
              const isHovered = hoveredPath === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredPath(link.href)}
                  className={`relative px-4 py-2 text-[13.5px] font-bold tracking-[0.08em] uppercase transition-colors duration-[var(--duration-fast)] hover:text-foreground rounded-full ${
                    isActive ? "text-foreground" : "text-brand-ink-3"
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>
                  {isHovered && (
                    <motion.div
                      layoutId="navbar-hover"
                      className="absolute inset-0 bg-white/10 rounded-full z-0"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-underline"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-brand-blue-500 rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {/* GET PANEL / MY PANEL — press feedback only, no hover translate/box-shadow */}
            <Link
              href={isLoggedIn ? "/dashboard" : "/access"}
              aria-label="Customer access"
              className="relative group h-[44px] rounded-[14px] flex items-center px-1.5 min-[350px]:px-2.5 min-[420px]:px-3
                bg-brand-blue-900/20 border border-brand-blue-500/30
                active:scale-[0.975] transition-[transform,opacity] duration-[100ms]
                focus-visible:outline-2 focus-visible:outline-brand-neon-blue focus-visible:outline-offset-2
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-brand-blue-500/5 group-hover:bg-brand-blue-500/12 transition-[background-color] duration-200 pointer-events-none" />
              <div className="absolute inset-0 rounded-[14px] neon-border-gradient opacity-40 group-hover:opacity-90 transition-opacity duration-200 pointer-events-none" />
              <div className="relative z-10 flex items-center gap-2">
                <div className="w-[32px] h-[32px] rounded-lg bg-foreground/5 border border-border-subtle flex items-center justify-center">
                  <ShieldAlert size={16} className="text-brand-ink-2 group-hover:text-brand-neon-blue transition-colors duration-200" />
                </div>
                <span className="hidden min-[350px]:block text-[11px] min-[420px]:text-[12.5px] font-bold tracking-[0.1em] uppercase text-foreground whitespace-nowrap">
                  {isLoggedIn ? "MY PANEL" : "GET PANEL"}
                </span>
              </div>
              {isLoggedIn && (
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-brand-neon-blue rounded-full shadow-[0_0_5px_var(--color-brand-neon-blue)]" />
              )}
            </Link>

            {/* Hamburger — 44×44, no hover sweep (paint trigger) */}
            <button
              className="md:hidden w-[44px] h-[44px] rounded-2xl flex items-center justify-center
                bg-[var(--surface-glass)] border border-border-subtle
                text-brand-ink-2 hover:text-foreground
                active:scale-[0.95] transition-[transform,color] duration-[100ms]"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer — translateY + opacity only */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-[88px] left-4 right-4 glass-nav rounded-[24px] p-4 z-50 md:hidden shadow-[var(--shadow-glass)] flex flex-col gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-blue-500/8 to-transparent pointer-events-none rounded-[24px]" />
              {links.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 + 0.04, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`h-[56px] flex items-center px-5 rounded-2xl text-[16px] font-extrabold tracking-[0.08em] uppercase transition-[background-color,color] duration-200 relative ${
                      pathname === link.href
                        ? "bg-foreground/10 text-foreground border border-border-subtle"
                        : "text-brand-ink-3 hover:bg-foreground/5 hover:text-foreground border border-transparent"
                    }`}
                  >
                    <span className="relative z-10">{link.label}</span>
                    {pathname === link.href && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-brand-blue-500 rounded-r-full" />
                    )}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

