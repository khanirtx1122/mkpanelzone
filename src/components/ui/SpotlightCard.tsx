"use client";

import * as React from "react";

/**
 * SpotlightCard — pointer-reactive ambient lighting (spec §33).
 *
 * The highlight follows the cursor via two CSS custom properties written
 * on the element. This is a single rAF-batched style write per pointer
 * move, no React re-render, and it degrades to a static card on touch,
 * low-perf and reduced-motion devices.
 */
export function SpotlightCard({
  children,
  className = "",
  radius = 420,
  intensity = 0.09,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  radius?: number;
  intensity?: number;
  as?: "div" | "article" | "li" | "section";
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  const frame = React.useRef<number | null>(null);

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse") return;
      const el = ref.current;
      if (!el) return;

      const { clientX, clientY } = e;
      if (frame.current !== null) return;

      frame.current = window.requestAnimationFrame(() => {
        frame.current = null;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${clientX - rect.left}px`);
        el.style.setProperty("--my", `${clientY - rect.top}px`);
      });
    },
    []
  );

  React.useEffect(() => {
    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <Tag
      // @ts-expect-error — polymorphic ref across a small tag union
      ref={ref}
      onPointerMove={onPointerMove}
      className={`spotlight-card ${className}`}
      style={{ "--spot-r": `${radius}px`, "--spot-a": intensity } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

/**
 * PerspectiveCard — very restrained 3D tilt (spec §12: "Do not use an
 * exaggerated 20-degree card tilt"). Maximum rotation is 3deg, the card
 * settles instantly on leave, and it is disabled on touch.
 */
export function PerspectiveCard({
  children,
  className = "",
  max = 3,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const frame = React.useRef<number | null>(null);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const { clientX, clientY } = e;
    if (frame.current !== null) return;

    frame.current = window.requestAnimationFrame(() => {
      frame.current = null;
      const rect = el.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width - 0.5;
      const py = (clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(1100px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    });
  };

  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  React.useEffect(() => {
    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={`tilt-card ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * MagneticButton — the label drifts a few pixels toward the cursor.
 * Maximum displacement is 4px; anything more reads as a gaming effect.
 */
export function Magnetic({
  children,
  className = "",
  strength = 4,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);

  const handleMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    el.style.transform = `translate3d(${(dx * strength).toFixed(2)}px, ${(dy * strength).toFixed(2)}px, 0)`;
  };

  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  return (
    <span
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={`magnetic ${className}`}
    >
      {children}
    </span>
  );
}
