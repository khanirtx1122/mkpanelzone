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

    // Safety timeout mapped exactly to the end of the CSS animation
    const safety = setTimeout(finish, 4500);

    const handleInteraction = () => {
      finish();
    };

    window.addEventListener("pagehide", finish);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") finish();
    });
    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      clearTimeout(safety);
      window.removeEventListener("pagehide", finish);
      window.removeEventListener("visibilitychange", finish);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  // During SSR, we render the markup. If data-intro="off" via head script, CSS hides it instantly.
  // After hydration, if we realize we shouldn't show it, we unmount it entirely to free up DOM nodes.
  if (!isVisible) return null;

  const particles = Array.from({ length: 12 });
  const letters = "MK PANEL ZONE".split("");

  return (
    <div id="mk-intro" className="intro-container fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden pointer-events-auto">
      {/* Lights */}
      <div className="intro-light-left absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_30%_30%,_var(--color-brand-blue-900)_0%,_transparent_50%)] mix-blend-screen opacity-0" />
      <div className="intro-light-right absolute bottom-[-20%] right-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_70%_70%,_var(--color-brand-red-900)_0%,_transparent_50%)] mix-blend-screen opacity-0" />
      
      {/* Core glow */}
      <div className="intro-glow absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(11,26,69,0.8)_0%,_transparent_60%)] mix-blend-screen opacity-0" />

      {/* Perspective Grid */}
      <div 
        className="intro-grid absolute bottom-0 w-full h-[50vh] opacity-0"
        style={{ 
          backgroundSize: '40px 40px', 
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
          transform: 'perspective(600px) rotateX(75deg)',
          transformOrigin: 'bottom center'
        }}
      />

      {/* Particles */}
      {particles.map((_, i) => {
        // Use deterministic pseudo-random values to avoid hydration mismatch
        const tx = (Math.sin(i * 12.9898) * 50).toFixed(2) + "vw";
        const ty = (Math.cos(i * 78.233) * 50).toFixed(2) + "vh";
        const delay = (0.4 + Math.abs(Math.sin(i * 4.545) * 0.5)).toFixed(2) + "s";
        return (
          <div
            key={i}
            className="intro-particle absolute w-1 h-1 bg-foreground rounded-full opacity-0"
            style={{ 
              "--tx": tx, 
              "--ty": ty,
              animationDelay: delay
            } as React.CSSProperties}
          />
        );
      })}

      {/* Sweep Lines */}
      <div className="intro-sweep-left absolute left-0 top-1/2 h-[1px] bg-brand-blue-500 w-[50vw] origin-left opacity-0" style={{ animationDelay: "0.9s" }} />
      <div className="intro-sweep-right absolute right-0 top-1/2 h-[1px] bg-brand-red-500 w-[50vw] origin-right opacity-0" style={{ animationDelay: "0.9s" }} />

      {/* Contact Pulse */}
      <div className="intro-pulse absolute top-1/2 left-1/2 w-4 h-4 rounded-full border border-foreground/50 opacity-0" style={{ animationDelay: "1.2s" }} />

      {/* WORDMARK REVEAL */}
      <div className="relative z-10 flex flex-col items-center mt-[-10vh]">
        <div className="flex space-x-1 overflow-hidden px-4 py-2 relative">
          {letters.map((char, i) => {
            const isMK = i < 2;
            const delay = 1.5 + (i * 0.045) + "s";
            return (
              <span
                key={i}
                className={`intro-char text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-widest ${char === " " ? "w-4" : ""} ${isMK ? "text-foreground drop-shadow-[0_0_8px_var(--color-brand-blue-500)]" : "text-neutral-300"}`}
                style={{ animationDelay: delay }}
              >
                {char}
              </span>
            );
          })}
          
          {/* Metallic Sheen Sweep */}
          <div className="intro-sheen absolute inset-0 bg-gradient-to-r from-transparent via-foreground/40 to-transparent pointer-events-none" style={{ animationDelay: "1.5s" }} />
        </div>

        {/* Line under wordmark */}
        <div className="intro-line h-[1px] bg-gradient-to-r from-brand-blue-500 to-brand-red-500 mt-2 origin-center w-full max-w-[300px]" style={{ animationDelay: "2.1s" }} />

        {/* Loading bar & Systems Online */}
        <div className="w-full flex flex-col items-center mt-6">
          <div className="intro-bar-container w-48 h-[2px] bg-foreground/10 rounded-full overflow-hidden" style={{ animationDelay: "2.2s" }}>
            <div className="intro-bar-fill h-full bg-brand-blue-500" style={{ animationDelay: "2.2s" }} />
          </div>
          
          <div className="intro-text-fadein mt-3 flex items-center gap-2" style={{ animationDelay: "2.5s" }}>
            <span className="w-2 h-2 rounded-full bg-brand-blue-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-brand-blue-500 uppercase">Systems Online</span>
          </div>
        </div>
      </div>

      {/* Skip Button */}
      <button 
        onClick={() => {
          setIsVisible(false);
          sessionStorage.setItem("mk_intro_seen", "true");
          document.documentElement.setAttribute("data-intro", "off");
        }}
        className="intro-text-fadein absolute bottom-8 text-neutral-500 hover:text-foreground text-xs font-bold tracking-widest uppercase transition-colors px-6 py-4 flex items-center justify-center min-w-[44px] min-h-[44px]"
        style={{ animationDelay: "1s" }}
      >
        Skip
      </button>
    </div>
  );
}
