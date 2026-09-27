"use client";

import { useState, useEffect } from "react";

export function CinematicIntro() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if head script already killed it
    if (document.documentElement.getAttribute("data-intro") === "off") {
      setIsVisible(false);
      return;
    }

    const finish = () => {
      setIsVisible(false);
      sessionStorage.setItem("mk_intro_seen", "true");
      document.documentElement.setAttribute("data-intro", "off");
    };

    // Safety timeout mapped exactly to the end of the CSS animation (3.6s)
    const safety = setTimeout(finish, 3600);

    const handleInteraction = () => {
      finish();
    };

    window.addEventListener("pagehide", finish);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") finish();
    });
    // Removed click/touchstart fast exit to preserve the animation flow as requested.

    return () => {
      clearTimeout(safety);
      window.removeEventListener("pagehide", finish);
      window.removeEventListener("visibilitychange", finish);
    };
  }, []);

  // During SSR, we render the markup. If data-intro="off" via head script, CSS hides it instantly.
  // After hydration, if we realize we shouldn't show it, we unmount it entirely to free up DOM nodes.
  if (!isVisible) return null;

  return (
    <div id="mk-intro" className="intro-container fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050811] overflow-hidden pointer-events-auto">
      {/* Premium deep background with subtle ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,_rgba(20,40,90,0.12)_0%,_transparent_65%)] mix-blend-screen pointer-events-none" />
      
      {/* Extremely subtle horizontal depth gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_transparent_40%,_rgba(255,255,255,0.01)_50%,_transparent_60%)] pointer-events-none" />

      {/* Core Composition */}
      <div className="intro-core-container relative flex flex-col items-center z-10 w-full max-w-4xl">
        
        {/* Stage 1: Initial Signal */}
        <div className="intro-signal-line absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[1px] bg-brand-blue-400 shadow-[0_0_12px_var(--color-brand-blue-500)]" />
        
        {/* Stage 2: Technical Structure (Precision geometry) */}
        <div className="intro-corner intro-corner-tl absolute -top-3 -left-3 md:-top-5 md:-left-8 w-2 h-2 border-t border-l border-brand-blue-500/30" />
        <div className="intro-corner intro-corner-tr absolute -top-3 -right-3 md:-top-5 md:-right-8 w-2 h-2 border-t border-r border-brand-blue-500/30" />
        <div className="intro-corner intro-corner-bl absolute -bottom-3 -left-3 md:-bottom-5 md:-left-8 w-2 h-2 border-b border-l border-brand-blue-500/30" />
        <div className="intro-corner intro-corner-br absolute -bottom-3 -right-3 md:-bottom-5 md:-right-8 w-2 h-2 border-b border-r border-brand-blue-500/30" />
        
        <div className="intro-marker intro-marker-top absolute -top-8 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-brand-blue-500/30 hidden md:block" />
        <div className="intro-marker intro-marker-bottom absolute -bottom-8 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-brand-blue-500/30 hidden md:block" />

        {/* Stage 3: Wordmark Construction */}
        <div className="intro-wordmark-wrapper relative py-2 px-1 overflow-hidden">
          <div className="intro-wordmark flex items-baseline justify-center gap-1.5 md:gap-2.5 w-full">
            <span className="text-[28px] sm:text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.15)] leading-none">
              MK
            </span>
            <span className="text-[28px] sm:text-4xl md:text-5xl font-bold tracking-tight text-white/95 leading-none">
              PANEL ZONE
            </span>
          </div>
          
          {/* Subtle Crimson Accent */}
          <div className="intro-crimson-accent absolute bottom-1 left-1/2 -translate-x-1/2 h-[1px] bg-brand-red-500/90 shadow-[0_0_6px_var(--color-brand-red-500)]" />
          
          {/* Stage 4: Light Pass */}
          <div className="intro-light-pass absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-15deg] pointer-events-none" />
        </div>

        {/* Stage 5: Brand Descriptor & Status */}
        <div className="intro-descriptor-wrapper mt-3 md:mt-4 flex flex-col items-center gap-2 overflow-hidden">
          <div className="intro-descriptor text-[9px] md:text-[11px] font-semibold tracking-[0.25em] text-neutral-400 uppercase">
            Premium Digital Platform
          </div>
          <div className="intro-status flex items-center gap-1.5">
            <div className="w-[5px] h-[5px] rounded-full bg-brand-blue-400 shadow-[0_0_6px_var(--color-brand-blue-500)]" />
            <span className="text-[8px] md:text-[9px] font-bold tracking-widest text-brand-blue-400/90 uppercase">System Ready</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}

