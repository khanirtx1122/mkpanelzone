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
const AUTOPLAY_MS = 2800;
const RESUME_AFTER_INTERACTION_MS = 3800;
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

  const goTo = useCallback((next: number, animate = true) => {
    setAnimating(animate);
    setIndex(next);
  }, []);

  const step = useCallback(
    (delta: number) => {
      setAnimating(true);
      setIndex((prev) => prev + delta);
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
  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== trackRef.current || event.propertyName !== "transform") return;
    if (count < 2) return;

    if (index >= count * 2) {
      setAnimating(false);
      setIndex(index - count);
    } else if (index < count) {
      setAnimating(false);
      setIndex(index + count);
    }
  };

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

  const jumpToDot = (dot: number) => {
    pauseForInteraction();
    const modulo = ((index % count) + count) % count;
    const setBase = index - modulo;
    goTo(setBase + dot);
  };

  if (slides.length === 0) return null;

  const activeDot = count > 0 ? ((index % count) + count) % count : 0;

  return (
    <div
      className="w-full max-w-[1080px] mx-auto mt-6 relative pb-2"
      onMouseEnter={pauseForInteraction}
      onMouseLeave={() => {
        endDrag();
        pauseForInteraction();
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured products"
    >
      {/* ── Arrows: minimal floating circles, kept inside the container until
             there is genuinely room outside it. ── */}
      <button
        type="button"
        onClick={() => {
          pauseForInteraction();
          step(-1);
        }}
        aria-label="Previous product"
        className={`${styles.arrow} tap-flat hidden md:flex absolute top-[calc(50%-16px)] left-0 xl:-left-14 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-full border transition-[transform,border-color,background-color] duration-200 ease-[cubic-bezier(.22,1,.36,1)] hover:scale-105 active:scale-95 group`}
        style={{
          background: "color-mix(in srgb, var(--surface) 55%, transparent)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <ChevronLeft
          size={18}
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        />
      </button>

      <button
        type="button"
        onClick={() => {
          pauseForInteraction();
          step(1);
        }}
        aria-label="Next product"
        className={`${styles.arrow} tap-flat hidden md:flex absolute top-[calc(50%-16px)] right-0 xl:-right-14 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-full border transition-[transform,border-color,background-color] duration-200 ease-[cubic-bezier(.22,1,.36,1)] hover:scale-105 active:scale-95 group`}
        style={{
          background: "color-mix(in srgb, var(--surface) 55%, transparent)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <ChevronRight
          size={18}
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </button>

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

            return (
              <div
                key={`${product.id}-${i}`}
                className={`${styles.slide} ${animating && i === index ? styles.isActive : ""}`}
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
                  {/* ── PRODUCT VISUAL — floats over atmospheric light ── */}
                  <div className={styles.visual}>
                    <div className={styles.rail} aria-hidden />
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt=""
                        fill
                        draggable={false}
                        className={styles.visualImg}
                        sizes="(max-width: 640px) 55vw, 260px"
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

                  {/* ── INFO — typographic hierarchy, no panels ── */}
                  <div className={styles.info}>
                    <span className={`${styles.infoBadge} ${isCrimson ? styles.crimson : ""}`}>
                      {badge}
                    </span>

                    <h3 className={styles.infoTitle}>{product.name}</h3>

                    <p className={styles.infoDesc}>
                      {product.description || "Premium digital product and access."}
                    </p>

                    <div className={styles.infoMeta}>
                      <div className={styles.price}>
                        <span className={styles.priceLabel}>Price</span>
                        <span className={styles.priceValue}>
                          PKR {product.price.toFixed(0)}
                        </span>
                      </div>

                      <span
                        className={`${styles.cta} ${isCrimson ? styles.crimson : ""} sheen`}
                      >
                        <span className="relative z-10 flex items-center gap-1.5">
                          VIEW
                          <ArrowRight size={13} className={styles.ctaArrow} />
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

      {/* ── HUD: counter + minimal dots ── */}
      {count > 1 && (
        <div className={styles.hud}>
          <span className={styles.counter} aria-hidden>
            <span className={styles.counterStrong}>
              {String(activeDot + 1).padStart(2, "0")}
            </span>
            {" / "}
            {String(count).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Slide position">
            {baseProducts.map((_, i) => {
              const isActive = activeDot === i;
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => jumpToDot(i)}
                  aria-label={`Go to product ${i + 1}`}
                  aria-current={isActive}
                  className={styles.dot}
                >
                  <span className={`${styles.dotInner} ${isActive ? styles.active : ""}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
