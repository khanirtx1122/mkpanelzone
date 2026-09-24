"use client";

import * as React from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger in ms applied as a transition-delay */
  delay?: number;
  /** Direction of travel — kept subtle on purpose */
  from?: "bottom" | "left" | "right" | "none";
  as?: "div" | "section" | "li" | "article" | "header" | "footer";
  once?: boolean;
};

const OFFSET: Record<NonNullable<RevealProps["from"]>, string> = {
  bottom: "translateY(18px)",
  left: "translateX(-18px)",
  right: "translateX(18px)",
  none: "none",
};

/**
 * ScrollReveal — IntersectionObserver driven entrance.
 *
 * Deliberately NOT applied to everything (spec §31: "Do NOT animate
 * everything"). Uses transform + opacity only, unobserves after the first
 * reveal, and is a no-op under prefers-reduced-motion / low-perf mode
 * because the CSS `.reveal` rules are neutralised there.
 */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  from = "bottom",
  as: Tag = "div",
  once = true,
}: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion / low-perf: reveal immediately, skip the observer.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPerf =
      typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-perf") === "low";

    if (reduced || lowPerf || typeof IntersectionObserver === "undefined") {
      el.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.revealed = "true";
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.dataset.revealed = "false";
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      // @ts-expect-error — polymorphic ref across a small tag union
      ref={ref}
      className={`reveal ${className}`}
      style={{
        transitionDelay: delay ? `${delay}ms` : undefined,
        ...(from !== "bottom" ? { "--reveal-from": OFFSET[from] } as React.CSSProperties : {}),
      }}
    >
      {children}
    </Tag>
  );
}
