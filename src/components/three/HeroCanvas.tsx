"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

/**
 * HeroCanvas — capability gate and loader for the WebGL hero.
 *
 * Three responsibilities, in order of importance:
 *
 * 1. DECIDE WHETHER 3D SHOULD RUN AT ALL. A WebGL hero is expensive and can be
 *    actively hostile on the wrong device. This refuses to load on:
 *      · devices the runtime probe has already flagged as low-tier
 *      · `prefers-reduced-motion` (the scene moves continuously)
 *      · `navigator.connection.saveData`
 *      · anything that cannot create a WebGL context
 *
 * 2. KEEP three.js OUT OF THE INITIAL BUNDLE. The scene is dynamically imported
 *    with `ssr: false`, so the ~150KB of three + R3F is only fetched by devices
 *    that passed the gate, and never during server rendering.
 *
 * 3. SUPPLY THE THEME. Line and accent colours are read from the design tokens
 *    rather than hardcoded, so the scene follows the palette automatically.
 */

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), { ssr: false });

/** Used only if a token cannot be read, so the scene never renders invisible. */
const FALLBACK_LINE = { dark: "#F4F4F5", light: "#0A0A0B" };
const FALLBACK_ACCENT = { dark: "#3478E8", light: "#2457C5" };

/**
 * `useSyncExternalStore` rather than `useEffect(() => setMounted(true))`:
 * it gives `false` during SSR and `true` on the client without setting state
 * inside an effect, which avoids a cascading render during hydration.
 */
function useIsClient(): boolean {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

type Capability = "checking" | "yes" | "no";

/**
 * Capability is computed once per page load and memoised, then read through
 * `useSyncExternalStore`. Probing inside an effect and calling `setState` would
 * be a cascading render on every mount, and the answer cannot change during a
 * session anyway.
 */
let capabilityCache: "yes" | "no" | null = null;

function readCapability(): "yes" | "no" {
  if (capabilityCache !== null) return capabilityCache;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lowPerf = document.documentElement.getAttribute("data-perf") === "low";
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;

  if (reducedMotion || lowPerf || connection?.saveData === true) {
    capabilityCache = "no";
    return capabilityCache;
  }

  capabilityCache = probeWebGL() ? "yes" : "no";
  return capabilityCache;
}

/** Stable no-op subscription — the capability never changes after first read. */
function subscribeCapability() {
  return () => {};
}

function probeWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!context) return false;

    /* Release the probe context immediately — browsers cap how many live
       contexts a page may hold, and this one is only a test. */
    const lose = (context as WebGLRenderingContext).getExtension("WEBGL_lose_context");
    lose?.loseContext();

    return true;
  } catch {
    return false;
  }
}

export function HeroCanvas({ className = "" }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const isClient = useIsClient();

  const capability: Capability = React.useSyncExternalStore(
    subscribeCapability,
    readCapability,
    () => "checking"
  );

  /* Read the palette from the tokens so the 3D layer cannot drift from the UI. */
  const palette = React.useMemo(() => {
    const theme: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";

    if (!isClient) {
      return { line: FALLBACK_LINE[theme], accent: FALLBACK_ACCENT[theme] };
    }

    const styles = getComputedStyle(document.documentElement);
    return {
      line: styles.getPropertyValue("--text-1").trim() || FALLBACK_LINE[theme],
      accent: styles.getPropertyValue("--accent").trim() || FALLBACK_ACCENT[theme],
    };
  }, [isClient, resolvedTheme]);

  const shouldRender = capability === "yes";

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`.trim()} aria-hidden>
      {/*
        The static layer is always present. It is the entire experience on
        reduced-motion, low-tier and no-WebGL devices, and it is what shows for
        the frame or two before the scene resolves — so it has to be a designed
        surface, not a placeholder.
      */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, var(--ambient-blue) 0%, transparent 62%)",
        }}
      />
      <div
        className="absolute inset-0 bg-grid-fine opacity-[0.55]"
        style={{
          maskImage: "radial-gradient(85% 65% at 50% 32%, #000 0%, transparent 76%)",
          WebkitMaskImage: "radial-gradient(85% 65% at 50% 32%, #000 0%, transparent 76%)",
        }}
      />

      {shouldRender && (
        <HeroScene lineColor={palette.line} accentColor={palette.accent} motion={1} />
      )}

      {/* Fades the field into the page so the canvas never ends on a hard edge */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
      />
    </div>
  );
}
