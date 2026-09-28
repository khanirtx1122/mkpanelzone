/**
 * MK PANEL ZONE — signature intro timing system.
 *
 * All values are in SECONDS (framer-motion timebase). The sequence is
 * phase-driven: every cue is defined once here so the choreography stays
 * coherent and maintainable instead of being scattered through the DOM.
 *
 * Tiers:
 *  - full    : complete 4.0–4.4s brand film (desktop) / ~3.6–4.0s (mobile)
 *  - lite    : same visual story, fewer/cheaper layers for weak devices
 *  - reduced : prefers-reduced-motion — ~0.8s signal → masked reveal → shutter
 *
 * Easing is limited to three premium curves. No bounce, no elastic.
 */

export const EASE_MAIN: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_ALT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_LOCK: [number, number, number, number] = [0.25, 0.8, 0.25, 1];

export type Tier = "full" | "lite" | "reduced";

export interface Timeline {
  tier: Tier;
  reduced: boolean;
  mobile: boolean;

  /** number of masked typographic slices used for "PANEL ZONE" */
  zoneSlices: number;

  /* which material layers are enabled for this tier */
  showGrid: boolean;
  showNoise: boolean;
  showBloom: boolean;
  showCrimson: boolean;
  showMicroMarks: boolean;
  showLightPass: boolean;

  /* phase cues */
  point: number;
  pointDur: number;
  bloomDur: number;
  signal: number;
  signalDur: number;
  coord: number;
  coordDur: number;
  rails: number;
  railsDur: number;
  vrail: number;
  mk: number;
  mkDur: number;
  zone: number;
  zoneDur: number;
  lock: number;
  lockDur: number;
  sigLine: number;
  sigLineDur: number;
  sigDot: number;
  sigDotDur: number;
  light: number;
  lightDur: number;
  crimson: number;
  descriptor: number;
  descriptorDur: number;
  status: number;
  statusDur: number;
  release: number;
  releaseDur: number;
  exit: number;
  exitDur: number;
  shutter: number;
  shutterDur: number;
  unmount: number;
}

/* ------------------------------------------------------------------ *
 * Base cue sheet — desktop "full" tier (milliseconds)
 * ------------------------------------------------------------------ */
const CUE = {
  point: 70, // razor-sharp cobalt energy point
  signal: 150, // 1px signal fires across the central axis
  coord: 250, // micro alignment points acquire the wordmark area
  rails: 545, // structural rails draw outward from center
  vrail: 645, // tiny vertical rail connects momentarily
  mk: 880, // MK letter engineering
  zone: 1235, // PANEL ZONE typographic build (overlaps MK)
  lock: 2080, // optical alignment lock (settles as the last slice lands)
  sigLine: 2190, // cobalt signature line
  sigDot: 2620, // bright point travels to the end of the line
  light: 2400, // polished light pass
  crimson: 2770, // micro crimson edge reflection (~70% of the light pass)
  descriptor: 2600, // brand descriptor
  status: 2760, // micro system signature
  release: 3260, // structural release
  exit: 3440, // wordmark masked exit
  shutter: 3500, // digital shutter opens onto the real website
  unmount: 4260,
} as const;

const DUR = {
  point: 0.34,
  bloom: 0.62,
  signal: 0.24,
  coord: 0.3,
  rails: 0.44,
  mk: 0.66,
  zone: 0.78,
  lock: 0.42,
  sigLine: 0.44,
  sigDot: 0.24,
  light: 0.52,
  descriptor: 0.44,
  status: 0.36,
  release: 0.38,
  exit: 0.64,
  shutter: 0.74,
} as const;

function scale(ms: number, k: number): number {
  return Math.round((ms * k) / 10) / 100; // ms -> s, 10ms precision
}

function dur(sec: number, k: number): number {
  return Math.round(sec * k * 1000) / 1000;
}

