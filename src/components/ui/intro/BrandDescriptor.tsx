"use client";

import { motion } from "framer-motion";
import { EASE_ALT, EASE_LOCK, EASE_MAIN, type Timeline } from "./timing";
import s from "./CinematicIntro.module.css";

const DESCRIPTOR = "PREMIUM DIGITAL PLATFORM";
const STATUS = "PLATFORM ONLINE";

/**
 * Phase 09 — BRAND DESCRIPTOR
 * Vertical clipping + tracking compression, never a plain fade. Deliberately
 * quiet: it should carry roughly a fifth of the attention the mark carries.
 */
export function BrandDescriptor({ cfg }: { cfg: Timeline }) {
  return (
    <div className={s.descriptor} aria-hidden="true">
      <span className={s.descriptorMask}>
        {/* sizer pins the mask width at the final optical tracking */}
        <span style={{ visibility: "hidden", letterSpacing: "0.24em" }}>{DESCRIPTOR}</span>
        <span className={s.descriptorCenter}>
          <motion.span
            className={s.descriptorText}
            style={{ letterSpacing: "0.34em" }}
            initial={{ y: "118%", letterSpacing: "0.34em" }}
            animate={{ y: "0%", letterSpacing: "0.24em" }}
            transition={{ duration: cfg.descriptorDur, delay: cfg.descriptor, ease: EASE_MAIN }}
          >
            {DESCRIPTOR}
          </motion.span>
        </span>
      </span>
    </div>
  );
}

/**
 * Phase 10 — MICRO SYSTEM SIGNATURE
 * One cobalt indicator and a low-contrast status line. No fake terminals,
 * no version numbers, no percentages.
 */
export function BrandStatus({ cfg }: { cfg: Timeline }) {
  return (
    <div className={s.status} aria-hidden="true">
      <span className={s.statusDotWrap}>
        <motion.span
          className={s.statusRing}
          initial={{ scale: 0.55, opacity: 0 }}
          animate={{ scale: [0.55, 2.6], opacity: [0.75, 0] }}
          transition={{ delay: cfg.status + 0.03, duration: 0.6, ease: EASE_MAIN, times: [0, 1] }}
        />
        <motion.span
          className={s.statusDot}
          initial={{ scale: 0.25, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: cfg.status, duration: 0.26, ease: EASE_LOCK }}
        />
      </span>
      <motion.span
        className={s.statusText}
        initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
        transition={{ delay: cfg.status + 0.06, duration: cfg.statusDur, ease: EASE_ALT }}
      >
        {STATUS}
      </motion.span>
    </div>
  );
}
