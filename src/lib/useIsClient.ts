"use client";

import * as React from "react";

/**
 * `useIsClient` — `false` during server rendering, `true` after hydration.
 *
 * This replaces the near-universal `useState(false)` +
 * `useEffect(() => setMounted(true), [])` guard that appeared in thirteen
 * components. That pattern works, but calling `setState` synchronously inside an
 * effect body schedules a second render on every mount purely to learn something
 * React already knows — whether we are on the client — which
 * `react-hooks/set-state-in-effect` flags and which is genuinely wasteful.
 *
 * `useSyncExternalStore` is the primitive built for exactly this: it reads a
 * value that differs between the server and the client, returns the server
 * snapshot during SSR and the client snapshot after hydration, and does it
 * without a cascading render.
 *
 * The subscription is a no-op because the answer never changes after mount.
 */
export function useIsClient(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
