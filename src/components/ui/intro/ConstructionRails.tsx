"use client";

import { motion } from "framer-motion";
import { EASE_ALT, EASE_LOCK, EASE_MAIN, type Timeline } from "./timing";
import s from "./CinematicIntro.module.css";

/* ------------------------------------------------------------------ *
 * Phase 01 — SIGNAL WAKE
 * A razor-sharp cobalt point, a restrained bloom, then a 1px signal
 * fired across the wordmark's central axis. Anchored to the brand frame
 * so it always reads as part of the lockup.
 * ------------------------------------------------------------------ */
export function SignalLayer({ cfg }: { cfg: Timeline }) {
  // Expressed as fractions of the tier's own window so the choreography holds
  // at any speed (full / lite / reduced) instead of depending on raw seconds.
  const window = Math.max(cfg.lock - cfg.signal, cfg.signalDur * 3);
  const holdAt = window * 0.74;
  const total = holdAt + Math.max(window * 0.22, cfg.signalDur);
  const times = [0, cfg.signalDur / total, holdAt / total, 1];
  const pointTotal = Math.max(cfg.lock - cfg.point, cfg.signalDur * 4);

  return (
    <div className={s.signalWrap} aria-hidden="true">
      <motion.div
        className={s.signalAxis}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: [0, 1, 1, 0.06], opacity: [0, 1, 1, 0] }}
        transition={{
          duration: total,
          delay: cfg.signal,
          times,
          ease: EASE_LOCK,
        }}
        style={{ transformOrigin: "50% 50%" }}
      />

      <div className={s.pointWrap}>
        {cfg.showBloom && (
          <motion.div
            className={s.energyBloom}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 1.05, 1.4], opacity: [0, 0.85, 0] }}
            transition={{ duration: cfg.bloomDur, delay: cfg.point, ease: EASE_MAIN, times: [0, 0.42, 1] }}
          />
        )}
        <motion.div
          className={s.energyPoint}
          initial={{ scale: 0.24, opacity: 0 }}
          animate={{ scale: [0.24, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: pointTotal,
            delay: cfg.point,
            times: [0, cfg.pointDur / pointTotal, 0.74, 1],
            ease: EASE_LOCK,
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Keyframe helper — keeps a value pinned until its entrance, then holds
 * it, then releases it. Used so the structure can slide outward during
 * the release phase while sharing one timing axis.
 * ------------------------------------------------------------------ */
function cue(
  enterAt: number,
  enterDur: number,
  releaseAt: number,
  releaseDur: number,
  from: number,
  settled: number,
  exitTo: number
): { values: number[]; times: number[] } {
  const total = Math.max(releaseAt + releaseDur, enterAt + enterDur + 0.001);
  const times = [0, enterAt / total, (enterAt + enterDur) / total, releaseAt / total, 1];
  for (let i = 1; i < times.length; i++) {
    if (times[i] <= times[i - 1]) times[i] = Math.min(1, times[i - 1] + 0.0001);
  }
  return { values: [from, from, settled, settled, exitTo], times };
}

const BRACKETS = [
  { cls: "bracketTl", from: "inset(0% 100% 100% 0%)", dx: -7, dy: -7, d: 0 },
  { cls: "bracketTr", from: "inset(0% 0% 100% 100%)", dx: 7, dy: -7, d: 0.05 },
  { cls: "bracketBl", from: "inset(100% 100% 0% 0%)", dx: -7, dy: 7, d: 0.1 },
  { cls: "bracketBr", from: "inset(100% 0% 0% 100%)", dx: 7, dy: 7, d: 0.15 },
] as const;

const MICRO = [
  { cls: "microTl", from: "inset(0% 0% 100% 0%)", dx: -6, dy: -7 },
  { cls: "microTr", from: "inset(100% 0% 0% 0%)", dx: 6, dy: -7 },
  { cls: "microBl", from: "inset(0% 0% 100% 0%)", dx: -6, dy: 7 },
  { cls: "microBr", from: "inset(100% 0% 0% 0%)", dx: 6, dy: 7 },
] as const;

/* ------------------------------------------------------------------ *
 * Phase 02 + 03 — COORDINATE ACQUISITION & STRUCTURAL RAILS
 * Registration marks enter from four different directions by a few px.
 * Two interrupted rails draw outward from the centre, plus one tiny
 * vertical rail that connects momentarily. ~85% of the screen stays
 * empty: the negative space is part of the design.
 * ------------------------------------------------------------------ */
export function ConstructionRails({ cfg }: { cfg: Timeline }) {
  const topScale = cue(cfg.rails, cfg.railsDur, cfg.release, cfg.releaseDur, 0, 1, 1);
  const topY = cue(cfg.rails, cfg.railsDur, cfg.release, cfg.releaseDur, 0, 0, -13);
  const botL = cue(cfg.rails + 0.06, cfg.railsDur, cfg.release, cfg.releaseDur, 0, 1, 0);
  const botLX = cue(cfg.rails + 0.06, cfg.railsDur, cfg.release, cfg.releaseDur, 0, 0, -15);
  const botRX = cue(cfg.rails + 0.06, cfg.railsDur, cfg.release, cfg.releaseDur, 0, 0, 15);
  const botY = cue(cfg.rails + 0.06, cfg.railsDur, cfg.release, cfg.releaseDur, 0, 0, 13);
  const tickY = cue(cfg.rails + 0.14, cfg.railsDur * 0.6, cfg.release, cfg.releaseDur, 0, 0, -9);

  return (
    <motion.div
      className={s.rails}
      aria-hidden="true"
      initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
      animate={{
        clipPath: [
          "inset(0% 0% 0% 0%)",
          "inset(0% 0% 0% 0%)",
          "inset(0% 49.4% 0% 49.4%)",
        ],
      }}
      transition={{
        duration: cfg.release + cfg.releaseDur,
        times: [0, cfg.release / (cfg.release + cfg.releaseDur), 1],
        ease: EASE_MAIN,
      }}
    >
      {/* top rail — draws outward from the centre */}
      <motion.div
        className={s.railTop}
        initial={{ scaleX: 0, y: 0 }}
        animate={{ scaleX: topScale.values, y: topY.values }}
        transition={{ duration: cfg.release + cfg.releaseDur, times: topScale.times, ease: EASE_ALT }}
      />
      <motion.div
        className={s.railTick}
        initial={{ scaleY: 0, y: 0 }}
        animate={{ scaleY: [0, 0, 1, 1, 1], y: tickY.values }}
        transition={{ duration: cfg.release + cfg.releaseDur, times: tickY.times, ease: EASE_ALT }}
      />

      {/* bottom rail — two interrupted segments, drawing outward opposite */}
      <motion.div
        className={s.railBottomLeft}
        initial={{ scaleX: 0, x: 0, y: 0 }}
        animate={{ scaleX: botL.values, x: botLX.values, y: botY.values }}
        transition={{ duration: cfg.release + cfg.releaseDur, times: botL.times, ease: EASE_ALT }}
      />
      <motion.div
        className={s.railBottomRight}
        initial={{ scaleX: 0, x: 0, y: 0 }}
        animate={{ scaleX: botL.values, x: botRX.values, y: botY.values }}
        transition={{ duration: cfg.release + cfg.releaseDur, times: botL.times, ease: EASE_ALT }}
      />

      {/* one tiny vertical rail, connected momentarily */}
      <motion.div
        className={s.railV}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
        transition={{
          duration: Math.max(cfg.zone - cfg.vrail, 0.3),
          delay: cfg.vrail,
          times: [0, 0.26, 0.6, 1],
          ease: EASE_ALT,
        }}
      />

      {/* corner registration brackets */}
      {BRACKETS.map((b) => (
        <motion.div
          key={b.cls}
          className={`${s.bracket} ${s[b.cls]}`}
          initial={{ clipPath: b.from, x: b.dx, y: b.dy }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)", x: 0, y: 0 }}
          transition={{ duration: cfg.coordDur, delay: cfg.coord + b.d, ease: EASE_ALT }}
        />
      ))}

      {/* micro coordinate acquisition marks */}
      {cfg.showMicroMarks &&
        MICRO.map((m, i) => (
          <motion.div
            key={m.cls}
            className={`${s.micro} ${s.microV} ${s[m.cls]}`}
            initial={{ clipPath: m.from, x: m.dx, y: m.dy }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)", x: 0, y: 0 }}
            transition={{ duration: cfg.coordDur, delay: cfg.coord + 0.08 + i * 0.05, ease: EASE_ALT }}
          />
        ))}
    </motion.div>
  );
}
