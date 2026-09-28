"use client";

import { motion } from "framer-motion";
import { EASE_MAIN } from "./timing";
import s from "./CinematicIntro.module.css";

export interface SliceSpec {
  /** band left edge, as a % of the word box */
  l: number;
  /** band right edge, as a % of the word box */
  r: number;
  /** optional band top edge (default 0) */
  t?: number;
  /** optional band bottom edge (default 100) */
  b?: number;
  /** entry offset in px — kept small, precision over drama */
  dx?: number;
  dy?: number;
  /** entry delay and duration, in seconds */
  delay: number;
  dur: number;
  /** "x" wipes the band open from its left edge, "y" from its top edge */
  wipe?: "x" | "y";
  blur?: number;
  ease?: [number, number, number, number];
}

interface SlicedWordProps {
  text: string;
  slices: SliceSpec[];
  className?: string;
  /**
   * Tracking compression. The value is animated on the word box so every
   * slice inherits the exact same spacing at every frame — that keeps the
   * fragments coherent while they settle.
   */
  tracking?: { from: string; to: string; delay: number; dur: number };
}

function bandClip(sl: SliceSpec, from: boolean): string {
  const t = sl.t ?? 0;
  const b = sl.b ?? 100;
  if (from) {
    // collapsed band, still expressed as a full 4-value inset so the
    // interpolation template never changes
    return sl.wipe === "y"
      ? `inset(${t}% ${100 - sl.r}% ${100 - t}% ${sl.l}%)`
      : `inset(${t}% ${100 - sl.l}% ${100 - b}% ${sl.l}%)`;
  }
  return `inset(${t}% ${100 - sl.r}% ${100 - b}% ${sl.l}%)`;
}

/**
 * Renders a word as N identical copies, each clipped to a horizontal (or
 * rectangular) band. Because every copy carries the same glyphs at the same
 * tracking, the union of the bands is always the intact word — so the
 * fragments genuinely *assemble* instead of cross-fading.
 */
export function SlicedWord({ text, slices, className, tracking }: SlicedWordProps) {
  // A constant tracking value just pins the box; only a real change animates.
  const animatesTracking = !!tracking && tracking.from !== tracking.to;
  const finalTracking = tracking ? tracking.to : undefined;

  return (
    <motion.span
      className={[s.word, className].filter(Boolean).join(" ")}
      style={finalTracking ? { letterSpacing: finalTracking } : undefined}
      initial={animatesTracking && tracking ? { letterSpacing: tracking.from } : undefined}
      animate={animatesTracking && tracking ? { letterSpacing: tracking.to } : undefined}
      transition={
        animatesTracking && tracking
          ? { delay: tracking.delay, duration: tracking.dur, ease: EASE_MAIN }
          : undefined
      }
      aria-hidden="true"
    >
      {/* invisible sizer pins the box width at the FINAL optical spacing so
          the composition never reflows while tracking compresses */}
      <span className={s.wordSizer} style={finalTracking ? { letterSpacing: finalTracking } : undefined}>
        {text}
      </span>

      {slices.map((sl, i) => (
        <span key={i} className={s.wordSliceWrap}>
          <motion.span
            className={s.wordSlice}
            style={{ clipPath: bandClip(sl, true) }}
            initial={{
              x: sl.dx ?? 0,
              y: sl.dy ?? 0,
              clipPath: bandClip(sl, true),
              filter: sl.blur ? `blur(${sl.blur}px)` : "blur(0px)",
            }}
            animate={{
              x: 0,
              y: 0,
              clipPath: bandClip(sl, false),
              filter: "blur(0px)",
            }}
            transition={{
              duration: sl.dur,
              delay: sl.delay,
              ease: sl.ease ?? EASE_MAIN,
            }}
          >
            {text}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