export function buildTimeline(tier: Tier, mobile: boolean): Timeline {
  if (tier === "reduced") return buildReduced(mobile);

  const lite = tier === "lite";
  // Mobile is individually tuned (a little tighter, never longer than desktop).
  const k = lite ? 0.64 : mobile ? 0.88 : 1;
  const dk = lite ? 0.76 : mobile ? 0.92 : 1;

  return {
    tier,
    reduced: false,
    mobile,
    zoneSlices: lite ? 4 : mobile ? 4 : 6,
    showGrid: !lite,
    showNoise: !lite,
    showBloom: !lite,
    showCrimson: !lite,
    showMicroMarks: !mobile && !lite,
    showLightPass: !lite,

    point: scale(CUE.point, k),
    pointDur: dur(DUR.point, dk),
    bloomDur: dur(DUR.bloom, dk),
    signal: scale(CUE.signal, k),
    signalDur: dur(DUR.signal, dk),
    coord: scale(CUE.coord, k),
    coordDur: dur(DUR.coord, dk),
    rails: scale(CUE.rails, k),
    railsDur: dur(DUR.rails, dk),
    vrail: scale(CUE.vrail, k),
    mk: scale(CUE.mk, k),
    mkDur: dur(DUR.mk, dk),
    zone: scale(CUE.zone, k),
    zoneDur: dur(DUR.zone, dk),
    lock: scale(CUE.lock, k),
    lockDur: dur(DUR.lock, dk),
    sigLine: scale(CUE.sigLine, k),
    sigLineDur: dur(DUR.sigLine, dk),
    sigDot: scale(CUE.sigDot, k),
    sigDotDur: dur(DUR.sigDot, dk),
    light: scale(CUE.light, k),
    lightDur: dur(DUR.light, dk),
    crimson: scale(CUE.crimson, k),
    descriptor: scale(CUE.descriptor, k),
    descriptorDur: dur(DUR.descriptor, dk),
    status: scale(CUE.status, k),
    statusDur: dur(DUR.status, dk),
    release: scale(CUE.release, k),
    releaseDur: dur(DUR.release, dk),
    exit: scale(CUE.exit, k),
    exitDur: dur(DUR.exit, dk),
    shutter: scale(CUE.shutter, k),
    shutterDur: dur(DUR.shutter, k),
    unmount: scale(CUE.unmount, k),
  };
}

/**
 * Reduced-motion variant: still structural motion (signal + masked wipe +
 * split shutter) so it never degrades into a plain fade, but ~0.8s total.
 */
function buildReduced(mobile: boolean): Timeline {
  const k = mobile ? 0.94 : 1;
  return {
    tier: "reduced",
    reduced: true,
    mobile,
    zoneSlices: 1,
    showGrid: false,
    showNoise: false,
    showBloom: false,
    showCrimson: false,
    showMicroMarks: false,
    showLightPass: false,

    point: scale(20, k),
    pointDur: 0.16,
    bloomDur: 0.2,
    signal: scale(40, k),
    signalDur: 0.16,
    coord: scale(80, k),
    coordDur: 0.16,
    rails: scale(80, k),
    railsDur: 0.2,
    vrail: scale(100, k),
    mk: scale(130, k),
    mkDur: 0.3,
    zone: scale(130, k),
    zoneDur: 0.3,
    lock: scale(330, k),
    lockDur: 0.16,
    sigLine: scale(320, k),
    sigLineDur: 0.2,
    sigDot: scale(400, k),
    sigDotDur: 0.12,
    light: scale(400, k),
    lightDur: 0.16,
    crimson: scale(420, k),
    descriptor: scale(340, k),
    descriptorDur: 0.2,
    status: scale(360, k),
    statusDur: 0.18,
    release: scale(420, k),
    releaseDur: 0.16,
    exit: scale(430, k),
    exitDur: 0.26,
    shutter: scale(440, k),
    shutterDur: 0.34,
    unmount: scale(830, k),
  };
}
