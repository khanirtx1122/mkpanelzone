"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { EASE_MAIN, buildTimeline, type Tier } from "./intro/timing";
import { CenterGlow, ShutterPlanes } from "./intro/IntroAtmosphere";
import { BrandWordmark } from "./intro/BrandWordmark";
import { BrandDescriptor, BrandStatus } from "./intro/BrandDescriptor";
import s from "./intro/CinematicIntro.module.css";

/**
 * MK PANEL ZONE — signature brand intro.
 *
 * Structure (scoped entirely to this overlay):
 *   IntroAtmosphere / ShutterPlanes  the two planes that physically open
 *   SignalLayer                      razor-thin cobalt signal + energy point
 *   ConstructionRails                registration marks + structural rails
 *   BrandWordmark                    engineered MK, masked PANEL ZONE, signature line
 *   BrandDescriptor / BrandStatus    descriptor + micro system signature
 *
 * The tier (full / lite / reduced) is decided before hydration by the script in
 * the root layout, so nothing flashes and nothing is guessed on the server.
 * The website itself is always rendered behind this overlay and is *revealed*
 * by the shutter — never faded in.
 */

/** Registered by the pre-hydration script in the root layout. */
declare global {
  interface Window {
    __mkReveal?: () => void;
    __mkIntroCap?: ReturnType<typeof setTimeout>;
  }
}

const TIERS = ["full", "lite", "reduced"];
/** represents "we do not know yet" during SSR + hydration */
const PENDING = "pending";

/* ------------------------------------------------------------------ *
 * Tiny external store around the pre-hydration tier attribute. Using
 * useSyncExternalStore keeps the first client render identical to the
 * server render, then hands us the real tier without any setState-in-effect.
 * ------------------------------------------------------------------ */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function notify() {
  for (const listener of listeners) listener();
}

function readTier(): string {
  if (typeof document === "undefined") return PENDING;
  return document.documentElement.getAttribute("data-intro") ?? "off";
}

const readServerTier = () => PENDING;

export function CinematicIntro() {
  const tier = useSyncExternalStore(subscribe, readTier, readServerTier);
  const isTier = TIERS.includes(tier);

  const mobile = useMemo(() => {
    if (!isTier) return false;
    try {
      if (typeof window.matchMedia !== "function") return false;
      return window.matchMedia("(max-width: 767px)").matches;
    } catch {
      // Very old Safari without matchMedia support — treat as desktop layout.
      return false;
    }
  }, [isTier]);

  const cfg = useMemo(
    () => (isTier ? buildTimeline(tier as Tier, mobile) : null),
    [isTier, tier, mobile]
  );

  useEffect(() => {
    if (!cfg) return;

    // Tell the pre-hydration probe to stop second-guessing a sequence that is
    // already on screen.
    document.documentElement.setAttribute("data-intro-run", "1");

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      // The pre-hydration helper does the DOM work (and cannot fail to exist).
      try {
        if (typeof window.__mkReveal === "function") {
          window.__mkReveal();
        } else {
          document.documentElement.setAttribute("data-intro", "off");
          document.documentElement.removeAttribute("data-intro-run");
        }
      } catch {
        /* never let cleanup itself throw */
      }
      if (window.__mkIntroCap) window.clearTimeout(window.__mkIntroCap);
      // The store notification unmounts the overlay so nothing stays
      // clickable behind the site.
      notify();
    };

    // Layered safety nets — the overlay must never outlive the sequence:
    //   1. this timer (runs once React is alive),
    //   2. the plain-JS cap in the root layout (runs even if React never loads),
    //   3. pagehide / visibilitychange,
    //   4. pageshow — Safari bfcache restores do not resume frozen timers.
    const safety = window.setTimeout(release, (cfg.unmount + 0.5) * 1000);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") release();
    };
    /* bfcache restore only — `persisted` is true when Safari/Chrome restored a
       frozen page. A normal load also fires pageshow, which must NOT cut the
       sequence short. */
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) release();
    };

    window.addEventListener("pagehide", release);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(safety);
      window.removeEventListener("pagehide", release);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [cfg]);

  // Anything that is not a real tier (including "off") renders nothing. The
  // SSR/hydration pass is the only time the cover exists without a timeline.
  if (!isTier && tier !== PENDING) return null;

  const exitY = mobile ? -24 : -36;

  return (
    <div id="mk-intro" className={s.root} aria-hidden="true">
      <ShutterPlanes cfg={cfg} />
      {cfg && <CenterGlow cfg={cfg} />}

      {cfg && (
        <div className={s.content}>
          <motion.div
            className={s.stack}
            initial={{ y: 0, scale: 1, clipPath: "inset(0% 0% -3% 0%)" }}
            animate={{ y: exitY, scale: 0.88, clipPath: "inset(0% 0% 103% 0%)" }}
            transition={{ duration: cfg.exitDur, delay: cfg.exit, ease: EASE_MAIN }}
          >
            <BrandWordmark cfg={cfg} />
            {!cfg.reduced && (
              <>
                <BrandDescriptor cfg={cfg} />
                <BrandStatus cfg={cfg} />
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
