"use client";

/**
 * MK PANEL ZONE — 3D COVERFLOW GALLERY
 * ============================================================================
 * The reference coverflow motion language, adapted to MK products:
 *
 *   centre card front-facing and dominant
 *   neighbours tilted on Y (≈44°), receding in Z
 *   distance *falloff* so far cards ease out of rotation/depth instead of
 *   snapping flat
 *   shortest-path ring loop — 1→2→…→n→1 with no visible track reset and no
 *   cloned DOM seam
 *   exponential (never bouncy) settle driven by requestAnimationFrame
 *   pointer drag + flick momentum, keyboard arrows, ResizeObserver geometry
 *
 * PERFORMANCE CONTRACT (deliberately preserved):
 *   - card transforms/opacity are written straight to the DOM from the rAF
 *     loop; nothing in the motion path goes through React state
 *   - React state only holds the *active index* (caption, counter, a11y) plus
 *     the pause flags, so re-renders happen a few times per gesture at most
 *   - the rAF loop only lives while the carousel is actually moving
 *   - no WebGL, no per-card animation library, no animated blur
 *
 * Desktop and mobile run the exact same engine. Only measured values (card
 * width, spacing, rotation on very narrow screens) differ.
 */

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./CoverflowCarousel.module.css";

/* ── Slide shape ─────────────────────────────────────────────────────────── */

export type CoverflowSlide = {
  /** stable product id */
  id: string;
  /** existing product detail route */
  href: string;
  title: string;
  alt: string;
  /** platform / category eyebrow — real product data only */
  platform: string;
  category: string;
  /** one-line active-product descriptor */
  descriptor: string;
  image?: string | null;
  price?: number;
  badge?: string;
  tone?: "blue" | "red" | "neutral";
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
};

/* ── Motion reference values ─────────────────────────────────────────────── */

const MOTION = {
  /** neighbour tilt in degrees */
  rotate: 44,
  /** very narrow screens clip past ~44°, so ease to 38° (never flat) */
  rotateCompact: 38,
  /** Z recession per step, relative to card width */
  depth: 0.6,
  /** viewing distance, relative to card width */
  perspective: 3,
  /** non-linear distance falloff applied beyond the first neighbour */
  falloff: 0.56,
  /** opacity falloff weight — intentionally subtle */
  fade: 0.1,
} as const;

/** advance per step, relative to card width (slight overlap = coverflow) */
const STEP_RATIO = 0.92;
/** height / width — near-square, like the reference card */
const CARD_RATIO = 1.1;

const RADIUS_MIN = 18;
const RADIUS_MAX = 24;

/** exponential settle time constant (ms). No overshoot, no spring. */
const SETTLE_TAU_MS = 100;
const SETTLE_TAU_REDUCED_MS = 30;
const SETTLE_EPSILON = 0.0015;

const DRAG_AXIS_PX = 6;
const CLICK_SLOP_PX = 6;
/** px/ms below which a release is a plain drag, not a flick */
const FLICK_MIN_V = 0.35;
const FLICK_GAIN_MS = 140;
/** a flick may carry at most this many cards */
const FLICK_MAX_CARDS = 1.5;

const AUTOPLAY_MS = 3000;
const RESUME_AFTER_MS = 4000;
/** below this container width the neighbour tilt eases off to avoid clipping */
const COMPACT_PX = 640;

/**
 * Responsive card width, measured from the carousel's own box. Monotonic
 * breakpoints keep geometry continuous from mobile → tablet → desktop, so the
 * layout never switches to a different implementation at any width.
 */
const WIDTH_STOPS: ReadonlyArray<readonly [number, number]> = [
  [320, 158],
  [375, 176],
  [430, 192],
  [640, 208],
  [768, 226],
  [1024, 252],
  [1280, 268],
  [1440, 288],
];
const CARD_W_MIN = 150;
const CARD_W_MAX = 300;
const CARD_W_FALLBACK = 268;

function clamp(n: number, min: number, max: number) {
  return n < min ? min : n > max ? max : n;
}

