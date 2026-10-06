"use client";

import { useSyncExternalStore } from "react";

/**
 * Resolves true once the brand intro has finished and its overlay is gone.
 *
 * Popups must never appear on top of the intro (and must not be delayed by a
 * blind fixed timer either — that felt "late" on fast devices and early on
 * slow ones). This watches the SAME signals the intro itself uses:
 *   - html[data-intro] is "off" (or absent when no intro runs at all)
 *   - the #mk-intro overlay is either unmounted or hidden
 *
 * Implemented with useSyncExternalStore: the check runs on a light interval and
 * only notifies React when the answer actually changes — no setState inside an
 * effect, and the server snapshot is `false` so hydration always matches.
 * A hard ceiling guarantees the popup is never blocked forever if some device
 * fails to clear the attribute.
 */
function introDone(): boolean {
  if (typeof document === "undefined") return false;
  const tier = document.documentElement.getAttribute("data-intro");
  if (tier !== "off" && tier !== null) return false;
  const node = document.getElementById("mk-intro");
  return !node || node.style.display === "none";
}

export function useIntroComplete(maxWaitMs = 9000): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};

      const started = Date.now();
      const interval = window.setInterval(() => {
        if (introDone() || Date.now() - started > maxWaitMs) {
          window.clearInterval(interval);
          onChange();
        }
      }, 200);

      // If it is already done, notify on the next tick so the subscriber
      // re-reads the snapshot without a synchronous setState.
      const first = window.setTimeout(onChange, 0);

      return () => {
        window.clearInterval(interval);
        window.clearTimeout(first);
      };
    },
    introDone,
    () => false,
  );
}
