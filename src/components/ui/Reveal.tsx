"use client";

import * as React from "react";

type RevealTag = "div" | "section" | "article" | "li" | "span" | "header" | "footer";

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  /** Element to render. Defaults to a div so it never changes document semantics. */
  as?: RevealTag;
  /** Stagger offset in ms. */
  delay?: number;
  /** Only animate the first time it enters the viewport (default: true). */
  once?: boolean;
}

/**
 * Scroll reveal primitive.
 *
 * The SSR markup ships with [data-reveal] (hidden) so there is never a flash of
 * already-visible content that then jumps. Motion is defined once in globals.css
 * as transform + opacity only — this component just flips the attribute.
 *
 * Safety nets, in order: reduced-motion and html[data-perf="low"] force the
 * visible state in CSS; `prefers-reduced-motion` short-circuits before observing;
 * a <noscript> rule in the root layout covers JS-disabled clients.
 */
export function Reveal({
  children,
  as = "div",
  delay = 0,
  once = true,
  className,
  style,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Never spend a frame on an animation the user asked not to see.
    // (Deferred a tick so the state update isn't synchronous in the effect body.)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setShown(true), 0);
      return () => clearTimeout(t);
    }

    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setShown(true), 0);
      return () => clearTimeout(t);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setShown(false);
          }
        }
      },
      // Trigger slightly before the element is fully on screen, and never let a
      // tall element stay hidden just because its top edge is still below fold.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    observer.observe(el);

    /* Immediate in-viewport check. IntersectionObserver's first callback is
       asynchronous, and an element that is already visible on load (or one
       with a near-zero box that never satisfies the threshold) would sit at
       opacity 0 until that callback lands. Measuring synchronously reveals it
       on the first frame instead. */
    const rect = el.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < viewportH && rect.bottom > 0) {
      setShown(true);
      if (once) observer.disconnect();
    }

    // One-shot JS failsafe: if the observer never fires (killed tab, bfcache
    // restore, observer teardown, clipped container), force the element
    // visible instead of leaving content stranded at opacity 0. A per-element
    // timer is used rather than a page-wide CSS animation because pending
    // animations can delay compositor work and stall unrelated transitions on
    // weak devices.
    const failsafe = window.setTimeout(() => setShown(true), 1200);
    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [once]);

  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref}
      /** SSR ships the attribute so content is never visible-then-jump; CSS
       *  forces the shown state for reduced-motion / low-perf regardless. */
      data-reveal={shown ? "in" : ""}
      className={className}
      style={delay ? ({ ...style, "--reveal-delay": `${delay}ms` } as React.CSSProperties) : style}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
