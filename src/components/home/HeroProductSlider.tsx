"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Shield,
  Crown,
  Calendar,
  Clock,
  Package,
  Headset,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { productContent } from "@/lib/productContent";
import type { Product } from "@/components/ui/ProductCard";
import styles from "./HeroProductSlider.module.css";

const COPIES = 3;
const AUTOPLAY_MS = 3000;
const RESUME_AFTER_INTERACTION_MS = 4000;
const DRAG_COMMIT_PX = 42;

function getMeta(slug: string) {
  let badge = "PREMIUM";
  let isCrimson = false;

  if (slug.includes("lifetime")) {
    badge = "BEST SELLER";
    isCrimson = true;
  } else if (slug.includes("3-months")) {
    badge = "BEST VALUE";
  } else if (slug.includes("weekly")) {
    badge = "TRIAL";
  } else if (slug.includes("setup") || slug.includes("support")) {
    badge = "ADD-ON";
  }

  let Icon = Shield;
  if (slug.includes("3-months")) Icon = Crown;
  else if (slug.includes("monthly")) Icon = Calendar;
  else if (slug.includes("weekly")) Icon = Clock;
  else if (slug.includes("setup")) Icon = Package;
  else if (slug.includes("support")) Icon = Headset;

  return { badge, Icon, isCrimson };
}

/**
 * Presentation-only excerpt: strips markdown/emoji noise from the raw
 * description so the hero reads editorially. The product record itself
 * is never modified — full details stay on the Product Detail page.
 */
function excerpt(text?: string) {
  if (!text) return "Premium digital product and access.";
  const cleaned = text
    .replace(/\*\*/g, "")
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= 150) return cleaned;
  const cut = cleaned.slice(0, 150);
  const lastDot = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"));
  if (lastDot > 60) return cut.slice(0, lastDot + 1);
  return cut.replace(/\s+\S*$/, "") + "…";
}