function cardWidthFor(containerWidth: number) {
  const first = WIDTH_STOPS[0];
  const last = WIDTH_STOPS[WIDTH_STOPS.length - 1];
  if (containerWidth <= first[0]) return clamp(first[1], CARD_W_MIN, CARD_W_MAX);
  if (containerWidth >= last[0]) return clamp(last[1], CARD_W_MIN, CARD_W_MAX);

  for (let i = 0; i < WIDTH_STOPS.length - 1; i++) {
    const [x0, y0] = WIDTH_STOPS[i];
    const [x1, y1] = WIDTH_STOPS[i + 1];
    if (containerWidth <= x1) {
      const t = (containerWidth - x0) / (x1 - x0);
      return clamp(y0 + (y1 - y0) * t, CARD_W_MIN, CARD_W_MAX);
    }
  }
  return CARD_W_FALLBACK;
}

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function CoverflowCarousel({
  slides,
  label = "Featured products",
  autoplayMs = AUTOPLAY_MS,
}: {
  slides: CoverflowSlide[];
  label?: string;
  autoplayMs?: number;
}) {
  const count = slides.length;

  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  /** float position on the ring — the single source of motion truth */
  const positionRef = useRef(0);
  const targetRef = useRef(0);
  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const suppressClickRef = useRef(false);

  const geometryRef = useRef<{ step: number; depth: number; rotate: number }>({
    step: 184,
    depth: 120,
    rotate: MOTION.rotate,
  });
  const reducedRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hoverCapable, setHoverCapable] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [reduced, setReduced] = useState(false);

  /* ── Ring maths ──────────────────────────────────────────────────────────
     Shortest signed distance around the loop. This is what removes the
     "last → jump → first" reset: every card folds past ±n/2 and, because the
     fade mask has already taken it to zero opacity there, the fold is never
     seen. */
  const wrapDelta = useCallback(
    (delta: number) => {
      if (count <= 1) return 0;
      let d = ((delta % count) + count) % count;
      if (d > count / 2) d -= count;
      return d;
    },
    [count]
  );

  /* ── Painting ────────────────────────────────────────────────────────────
     Writes transform / opacity / stacking straight to the DOM. */
  const paint = useCallback(
    (pos: number) => {
      const { step, depth, rotate } = geometryRef.current;
      const half = count / 2;

      for (let i = 0; i < count; i++) {
        const node = cardRefs.current[i];
        if (!node) continue;

        const t = wrapDelta(i - pos);
        const at = Math.abs(t);
        const sign = t < 0 ? -1 : 1;

        /* distance falloff — beyond the first neighbour, rotation and depth
           both ease along the same non-linear curve */
        const eased = at <= 1 ? at : 1 + (at - 1) * MOTION.falloff;

        const x = sign * eased * step;
        const z = -eased * depth;
        const rotY =
          -sign *
          rotate *
          Math.min(1, at) *
          Math.pow(MOTION.falloff, Math.max(0, at - 1));

        /* opacity: subtle distance fade, then a horizon mask that reaches zero
           exactly where the ring folds */
        const horizon = clamp((half - at) / 0.75, 0, 1);
        const opacity =
          clamp(1 - Math.max(0, at - 0.2) * MOTION.fade * 2.8, 0, 1) * horizon;

        const visible = opacity > 0.012;

        node.style.transform = `translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(
          2
        )}px) rotateY(${rotY.toFixed(3)}deg)`;
        node.style.opacity = visible ? opacity.toFixed(3) : "0";
        node.style.visibility = visible ? "visible" : "hidden";
        node.style.zIndex = String(1000 - Math.round(at * 20));

        /* active emphasis, flipped only when the rounded index moves */
        const isActive = at <= 0.5;
        const flag = isActive ? "true" : "false";
        if (node.dataset.active !== flag) node.dataset.active = flag;

        /* Cards pushed past the visible fan are taken out of the tab order and
           the accessibility tree. The nearest neighbours stay interactive on
           purpose: clicking one brings it to the centre. */
        const inert = at > 1.5;
        if (node.inert !== inert) node.inert = inert;
        const ariaHidden = at > 1.5 ? "true" : "false";
        if (node.getAttribute("aria-hidden") !== ariaHidden) {
          node.setAttribute("aria-hidden", ariaHidden);
        }
      }
    },
    [count, wrapDelta]
  );

  const syncActive = useCallback(
    (pos: number) => {
      const idx = ((Math.round(pos) % count) + count) % count;
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActiveIndex(idx);
      }
    },
    [count]
  );

  /** keeps the float position away from precision loss over long sessions */
  const normalize = useCallback(() => {
    if (count <= 1) return;
    const shift = Math.round(positionRef.current / count) * count;
    if (shift !== 0) {
      positionRef.current -= shift;
      targetRef.current -= shift;
    }
  }, [count]);

  /* ── Exponential settle ───────────────────────────────────────────────────
     position += (target - position) · (1 - e^(-dt/tau)). Asymptotic: it glides
     to a stop — no overshoot, no elastic bounce. */
  const tick = useCallback(
    function frame(now: number) {
      rafRef.current = 0;
      const last = lastFrameRef.current || now;
      const dt = clamp(now - last, 1, 64);
      lastFrameRef.current = now;

      const tau = reducedRef.current ? SETTLE_TAU_REDUCED_MS : SETTLE_TAU_MS;
      const k = 1 - Math.exp(-dt / tau);

      const current = positionRef.current;
      let next = current + (targetRef.current - current) * k;
      let settled = false;
      if (Math.abs(targetRef.current - next) < SETTLE_EPSILON) {
        next = targetRef.current;
        settled = true;
      }

      positionRef.current = next;
      paint(next);

      if (settled) {
        syncActive(next);
        normalize();
        lastFrameRef.current = 0;
      } else {
        rafRef.current = requestAnimationFrame(frame);
      }
    },
    [paint, syncActive, normalize]
  );

  const start = useCallback(() => {
    if (rafRef.current) return;
    lastFrameRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    lastFrameRef.current = 0;
  }, []);

  const setTarget = useCallback(
    (value: number) => {
      targetRef.current = value;
      start();
    },
    [start]
  );

  const moveBy = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      setTarget(targetRef.current + delta);
    },
    [count, setTarget]
  );

  /* ── Geometry / measurement ─────────────────────────────────────────────
     ResizeObserver on the carousel's own box: card width, spacing, depth and
     perspective all follow the measured container, so an orientation change or
     a window resize re-lays out without a reload. */
  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const containerWidth = viewport.clientWidth || window.innerWidth || 1200;

    const width = cardWidthFor(containerWidth);
    const height = Math.round(width * CARD_RATIO);
    geometryRef.current = {
      step: Math.round(width * STEP_RATIO),
      depth: Math.round(width * MOTION.depth),
      rotate: containerWidth < COMPACT_PX ? MOTION.rotateCompact : MOTION.rotate,
    };

    /* The stage's inline style is written imperatively and never declared as a
       React style prop, so a re-render can't clobber the measured geometry. */
    const stage = stageRef.current;
    if (stage) {
      stage.style.setProperty("--cf-w", `${width}px`);
      stage.style.setProperty("--cf-h", `${height}px`);
      stage.style.setProperty(
        "--cf-perspective",
        `${Math.round(width * MOTION.perspective)}px`
      );
      stage.style.setProperty(
        "--cf-radius",
        `${clamp(Math.round(width * 0.085), RADIUS_MIN, RADIUS_MAX)}px`
      );
    }

    paint(positionRef.current);
  }, [paint]);

  useIsoLayoutEffect(() => {
    cardRefs.current.length = count;
    paint(positionRef.current);
  }, [count, paint]);

  useEffect(() => {
    measure();

    const viewport = viewportRef.current;
    let observer: ResizeObserver | null = null;
    if (viewport && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => measure());
      observer.observe(viewport);
    }
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [measure]);

  useEffect(() => stop, [stop]);

  /* ── Reduced motion / pointer capability ───────────────────────────────── */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reducedRef.current = mq.matches;
      setReduced(mq.matches);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setHoverCapable(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  }, []);

  /* ── Autoplay pause plumbing ────────────────────────────────────────────── */
  const resumeTimer = useRef<number | null>(null);

  const pauseForInteraction = useCallback(() => {
    setUserPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(
      () => setUserPaused(false),
      RESUME_AFTER_MS
    );
  }, []);

  useEffect(
    () => () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    },
    []
  );

  useEffect(() => {
    const onVisibility = () =>
      setTabVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ── Autoplay — drives the very same settle path as drag and arrows ───── */
  const autoplaying =
    count > 1 &&
    !reduced &&
    !userPaused &&
    !dragging &&
    !(hoverCapable && hovered) &&
    tabVisible &&
    inView;

  useEffect(() => {
    if (!autoplaying) return;
    const id = window.setInterval(() => moveBy(1), autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplaying, moveBy, autoplayMs]);

  /* ── Pointer drag + flick ────────────────────────────────────────────────
     Pointer Events cover mouse, trackpad and touch. `touch-action: pan-y` on
     the stage keeps vertical page scrolling native; the browser cancels the
     pointer the moment the gesture turns vertical.

     The move/up listeners live on `window` rather than the stage and no
     pointer capture is taken. Capture would retarget the trailing click to the
     stage, and then a tap on a product card would never reach its link. */
  const drag = useRef({
    active: false,
    id: -1,
    startX: 0,
    startPos: 0,
    dx: 0,
    axis: null as null | "x",
    lastX: 0,
    lastT: 0,
    moved: 0,
    v: 0,
  });

  /** stable listener identities, so attach/detach always match */
  const liveHandlers = useRef({
    move: (_event: PointerEvent) => {},
    up: (_event: PointerEvent) => {},
    cancel: (_event: PointerEvent) => {},
  });
  const proxyMove = useCallback((e: PointerEvent) => liveHandlers.current.move(e), []);
  const proxyUp = useCallback((e: PointerEvent) => liveHandlers.current.up(e), []);
  const proxyCancel = useCallback(
    (e: PointerEvent) => liveHandlers.current.cancel(e),
    []
  );

  const detachDrag = useCallback(() => {
    window.removeEventListener("pointermove", proxyMove);
    window.removeEventListener("pointerup", proxyUp);
    window.removeEventListener("pointercancel", proxyCancel);
    document.documentElement.classList.remove("cf-dragging");
  }, [proxyMove, proxyUp, proxyCancel]);

  const releaseDrag = useCallback(
    (cancelled: boolean) => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      detachDrag();
      setDragging(false);

      /** a genuine drag must never be treated as a click */
      suppressClickRef.current = d.moved > CLICK_SLOP_PX;

      const step = geometryRef.current.step || 1;
      const flicked =
        !cancelled && Math.abs(d.v) >= FLICK_MIN_V && d.moved > DRAG_AXIS_PX;
      const momentum = flicked
        ? clamp((-d.v / step) * FLICK_GAIN_MS, -FLICK_MAX_CARDS, FLICK_MAX_CARDS)
        : 0;

      const destination = Math.round(positionRef.current + momentum);
      syncActive(destination);
      setTarget(destination);
    },
    [detachDrag, setTarget, syncActive]
  );

  const onWindowMove = useCallback(
    (event: PointerEvent) => {
      const d = drag.current;
      if (!d.active || event.pointerId !== d.id) return;

      const dx = event.clientX - d.startX;
      d.dx = dx;

      if (d.axis === null) {
        /* touch gives vertical scrolling priority: only take over once the
           gesture is clearly horizontal */
        if (Math.abs(dx) < DRAG_AXIS_PX) return;
        d.axis = "x";
      }

      /* stop the drag from selecting page text while it is in flight */
      if (event.cancelable) event.preventDefault();

      d.moved = Math.max(d.moved, Math.abs(dx));

      const now = performance.now();
      const dt = Math.max(1, now - d.lastT);
      d.v = (event.clientX - d.lastX) / dt;
      d.lastX = event.clientX;
      d.lastT = now;

      const step = geometryRef.current.step || 1;
      const pos = d.startPos - dx / step;
      positionRef.current = pos;
      paint(pos);
      syncActive(pos);
    },
    [paint, syncActive]
  );

  const onWindowUp = useCallback(
    (event: PointerEvent) => {
      if (event.pointerId !== drag.current.id) return;
      releaseDrag(false);
    },
    [releaseDrag]
  );

  const onWindowCancel = useCallback(
    (event: PointerEvent) => {
      if (event.pointerId !== drag.current.id) return;
      releaseDrag(true);
    },
    [releaseDrag]
  );

  useIsoLayoutEffect(() => {
    liveHandlers.current = {
      move: onWindowMove,
      up: onWindowUp,
      cancel: onWindowCancel,
    };
  }, [onWindowMove, onWindowUp, onWindowCancel]);

  useEffect(() => detachDrag, [detachDrag]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (count <= 1) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const d = drag.current;
    d.active = true;
    d.id = event.pointerId;
    d.startX = event.clientX;
    d.startPos = positionRef.current;
    d.dx = 0;
    d.axis = null;
    d.lastX = event.clientX;
    d.lastT = performance.now();
    d.moved = 0;
    d.v = 0;

    suppressClickRef.current = false;
    stop();
    setDragging(true);
    pauseForInteraction();
    document.documentElement.classList.add("cf-dragging");

    window.addEventListener("pointermove", proxyMove, { passive: false });
    window.addEventListener("pointerup", proxyUp);
    window.addEventListener("pointercancel", proxyCancel);
  };

  /* ── Keyboard ───────────────────────────────────────────────────────────── */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      pauseForInteraction();
      moveBy(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      pauseForInteraction();
      moveBy(-1);
    }
  };

  /* ── Card activation: centre it, or open the product it centres ───────── */
  const onCardActivate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    index: number
  ) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      suppressClickRef.current = false;
      return;
    }
    const t = wrapDelta(index - positionRef.current);
    if (Math.abs(t) > 0.5) {
      // a side card comes to the centre first — never navigate while tilted
      event.preventDefault();
      pauseForInteraction();
      setTarget(Math.round(positionRef.current + t));
    }
  };

  const active = slides[activeIndex] ?? slides[0];
  const showNav = count > 1;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={() => hoverCapable && setHovered(true)}
      onPointerLeave={() => hoverCapable && setHovered(false)}
    >
      {/* ── Stage ── */}
      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.atmosphere} aria-hidden />
        <div
          ref={stageRef}
          className={styles.stage}
          data-dragging={dragging ? "true" : "false"}
          onPointerDown={onPointerDown}
        >
          <div className={styles.floor} aria-hidden />

          {slides.map((slide, i) => {
            const Icon = slide.icon;
            return (
              <div
                key={slide.id}
                ref={(node) => {
                  cardRefs.current[i] = node;
                }}
                className={styles.card}
                data-tone={slide.tone ?? "blue"}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
              >
                <div className={styles.cardInner}>
                  {slide.image ? (
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      draggable={false}
                      className={styles.img}
                      sizes="(max-width: 640px) 60vw, (max-width: 1024px) 32vw, 24vw"
                      loading={Math.abs(i - activeIndex) <= 1 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div className={styles.imgFallback} aria-hidden>
                      {Icon ? <Icon size={40} /> : null}
                    </div>
                  )}

                  <span className={styles.scrim} aria-hidden />
                  <span className={styles.platform}>{slide.platform}</span>

                  {slide.badge ? (
                    <span className={styles.badge} data-tone={slide.tone ?? "blue"}>
                      {slide.badge}
                    </span>
                  ) : null}

                  <Link
                    href={slide.href}
                    className={styles.cardLink}
                    onClick={(event) => onCardActivate(event, i)}
                    draggable={false}
                    aria-label={`${slide.title}${
                      slide.price != null
                        ? ` — PKR ${slide.price.toLocaleString("en-US")}`
                        : ""
                    }`}
                  >
                    <span className={styles.cardCaption}>
                      <span className={styles.cardName}>{slide.title}</span>
                      {slide.price != null ? (
                        <span className={styles.cardPrice}>
                          PKR {slide.price.toLocaleString("en-US")}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active product caption ── */}
      <div className={styles.captionWrap} aria-live="polite">
        <div key={activeIndex} className={styles.caption}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowPlatform}>{active.platform}</span>
            <span className={styles.eyebrowSep} aria-hidden />
            {active.category}
          </p>
          <h3 className={styles.captionTitle}>
            <Link href={active.href} className={styles.captionLink}>
              {active.title}
            </Link>
          </h3>
          {active.price != null ? (
            <p className={styles.captionPrice}>
              PKR {active.price.toLocaleString("en-US")}
            </p>
          ) : null}
          <p className={styles.captionDesc}>{active.descriptor}</p>
        </div>
      </div>

      {/* ── HUD: counter + autoplay rail + compact arrows ── */}
      {showNav ? (
        <div className={styles.hud}>
          <div className={styles.hudProgress}>
            <span className={styles.counter} aria-hidden>
              <span className={styles.counterStrong}>
                {String(activeIndex + 1).padStart(2, "0")}
              </span>
              <span className={styles.counterDim}>
                {" / "}
                {String(count).padStart(2, "0")}
              </span>
            </span>
            <span className={styles.railTrack} aria-hidden>
              <span
                key={`${activeIndex}-${autoplaying ? "run" : "hold"}`}
                className={styles.railFill}
                style={{
                  animationDuration: `${autoplayMs}ms`,
                  animationPlayState: autoplaying ? "running" : "paused",
                }}
              />
            </span>
          </div>

          <div className={styles.hudNav}>
            <button
              type="button"
              onClick={() => {
                pauseForInteraction();
                moveBy(-1);
              }}
              aria-label="Previous product"
              className={`${styles.arrow} tap-flat`}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => {
                pauseForInteraction();
                moveBy(1);
              }}
              aria-label="Next product"
              className={`${styles.arrow} tap-flat`}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
