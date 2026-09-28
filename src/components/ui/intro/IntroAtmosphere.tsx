"use client";

import { motion } from "framer-motion";
import { EASE_MAIN, type Timeline } from "./timing";
import s from "./CinematicIntro.module.css";

/**
 * The complete dark environment, laid out against a full-viewport box so a
 * matching copy can be anchored inside each shutter plane without a seam.
 */
function AtmosphereLayers({ cfg }: { cfg: Timeline | null }) {
  const t = cfg ?? null;
  return (
    <div className={s.atmo}>
      {/* deep graphite / midnight navy base — opaque from the very first paint */}
      <div className={`${s.atmoBase} `} style={{ position: "absolute", inset: 0 }} />

      {/* central cobalt atmospheric illumination */}
      <motion.div
        className={s.atmoGlow}
        style={{ position: "absolute", inset: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: t ? t.point : 0.05, duration: 0.72, ease: EASE_MAIN }}
      />

      {/* extremely faint technical grid */}
      {(!t || t.showGrid) && (
        <motion.div
          className={s.atmoGrid}
          style={{ position: "absolute", inset: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: t ? t.rails * 0.7 : 0.3, duration: 0.62, ease: EASE_MAIN }}
        />
      )}

      {/* tiny premium grain */}
      {(!t || t.showNoise) && (
        <motion.div
          className={s.atmoNoise}
          style={{ position: "absolute", inset: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.045 }}
          transition={{ delay: 0.34, duration: 0.7, ease: EASE_MAIN }}
        />
      )}

      {/* one restrained crimson reflection, far from the wordmark */}
      {t?.showCrimson && (
        <motion.div
          className={s.atmoRed}
          style={{ position: "absolute", inset: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: t.coord, duration: 0.9, ease: EASE_MAIN }}
        />
      )}

      {/* almost invisible vignette */}
      <div className={s.atmoVignette} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}

/**
 * Two large visual planes. The website is already rendered behind the intro;
 * the planes physically slide apart so the real site is *revealed* rather
 * than faded in.
 */
export function ShutterPlanes({ cfg }: { cfg: Timeline | null }) {
  const transition = {
    duration: cfg ? cfg.shutterDur : 0.6,
    delay: cfg ? cfg.shutter : 0,
    ease: EASE_MAIN,
  };
  const edgeTransition = {
    duration: cfg ? cfg.shutterDur * 0.5 : 0.3,
    delay: cfg ? cfg.shutter : 0,
    ease: EASE_MAIN,
  };

  // Until the timeline exists the planes simply sit closed and opaque — that
  // keeps the website covered from the very first paint, with no flash.
  return (
    <>
      <motion.div
        className={`${s.plane} ${s.planeTop}`}
        aria-hidden="true"
        initial={{ y: "0%" }}
        animate={{ y: cfg ? "-101%" : "0%" }}
        transition={transition}
      >
        <div className={s.planeInner}>
          <AtmosphereLayers cfg={cfg} />
        </div>
        <motion.div
          className={s.planeEdge}
          initial={{ opacity: 0 }}
          animate={{ opacity: cfg ? 0.85 : 0 }}
          transition={edgeTransition}
        />
      </motion.div>

      <motion.div
        className={`${s.plane} ${s.planeBottom}`}
        aria-hidden="true"
        initial={{ y: "0%" }}
        animate={{ y: cfg ? "101%" : "0%" }}
        transition={transition}
      >
        <div className={s.planeInner}>
          <AtmosphereLayers cfg={cfg} />
        </div>
        <motion.div
          className={s.planeEdge}
          initial={{ opacity: 0 }}
          animate={{ opacity: cfg ? 0.85 : 0 }}
          transition={edgeTransition}
        />
      </motion.div>
    </>
  );
}

/**
 * Frontal glow that tightens toward the wordmark as the structure releases,
 * then gives way to the shutter. Intensifies the "system aligned" moment
 * without adding another object.
 */
export function CenterGlow({ cfg }: { cfg: Timeline }) {
  const total = cfg.shutter + 0.25;
  return (
    <motion.div
      className={s.centerGlow}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 1 }}
      animate={{ opacity: [0, 1, 1.15, 0], scale: [1, 1.04, 0.9, 0.82] }}
      transition={{
        duration: total,
        times: [0, 0.14, Math.min(0.9, cfg.release / total), 1],
        ease: EASE_MAIN,
      }}
    />
  );
}