export function HeroProductSlider({ products }: { products: Product[] }) {
  const baseProducts = useMemo(() => (products.length > 0 ? products.slice(0, 5) : []), [products]);
  const count = baseProducts.length;

  // Three identical sets. Index starts in the middle set and rewinds by one set
  // whenever it leaves it — visually identical frame, so the loop never jumps.
  const slides = useMemo(
    () => (count > 0 ? Array.from({ length: COPIES }, () => baseProducts).flat() : []),
    [baseProducts, count]
  );

  const [index, setIndex] = useState(count);
  const [animating, setAnimating] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  /** True right after an invisible loop rewind: the corrected slide is the
   *  same product the user is already looking at, so it must NOT replay the
   *  entrance animation (that would reveal the seam). */
  const [suppressEnter, setSuppressEnter] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<number | null>(null);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragDx = useRef(0);
  const axisLocked = useRef<"x" | "y" | null>(null);
  /** Set when a gesture actually dragged, so the trailing click is swallowed. */
  const suppressClick = useRef(false);

  const writeDragOffset = useCallback((px: number) => {
    trackRef.current?.style.setProperty("--drag", `${px}px`);
  }, []);

  const pauseForInteraction = useCallback(() => {
    setUserPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(
      () => setUserPaused(false),
      RESUME_AFTER_INTERACTION_MS
    );
  }, []);

  useEffect(
    () => () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    },
    []
  );

  const step = useCallback((delta: number) => {
    setSuppressEnter(false);
    setAnimating(true);
    setIndex((prev) => prev + delta);
  }, []);

  // Re-arm the track's transition class one painted frame after the rewind
  // (the correction itself must land with transition disabled). Also keeps
  // autoplay alive: its effect early-returns while `animating` is false.
  const rearmTimer = useRef<number | null>(null);
  const rearm = useCallback(() => {
    if (rearmTimer.current) window.clearTimeout(rearmTimer.current);
    rearmTimer.current = window.setTimeout(() => setAnimating(true), 64);
  }, []);

  useEffect(
    () => () => {
      if (rearmTimer.current) window.clearTimeout(rearmTimer.current);
    },
    []
  );

  /* ── Autoplay ────────────────────────────────────────────────────────────
     Paused while the user is interacting, while the tab is hidden, and while
     the carousel is off screen — three easy wins on low-end devices. */
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    // `animating` is false only while a drag is in flight (or during the one
    // rewind commit), so it doubles as a clean "hands off" signal.
    if (count < 2 || userPaused || !inView || !tabVisible || !animating) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => step(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, userPaused, inView, tabVisible, animating, step]);

  /* ── Rewind ─────────────────────────────────────────────────────────────
     Runs on the track's *own* transform transition only. Both the index and
     the "no transition" flag are committed together, so the correction lands
     in a single style recalculation and is never seen. */

  /* Shift by whole clone-sets until the index is back inside the middle set.
     Every set is the same products, so any such shift lands on the exact
     frame already on screen — the correction can never be seen. Works for
     indices that have drifted arbitrarily far, not just one set. */
  const correctIndex = useCallback(
    (prev: number) => {
      let next = prev;
      while (next >= count * 2) next -= count;
      while (next < count) next += count;
      return next;
    },
    [count]
  );

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== trackRef.current || event.propertyName !== "transform") return;
    if (count < 2) return;

    if (index >= count * 2 || index < count) {
      setAnimating(false);
      setSuppressEnter(true);
      setIndex(correctIndex);
      rearm();
    }
  };

  /* Watchdog — transitionend can be swallowed: a drag removes the transition
     class mid-flight, or a throttled/frozen renderer suspends the animation
     so the event never arrives while JS timers keep stepping autoplay. If
     that happens the track walks past the clone sets and the stage renders
     EMPTY. One transition-duration after any out-of-range index, snap back to
     the same product with the transition disabled. Races are safe: if
     transitionend corrects first, the index change cancels this timer; if
     this fires first, disabling the transition cancels the pending event. */
  useEffect(() => {
    if (count < 2) return;
    if (index >= count * 2 || index < count) {
      const id = window.setTimeout(() => {
        setAnimating(false);
        setSuppressEnter(true);
        setIndex(correctIndex);
        rearm();
      }, 760);
      return () => window.clearTimeout(id);
    }
  }, [index, count, correctIndex, rearm]);

  /* ── Pointer drag ───────────────────────────────────────────────────────
     The offset lives in a ref and is written straight to a CSS variable, so a
     drag never triggers a React render — that is what keeps swiping smooth on
     cheaper Android phones. */
  const beginDrag = (x: number) => {
    dragging.current = true;
    suppressClick.current = false;
    dragStartX.current = x;
    dragDx.current = 0;
    axisLocked.current = null;
    setAnimating(false);
    pauseForInteraction();
  };

  const moveDrag = (x: number) => {
    if (!dragging.current) return;
    const dx = x - dragStartX.current;

    if (axisLocked.current === null) {
      // Give vertical scrolling priority on touch: only take over once the
      // gesture is clearly horizontal. Halve the delta so the finger tracks
      // the visual's edge naturally.
      axisLocked.current = Math.abs(dx) > 6 ? "x" : "y";
    }
    if (axisLocked.current !== "x") return;

    dragDx.current = dx;
    writeDragOffset(dx * 0.5);
  };

  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;

    const dx = dragDx.current;
    dragDx.current = 0;
    suppressClick.current = Math.abs(dx) > 5;
    writeDragOffset(0);
    setAnimating(true);

    if (dx <= -DRAG_COMMIT_PX) step(1);
    else if (dx >= DRAG_COMMIT_PX) step(-1);
  };

  const onTouchStart = (e: React.TouchEvent) => beginDrag(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => moveDrag(e.touches[0].clientX);
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    beginDrag(e.clientX);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    moveDrag(e.clientX);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      pauseForInteraction();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      pauseForInteraction();
      step(-1);
    }
  };

  const jumpForward = () => {
    pauseForInteraction();
    step(1);
  };
  const jumpBack = () => {
    pauseForInteraction();
    step(-1);
  };

  if (slides.length === 0) return null;

  const activeDot = count > 0 ? ((index % count) + count) % count : 0;
  const autoplayRunning =
    count > 1 && !userPaused && inView && tabVisible && animating;

  return (
    <div
      className="w-full max-w-[1240px] mx-auto mt-1 relative pb-2"
      onMouseEnter={pauseForInteraction}
      onMouseLeave={() => {
        endDrag();
        pauseForInteraction();
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured products"
    >
      {/* ── Track ── */}
      <div
        ref={viewportRef}
        className={`${styles.viewport} overflow-hidden w-full`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="group"
        aria-label="Product slides"
      >
        <div
          ref={trackRef}
          className={`${styles.track} ${animating ? styles.trackAnimating : ""} touch-pan-y select-none cursor-grab active:cursor-grabbing`}
          style={{ "--index": index } as React.CSSProperties}
          onTransitionEnd={handleTransitionEnd}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={endDrag}
          onTouchCancel={endDrag}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endDrag}
        >
          {slides.map((product, i) => {
            const { badge, Icon, isCrimson } = getMeta(product.slug);
            const content = productContent[product.slug];
            const coverImage = product.coverImageUrl || content?.image;
            const isReal = i >= count && i < count * 2;
            const slideNo = String((i % count) + 1).padStart(2, "0");

            return (
              <div
                key={`${product.id}-${i}`}
                className={`${styles.slide} ${animating && i === index && !suppressEnter ? styles.isActive : ""}`}
                aria-hidden={!isReal}
              >
                <Link
                  href={`/products/${product.slug}`}
                  onClick={(e) => {
                    // A swipe that ends on the composition must not navigate.
                    if (suppressClick.current) {
                      e.preventDefault();
                      suppressClick.current = false;
                    }
                  }}
                  tabIndex={isReal ? 0 : -1}
                  draggable={false}
                  className={`${styles.compose} tap-flat group`}
                  aria-label={`${product.name} — PKR ${product.price.toFixed(0)}`}
                >
                  {/* ── PRODUCT STAGE — lit artwork, open corners, no card ── */}
                  <div className={styles.visual}>
                    <span className={styles.corners} aria-hidden />
                    <div className={styles.stage}>
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt=""
                          fill
                          draggable={false}
                          className={styles.visualImg}
                          sizes="(max-width: 640px) 70vw, 480px"
                          loading="lazy"
                        />
                      ) : (
                        <Icon
                          size={64}
                          className={styles.visualIcon}
                          style={{
                            filter: isCrimson
                              ? "drop-shadow(0 0 18px rgba(255,45,85,0.35))"
                              : "drop-shadow(0 0 18px rgba(77,163,255,0.4))",
                          }}
                        />
                      )}
                    </div>

                    {/* Signature data rail — real data only */}
                    <span className={styles.dataRail} aria-hidden>
                      <span className={styles.dataNum}>{slideNo}</span>
                      <span className={styles.dataLine} />
                      <span className={styles.dataLabel}>
                        {content?.durationLabel || badge}
                      </span>
                    </span>
                  </div>

                  {/* ── INFO — editorial hierarchy, no panels ── */}
                  <div className={styles.info}>
                    <span className={`${styles.infoBadge} ${isCrimson ? styles.crimsonTone : ""}`}>
                      {badge}
                    </span>

                    <h3 className={styles.infoTitle}>{product.name}</h3>

                    <p className={styles.infoDesc}>{excerpt(product.description)}</p>

                    <div className={styles.infoMeta}>
                      <div className={styles.price}>
                        <span className={styles.priceLabel}>Price</span>
                        <span className={styles.priceValue}>
                          PKR {product.price.toLocaleString("en-US")}
                        </span>
                      </div>

                      <span className={`${styles.cta} ${isCrimson ? styles.crimsonCta : ""}`}>
                        <span className="relative z-10 flex items-center gap-1.5">
                          VIEW
                          <ArrowRight size={14} className={styles.ctaArrow} />
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── HUD: counter + animated autoplay rail + compact arrows, all
             belonging to the composition (never at viewport edges) ── */}
      {count > 1 && (
        <div className={styles.hud}>
          <div className={styles.hudProgress}>
            <span className={styles.counter} aria-hidden>
              <span className={styles.counterStrong}>
                {String(activeDot + 1).padStart(2, "0")}
              </span>
              <span className={styles.counterDim}>
                {" / "}
                {String(count).padStart(2, "0")}
              </span>
            </span>
            <span className={styles.railTrack} aria-hidden>
              <span
                key={`${index}-${autoplayRunning ? "run" : "hold"}`}
                className={styles.railFill}
                style={{
                  animationDuration: `${AUTOPLAY_MS}ms`,
                  animationPlayState: autoplayRunning ? "running" : "paused",
                }}
              />
            </span>
          </div>

          <div className={styles.hudNav}>
            <button
              type="button"
              onClick={jumpBack}
              aria-label="Previous product"
              className={`${styles.arrow} tap-flat`}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={jumpForward}
              aria-label="Next product"
              className={`${styles.arrow} tap-flat`}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
