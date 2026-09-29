"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  FLUSH_INTERVAL_MS,
  HEARTBEAT_MS,
  MAX_BATCH_EVENTS,
  SESSION_TIMEOUT_MS,
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  isTrackablePath,
  normalizePath,
} from "@/lib/analytics";

/**
 * First-party public analytics tracker.
 *
 * Extremely lightweight: no scroll or mousemove listeners, no fingerprinting,
 * no third-party SDK. Route changes, meaningful section visibility
 * (IntersectionObserver) and a small set of meaningful clicks only.
 * Heartbeat runs every ~25s and pauses entirely while the tab is hidden.
 */

type QueuedEvent = { t: "page_view" | "section_view" | "important_click"; p: string; s?: string; k?: string };

const SID_KEY = "mk_an_sid";
const SEEN_KEY = "mk_an_seen";
const START_KEY = "mk_an_start";
const SEEN_SECTIONS_KEY = "mk_an_sec";
const SECTION_DWELL_MS = 900;
/** Same route re-viewed sooner than this is treated as one page view. */
const PAGE_VIEW_DEDUPE_MS = 2500;
/** Same section in the same route is not re-counted within this window. */
const SECTION_DEDUPE_MS = 5 * 60 * 1000;

/** Throttle map persisted in sessionStorage so remounts can't double-count. */
function readSeenSections(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(SEEN_SECTIONS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeSeenSections(map: Record<string, number>) {
  try {
    // Keep the map small — newest 40 entries only.
    const entries = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40);
    sessionStorage.setItem(SEEN_SECTIONS_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    /* storage unavailable (private mode) — in-memory dedupe still applies */
  }
}

/** Wall-clock helper — analytics needs real time, kept out of render scope. */
function nowMs(): number {
  return Date.now();
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${VISITOR_COOKIE_MAX_AGE}; SameSite=Lax${
    location.protocol === "https:" ? "; Secure" : ""
  }`;
}

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const queueRef = useRef<QueuedEvent[]>([]);
  const visitorRef = useRef<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const sessionStartRef = useRef<number>(0);
  const sentSectionsRef = useRef<Set<string>>(new Set());
  const sentClicksRef = useRef<Set<string>>(new Set());
  const lastPageViewRef = useRef<Map<string, number>>(new Map());
  const firstRequestRef = useRef(true);
  const timerRef = useRef<number | null>(null);

  // ── Identity + session lifecycle ──────────────────────────────────────────
  const ensureIdentity = () => {
    if (!visitorRef.current) {
      let vid = readCookie(VISITOR_COOKIE);
      if (!vid || !/^[A-Za-z0-9_-]{8,64}$/.test(vid)) {
        vid = randomToken();
      }
      writeCookie(VISITOR_COOKIE, vid);
      visitorRef.current = vid;
    }

    const now = nowMs();
    const lastSeen = Number(sessionStorage.getItem(SEEN_KEY) || 0);
    const storedSid = sessionStorage.getItem(SID_KEY);
    // 30 minutes of silence starts a brand-new session.
    if (!storedSid || !lastSeen || now - lastSeen > SESSION_TIMEOUT_MS) {
      sessionStorage.setItem(SID_KEY, randomToken());
      sessionStorage.setItem(START_KEY, String(now));
      sessionStartRef.current = now;
      sentSectionsRef.current.clear();
      sentClicksRef.current.clear();
    } else {
      sessionStartRef.current = Number(sessionStorage.getItem(START_KEY) || now);
    }
    sessionRef.current = sessionStorage.getItem(SID_KEY);
    sessionStorage.setItem(SEEN_KEY, String(now));
  };

  const flush = (useBeacon = false) => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const events = queueRef.current.splice(0, MAX_BATCH_EVENTS);
    const vid = visitorRef.current;
    const sid = sessionRef.current;
    if (!vid || !sid) return;

    const heartbeatOnly = events.length === 0;
    const payload = JSON.stringify({
      vid,
      sid,
      sessionStart: sessionStartRef.current,
      referrer: firstRequestRef.current ? document.referrer || null : null,
      heartbeat: heartbeatOnly,
      events,
    });
    firstRequestRef.current = false;
    sessionStorage.setItem(SEEN_KEY, String(nowMs()));

    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/collect", new Blob([payload], { type: "application/json" }));
        return;
      }
    } catch {
      /* fall through to fetch */
    }

    void fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    })
      .then((res) => {
        // A dropped request must never lose real activity — put it back in the
        // queue so the next flush retries it.
        if (!res.ok) {
          requeue(events);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        // Server may rotate the session after inactivity — adopt its key.
        if (data?.sid && data.sid !== sessionRef.current) {
          sessionRef.current = data.sid;
          sessionStorage.setItem(SID_KEY, data.sid);
        }
      })
      .catch(() => {
        /* offline / aborted — requeue so it is retried, never crash the site */
        requeue(events);
      });
  };

  /** Return failed events to the front of the queue (bounded). */
  const requeue = (events: QueuedEvent[]) => {
    if (!events.length) return;
    queueRef.current = [...events, ...queueRef.current].slice(0, MAX_BATCH_EVENTS);
    scheduleFlush(2500);
  };

  const scheduleFlush = (delay = 1200) => {
    if (timerRef.current) return;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      flush();
    }, delay);
  };

  const push = (event: QueuedEvent) => {
    if (!isTrackablePath(event.p)) return;
    queueRef.current.push(event);
    if (queueRef.current.length >= MAX_BATCH_EVENTS) flush();
    else scheduleFlush(event.t === "page_view" ? 300 : 1500);
  };

  // ── Page views ────────────────────────────────────────────────────────────
  useEffect(() => {
    const path = normalizePath(pathname || "/");
    if (!isTrackablePath(path)) return;
    ensureIdentity();
    // One page view per route within a short window (guards against remounts).
    const last = lastPageViewRef.current.get(path) ?? 0;
    if (nowMs() - last < PAGE_VIEW_DEDUPE_MS) return;
    lastPageViewRef.current.set(path, nowMs());
    push({ t: "page_view", p: path });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ── Meaningful section visibility (deduped per path + session) ────────────
  useEffect(() => {
    const path = normalizePath(pathname || "/");
    if (!isTrackablePath(path)) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-analytics-section]"));
    if (!nodes.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const node = entry.target as HTMLElement;
          const key = node.dataset.analyticsSection;
          if (!key || !entry.isIntersecting) continue;
          const dedupeKey = `${path}#${key}`;
          if (sentSectionsRef.current.has(dedupeKey)) continue;
          const seen = readSeenSections();
          const seenAt = seen[dedupeKey] ?? 0;
          if (nowMs() - seenAt < SECTION_DEDUPE_MS) continue;
          sentSectionsRef.current.add(dedupeKey);
          // Require a short dwell so a fast scroll-past never counts.
          window.setTimeout(() => {
            const rect = node.getBoundingClientRect();
            const visible = rect.bottom > 0 && rect.top < window.innerHeight;
            if (!visible) return;
            const map = readSeenSections();
            map[dedupeKey] = nowMs();
            writeSeenSections(map);
            push({ t: "section_view", p: path, s: key });
          }, SECTION_DWELL_MS);
        }
      },
      { threshold: [0.45], rootMargin: "0px" }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ── Meaningful clicks ─────────────────────────────────────────────────────
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest?.("a[href], [data-analytics-click]") as HTMLElement | null;
      if (!target) return;

      const explicit = target.dataset?.analyticsClick;
      let key = explicit || "";
      if (!key) {
        const href = target.getAttribute("href") || "";
        if (!href.startsWith("/")) return;
        const path = normalizePath(href);
        if (path.startsWith("/products/")) key = `product:${path.slice("/products/".length)}`;
        else if (path === "/products") key = "nav:products";
        else if (path === "/access") key = "nav:access";
        else if (path === "/support") key = "nav:support";
        else if (path === "/") key = "nav:home";
        else if (path.startsWith("/checkout")) key = "checkout:start";
      }
      if (!key) return;
      if (sentClicksRef.current.has(key)) return;
      sentClicksRef.current.add(key);

      const path = normalizePath(location.pathname);
      if (!isTrackablePath(path)) return;
      ensureIdentity();
      push({ t: "important_click", p: path, k: key });
    };

    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Presence heartbeat + visibility-aware flushing ────────────────────────
  useEffect(() => {
    const beat = () => {
      if (document.visibilityState !== "visible") return;
      const path = normalizePath(location.pathname);
      if (!isTrackablePath(path)) return;
      ensureIdentity();
      flush();
    };

    const interval = window.setInterval(beat, HEARTBEAT_MS);
    // Safety net: never let queued events sit for more than a few seconds.
    const drain = window.setInterval(() => {
      if (document.visibilityState === "visible" && queueRef.current.length > 0) flush();
    }, FLUSH_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") beat();
      else flush(true);
    };

    document.addEventListener("visibilitychange", onVisibility);
    const onPageHide = () => flush(true);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(interval);
      window.clearInterval(drain);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
