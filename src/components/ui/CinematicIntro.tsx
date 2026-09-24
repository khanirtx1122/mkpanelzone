"use client";

import { useState, useEffect, useSyncExternalStore } from "react";

/* The `data-intro` attribute is written by the `beforeInteractive` head script
   before first paint, so it is already correct on the very first client render.
   Reading it through an external store avoids both an effect and the cascading
   render that `setState` inside one would cause. The subscription is a no-op
   because the value cannot change while the component is mounted. */
const subscribeNever = () => () => {};

function readIntroSuppressed(): boolean {
  return document.documentElement.getAttribute("data-intro") === "off";
}

const getServerIntroSuppressed = () => false;

/**
 * CinematicIntro — restrained premium opening sequence (spec §9).
 *
 * Sequence (≈2.4s total, user reaches the site almost immediately):
 *   1. dark canvas
 *   2. a single light sweep crosses the frame
 *   3. the MK mark resolves out of blur
 *   4. dimensional lighting passes across the wordmark
 *   5. the brand name settles and the interface begins moving into place
 *
 * Automatically skipped for reduced-motion users, repeat visits, non-home
 * routes and low-performance devices — the `data-intro` attribute is decided
 * by the inline head script before first paint, so there is never a flash.
 */
export function CinematicIntro() {
  /* Skipped before we even start, without an effect. */
  const introSuppressed = useSyncExternalStore(
    subscribeNever,
    readIntroSuppressed,
    getServerIntroSuppressed
  );
  const [finished, setFinished] = useState(false);
  const isVisible = !introSuppressed && !finished;

  useEffect(() => {
    if (introSuppressed) return;

    const finish = () => {
      setFinished(true);
      try {
        sessionStorage.setItem("mk_intro_seen", "true");
      } catch {
        /* storage may be unavailable in private mode — non-fatal */
      }
      document.documentElement.setAttribute("data-intro", "off");
    };

    // Mapped to the end of the CSS animation, with a small margin.
    const safety = setTimeout(finish, 2800);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") finish();
    };

    window.addEventListener("pagehide", finish);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("click", finish);
    window.addEventListener("touchstart", finish);

    return () => {
      clearTimeout(safety);
      window.removeEventListener("pagehide", finish);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("click", finish);
      window.removeEventListener("touchstart", finish);
    };
  }, [introSuppressed]);

  if (!isVisible) return null;

  const letters = "MK PANEL ZONE".split("");

  return (
    <div
      id="mk-intro"
      className="intro-container fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background pointer-events-auto"
    >
      {/* Layer 1 — a single directional light sweep */}
      <div
        className="intro-sweep absolute inset-y-0 left-0 w-[45%]"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--ambient-strong) 45%, transparent)",
        }}
        aria-hidden
      />

      {/* Layer 2 — two volumetric light sources converging on the mark */}
      <div
        className="intro-light-left absolute left-[-25%] top-[-25%] h-[150%] w-[150%] mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 32% 32%, var(--ambient-strong) 0%, transparent 52%)",
        }}
        aria-hidden
      />
      <div
        className="intro-light-right absolute bottom-[-25%] right-[-25%] h-[150%] w-[150%] mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 68% 68%, rgba(119,19,41,0.26) 0%, transparent 52%)",
        }}
        aria-hidden
      />

      {/* Layer 3 — core glow behind the wordmark */}
      <div
        className="intro-glow absolute inset-0 mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, var(--ambient-strong) 0%, transparent 58%)",
        }}
        aria-hidden
      />

      {/* Layer 4 — perspective floor grid (hidden on low-perf via .heavy-layer) */}
      <div
        className="intro-grid heavy-layer absolute bottom-0 h-[46vh] w-full"
        style={{
          backgroundSize: "52px 52px",
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.055) 1px, transparent 1px)",
          transform: "perspective(760px) rotateX(74deg)",
          transformOrigin: "bottom center",
        }}
        aria-hidden
      />

      {/* ── WORDMARK ── */}
      <div className="relative z-10 flex flex-col items-center px-6">
        <div className="relative flex items-end overflow-hidden px-2 py-1.5">
          {letters.map((char, i) => {
            const isMK = i < 2;
            const delay = 0.55 + i * 0.042;
            return (
              <span
                key={i}
                className={`intro-char font-extrabold tracking-[0.22em] ${
                  char === " " ? "w-3 sm:w-5" : ""
                } ${isMK ? "text-outline" : "text-foreground"}`}
                style={{
                  fontSize: "clamp(26px, 8vw, 54px)",
                  animationDelay: `${delay}s`,
                }}
                aria-hidden
              >
                {char}
              </span>
            );
          })}

          {/* Dimensional sheen passing across the mark */}
          <div
            className="intro-sheen pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(244,244,245,0.34), transparent)",
            }}
            aria-hidden
          />
        </div>

        {/* Hairline that draws itself under the wordmark */}
        <div
          className="intro-line mt-4 h-px w-full max-w-[320px] origin-center bg-gradient-to-r from-transparent via-[color:var(--text-2)] to-transparent"
          style={{ animationDelay: "1.15s" }}
          aria-hidden
        />

        {/* Progress + status */}
        <div className="mt-7 flex w-full flex-col items-center">
          <div
            className="intro-bar-container h-[2px] w-44 overflow-hidden rounded-full bg-foreground/[0.08]"
            style={{ animationDelay: "1.3s" }}
          >
            <div
              className="intro-bar-fill h-full rounded-full bg-[color:var(--text-1)]"
              style={{ animationDelay: "1.3s" }}
            />
          </div>

          {/*
            This read "Systems Online" beside a pulsing green dot. Nothing in the
            codebase performs a health check, so it asserted a status it could not
            know. Replaced with an annotation that is true by construction.
          */}
          <div
            className="intro-text-fadein mt-3.5 flex items-center gap-2"
            style={{ animationDelay: "1.6s" }}
          >
            <span className="h-1 w-1 rounded-full bg-[color:var(--text-4)]" aria-hidden />
            <span className="tech tech-dim tech-sm">MK Panel Zone</span>
          </div>
        </div>
      </div>

      {/* Skip — always available, 44px target, appears immediately */}
      <button
        type="button"
        onClick={() => {
          setFinished(true);
          try {
            sessionStorage.setItem("mk_intro_seen", "true");
          } catch {
            /* non-fatal */
          }
          document.documentElement.setAttribute("data-intro", "off");
        }}
        className="intro-text-fadein absolute bottom-7 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border-subtle px-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink-3 transition-colors hover:border-border-strong hover:text-foreground"
        style={{ animationDelay: "0.7s" }}
      >
        Skip intro
      </button>
    </div>
  );
}
