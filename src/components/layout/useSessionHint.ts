"use client";

import { useSyncExternalStore } from "react";

/**
 * Lightweight, non-sensitive login HINT.
 *
 * `auth_session` is httpOnly and can only be read on the server. Reading it in
 * the root layout forced the ENTIRE site into dynamic rendering — no page could
 * be prerendered or cached, and every navigation paid for a fresh server
 * render. This companion cookie carries no identity at all: it is just "1" or
 * absent, so the browser can tell the navbar and the announcement/popup layers
 * which audience it belongs to.
 *
 * Security is unaffected: the real session cookie stays httpOnly and every
 * protected page still verifies it server-side.
 */
const COOKIE_NAME = "mk_session";

const listeners = new Set<() => void>();

function read(): boolean {
  try {
    if (typeof document === "undefined") return false;
    return document.cookie.split("; ").some((row) => row.startsWith(`${COOKIE_NAME}=`));
  } catch {
    return false;
  }
}

/* Evaluated once per environment: on the server (and during hydration) React
   uses getServerSnapshot below, so the browser value can be read eagerly here
   without ever mismatching the server markup. */
let current = read();

function subscribe(onChange: () => void) {
  listeners.add(onChange);

  const sync = () => {
    const next = read();
    if (next !== current) {
      current = next;
      for (const listener of listeners) listener();
    }
  };

  // A login/logout happens in a server action followed by a client navigation,
  // so re-check on the events that can observe it.
  window.addEventListener("focus", sync);
  window.addEventListener("pageshow", sync);
  const interval = window.setInterval(sync, 4000);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("focus", sync);
    window.removeEventListener("pageshow", sync);
    window.clearInterval(interval);
  };
}

const getSnapshot = () => current;
const getServerSnapshot = () => false;

/**
 * True once the browser holds a customer session hint. The server snapshot is
 * always false, so the first paint is identical on server and client — no
 * hydration mismatch, no flash of a wrong layout.
 */
export function useSessionHint(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
