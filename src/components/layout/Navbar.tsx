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

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // Hide on management routes
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
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ease-obsidian px-4 md:px-6 pt-[env(safe-area-inset-top,16px)] ${
          scrolled ? "top-2" : "top-4"
        }`}
      >
        <div 
          className={`max-w-7xl mx-auto h-[64px] flex items-center justify-between rounded-[20px] transition-all duration-300 ${
            scrolled 
              ? "bg-surface-glass backdrop-blur-xl border border-border-subtle shadow-lg" 
              : "bg-transparent border border-transparent"
          } px-4 md:px-6`}
        >
          {/* Logo */}
          <Link 
            href="/" 
            className="text-[15px] sm:text-xl font-extrabold tracking-[0.08em] sm:tracking-[0.1em] text-foreground flex items-center gap-2 group relative px-2 py-1 rounded-lg"
          >
            {/* The neon underline */}
            <div className="absolute bottom-0 left-2 right-2 h-[1px] neon-rule opacity-70 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative isolate flex items-center gap-2">
              <span 
                data-text="MK"
                className="relative z-10 neon-text-blue before:content-[attr(data-text)] before:absolute before:inset-0 before:neon-text-blue before:animate-neon-power-on group-hover:before:animate-neon-sheen"
              >
                MK
                <span className="absolute inset-0 animate-neon-breathe pointer-events-none neon-text-blue" aria-hidden="true">MK</span>
              </span>
              <span 
                data-text="PANEL ZONE"
                className="relative z-10 text-foreground font-medium neon-text-red-edge before:content-[attr(data-text)] before:absolute before:inset-0 before:neon-text-red-edge before:animate-neon-power-on group-hover:before:animate-neon-sheen"
              >
                PANEL ZONE
                <span className="absolute inset-0 animate-neon-breathe pointer-events-none neon-text-red-edge" aria-hidden="true">PANEL ZONE</span>
              </span>
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
                  className={`relative px-4 py-2 text-[13.5px] font-bold tracking-[0.08em] uppercase transition-colors hover:text-foreground rounded-full ${
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
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-brand-blue-500 rounded-full shadow-[0_0_8px_var(--color-brand-blue-500)]"
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
            
            {/* Customer Access Pill */}
            <Link
              href={isLoggedIn ? "/dashboard" : "/access"}
              aria-label="Get your panel: customer access"
              className="relative group h-[44px] rounded-[14px] flex items-center px-1.5 min-[350px]:px-2.5 min-[420px]:px-3 bg-brand-blue-900/20 border border-brand-blue-500/30 transition-all hover:scale-100 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden shadow-[0_0_15px_rgba(77,163,255,0.15)] hover:shadow-[0_0_20px_rgba(77,163,255,0.3)] hover:bg-brand-blue-900/40"
            >
              {/* Static glow behind */}
              <div className="absolute inset-0 bg-brand-blue-500/5 group-hover:bg-brand-blue-500/10 transition-colors pointer-events-none" />
              
              {/* Neon border gradient layer */}
              <div className="absolute inset-0 rounded-[14px] neon-border-gradient opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              {/* Traveling light border on hover (purely visual sweep) */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-neon-blue/40 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-[600ms] ease-out pointer-events-none opacity-0 group-hover:opacity-100" />

              <div className="relative z-10 flex items-center gap-2">
                <div className="w-[32px] h-[32px] rounded-lg bg-foreground/5 border border-border-subtle flex items-center justify-center group-hover:-translate-y-[1px] transition-transform">
                  <ShieldAlert size={16} className="text-brand-ink-2 group-hover:text-brand-neon-blue transition-colors drop-shadow-md" />
                </div>
                <span className="hidden min-[350px]:block text-[11px] min-[420px]:text-[12.5px] font-bold tracking-[0.1em] uppercase text-foreground whitespace-nowrap">
                  {isLoggedIn ? "MY PANEL" : "GET PANEL"}
                </span>
              </div>
              
              {isLoggedIn && (
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-brand-neon-blue rounded-full shadow-[0_0_5px_var(--color-brand-neon-blue)]" />
              )}
            </Link>

            {/* Mobile Toggle */}
            <button 
              className="md:hidden relative group w-[44px] h-[44px] rounded-2xl flex items-center justify-center bg-surface-glass border border-border-subtle text-brand-ink-2 hover:text-foreground active:scale-95 transition-all overflow-hidden"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Menu"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[600ms] ease-out pointer-events-none" />
              {isOpen ? <X size={20} className="relative z-10" /> : <Menu size={20} className="relative z-10" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-[88px] left-4 right-4 bg-surface/80 backdrop-blur-3xl border border-border-subtle rounded-[24px] p-4 z-50 md:hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-blue-500/10 to-transparent pointer-events-none" />
              {links.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`h-[56px] flex items-center px-5 rounded-2xl text-[16px] font-extrabold tracking-[0.08em] uppercase transition-colors relative overflow-hidden group ${
                      pathname === link.href ? "bg-foreground/10 text-foreground border border-border-subtle" : "text-brand-ink-3 hover:bg-foreground/5 hover:text-foreground border border-transparent"
                    }`}
                  >
                    <span className="relative z-10">{link.label}</span>
                    {pathname === link.href && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-brand-blue-500 rounded-r-full shadow-[0_0_8px_var(--color-brand-blue-500)]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-out pointer-events-none" />
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
