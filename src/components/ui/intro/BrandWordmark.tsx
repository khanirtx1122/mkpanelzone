"use client";

import { motion } from "framer-motion";
import { EASE_ALT, EASE_LOCK, EASE_MAIN, type Timeline } from "./timing";
import { SlicedWord, type SliceSpec } from "./SlicedWord";
import { ConstructionRails, SignalLayer } from "./ConstructionRails";
import s from "./CinematicIntro.module.css";

const MK_TRACKING = "0.022em";
// Wide enough to read as a real tracking settle, tight enough that the widest
// frame never reaches the viewport edge even at 320px.
const ZONE_TRACKING_FROM = "0.16em";
const ZONE_TRACKING_TO = "0.045em";

/**
 * Phase 04 — MK LETTER ENGINEERING
 * M and K are handled as separate glyph boxes so each sliced band maps to a
 * real stroke group: the left stem rises, the opposite stem descends, the
 * diagonals converge, and the K spine reveals through a vertical mask while
 * its diagonals arrive from upper-right and lower-right.
 */
function mkSlices(cfg: Timeline) {
  if (cfg.reduced) {
    return {
      m: [{ l: 0, r: 100, delay: cfg.mk, dur: cfg.mkDur, wipe: "x" as const }],
      k: [{ l: 0, r: 100, delay: cfg.mk + 0.05, dur: cfg.mkDur, wipe: "x" as const }],
    };
  }
  const d = cfg.mk;
  const u = cfg.mkDur;
  const m: SliceSpec[] = [
    { l: 0, r: 19, dx: 0, dy: 26, delay: d, dur: u * 0.78, wipe: "y", ease: EASE_ALT },
    { l: 19, r: 50, dx: 15, dy: 7, delay: d + 0.07, dur: u * 0.8, ease: EASE_MAIN },
    { l: 50, r: 81, dx: -15, dy: 7, delay: d + 0.12, dur: u * 0.8, ease: EASE_MAIN },
    { l: 81, r: 100, dx: 0, dy: -22, delay: d + 0.05, dur: u * 0.78, wipe: "y", ease: EASE_ALT },
  ];
  const k: SliceSpec[] = [
    { l: 0, r: 28, dx: 0, dy: 10, delay: d + 0.09, dur: u * 0.7, wipe: "y", ease: EASE_ALT },
    { l: 28, r: 100, t: 0, b: 50, dx: 21, dy: -12, delay: d + 0.14, dur: u * 0.78, ease: EASE_ALT },
    { l: 28, r: 100, t: 50, b: 100, dx: 21, dy: 12, delay: d + 0.2, dur: u * 0.78, ease: EASE_ALT },
  ];
  return { m, k };
}

/**
 * Phase 05 — PANEL ZONE TYPOGRAPHIC BUILD
 * A different animation language from MK: controlled vertical slices, each
 * entering through a clip mask with a few px of travel, a touch of start
 * blur, and a shared tracking compression so the slices can never drift
 * out of register.
 */
function zoneSlices(cfg: Timeline): SliceSpec[] {
  const n = cfg.zoneSlices;
  const out: SliceSpec[] = [];
  for (let i = 0; i < n; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    out.push({
      l: (i * 100) / n,
      r: ((i + 1) * 100) / n,
      dx: n === 1 ? 0 : dir * (10 + (i % 3) * 3),
      dy: n === 1 ? 0 : dir * 4,
      delay: cfg.zone + i * (cfg.reduced ? 0.06 : 0.04),
      dur: cfg.zoneDur * (n === 1 ? 1 : 0.86),
      wipe: "x",
      blur: cfg.reduced ? 0 : 2.5,
      ease: EASE_MAIN,
    });
  }
  return out;
}

export function BrandWordmark({ cfg }: { cfg: Timeline }) {
  const { m, k } = mkSlices(cfg);
  const zone = zoneSlices(cfg);

  // signature line: draw, hold through the lock, retract slightly on release
  const total = cfg.release + cfg.releaseDur;
  const t1 = cfg.sigLine / total;
  const t2 = (cfg.sigLine + cfg.sigLineDur) / total;
  const t3 = cfg.release / total;
  const lineTimes = [0, t1, t2, t3, 1];
  const lineValues = [0, 1, 1, 1, 0.8];

  return (
    <div className={s.frame}>
      {/* signal + coordinates + rails live behind the wordmark */}
      <SignalLayer cfg={cfg} />
      {!cfg.reduced && <ConstructionRails cfg={cfg} />}
      <div className={s.rows}>
        <span className={s.mkGroup}>
          <SlicedWord text="M" slices={m} tracking={{ from: MK_TRACKING, to: MK_TRACKING, delay: 0, dur: 0 }} />
          <SlicedWord text="K" slices={k} tracking={{ from: MK_TRACKING, to: MK_TRACKING, delay: 0, dur: 0 }} />
        </span>
        <SlicedWord
          text="PANEL ZONE"
          slices={zone}
          tracking={{
            from: cfg.reduced ? ZONE_TRACKING_TO : ZONE_TRACKING_FROM,
            to: ZONE_TRACKING_TO,
            delay: cfg.zone + 0.02,
            dur: cfg.zoneDur * 0.92,
          }}
        />

        {/* Phase 08 — optical light pass (blends only inside the wordmark group) */}
        {cfg.showLightPass && (
          <div className={s.lightWrap} aria-hidden="true">
            <motion.div
              className={s.lightBand}
              initial={{ x: "-190%" }}
              animate={{ x: "540%" }}
              transition={{ delay: cfg.light, duration: cfg.lightDur, ease: EASE_ALT }}
            />
            <motion.div
              className={s.crimsonEdge}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0] }}
              transition={{ delay: cfg.crimson, duration: 0.16, ease: EASE_MAIN, times: [0, 0.4, 1] }}
            />
          </div>
        )}
      </div>

      {/* Phase 07 — cobalt signature line under MK and part of PANEL ZONE */}
      {!cfg.reduced && (
        <div className={s.sigTrack} aria-hidden="true">
          <motion.div
            className={s.sigLineGlow}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: lineValues }}
            transition={{ duration: total, times: lineTimes, ease: EASE_MAIN }}
          />
          <motion.div
            className={s.sigLine}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: lineValues }}
            transition={{ duration: total, times: lineTimes, ease: EASE_MAIN }}
          />
          <motion.div
            className={s.sigDot}
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: "52%", opacity: [0, 1, 1, 0] }}
            transition={{
              left: { delay: cfg.sigDot, duration: cfg.sigDotDur, ease: EASE_LOCK },
              opacity: { delay: cfg.sigDot, duration: cfg.sigDotDur, ease: EASE_MAIN, times: [0, 0.12, 0.72, 1] },
            }}
          />
        </div>
      )}
    </div>
  );
}
