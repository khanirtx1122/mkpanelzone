"use client";

import * as React from "react";

/**
 * CustomCursor — a desktop-only pointer accent (spec §34).
 *
 * Deliberately conservative, because a custom cursor is the easiest way to make
 * a site feel worse:
 *
 *  - Only activates on a device that reports a fine pointer *and* hover, so
 *    touch devices never pay for it.
 *  - Refuses to activate under `prefers-reduced-motion` or when the runtime
 *    performance probe has flagged the device as low-tier.
 *  - Text inputs and textareas keep the native caret cursor, so selecting and
 *    editing text still behaves exactly as the OS intends.
 *  - Position updates are written straight to `transform` via refs inside a
 *    single rAF loop. Nothing here goes through React state, so a moving mouse
 *    never triggers a re-render.
 *
 * The dot tracks the pointer exactly; the ring lerps toward it, which is what
 * produces the sense of weight.
 */

/** How much of the remaining distance the ring covers per frame (0–1). */
const RING_EASING = 0.16;

/** Elements that should expand the ring — i.e. anything clickable. */
const INTERACTIVE_SELECTOR =
  'a[href], button:not([disabled]), [role="button"], input[type="submit"], input[type="button"], summary, label[for], select';

export function CustomCursor() {
  const dotRef = React.useRef<HTMLDivElement>(null);
  const ringRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPerf = document.documentElement.getAttribute("data-perf") === "low";

    if (!finePointer || reducedMotion || lowPerf) return;

    /*
      The owner panel and the agent workstation are deliberately excluded.
      Spec §26 asks for a fast single-screen sales tool with no decorative
      extras, and §59 requires the admin surface to stay visually distinct from
      the storefront. A pointer accent belongs on the storefront only.
    */
    const path = window.location.pathname;
    if (
      path.startsWith("/mkpanelzoneadmin") ||
      path.startsWith("/agent") ||
      path.startsWith("/mk-agents")
    ) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.setAttribute("data-cursor", "on");

    /* Target (exact pointer) and ring (eased) positions. */
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let visible = false;
    let frame = 0;

    const render = () => {
      ringX += (targetX - ringX) * RING_EASING;
      ringY += (targetY - ringY) * RING_EASING;

      /* The trailing translate(-50%, -50%) centres each element on the point.
         It has to live here rather than in CSS because the ring changes size
         on hover and press, and a fixed margin would drift off-centre. */
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

      frame = window.requestAnimationFrame(render);
    };

    const show = () => {
      if (visible) return;
      visible = true;
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    };

    const hide = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const onPointerMove = (event: PointerEvent) => {
      /* Ignore non-mouse pointers so a stylus or touch never drives the cursor. */
      if (event.pointerType !== "mouse") return;
      targetX = event.clientX;
      targetY = event.clientY;
      show();

      const element = event.target as Element | null;
      const interactive = Boolean(element?.closest?.(INTERACTIVE_SELECTOR));
      ring.dataset.hover = interactive ? "true" : "false";
    };

    const onPointerDown = () => {
      ring.dataset.pressed = "true";
    };

    const onPointerUp = () => {
      ring.dataset.pressed = "false";
    };

    const onLeaveWindow = () => hide();
    const onEnterWindow = () => show();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("mouseleave", onLeaveWindow);
    document.addEventListener("mouseenter", onEnterWindow);

    /* Start hidden — the pointer has not moved yet, so we do not know where it is. */
    hide();
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("mouseleave", onLeaveWindow);
      document.removeEventListener("mouseenter", onEnterWindow);
      document.documentElement.removeAttribute("data-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden />
      <div ref={dotRef} className="cursor-dot" aria-hidden />
    </>
  );
}
