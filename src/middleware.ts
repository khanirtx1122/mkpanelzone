import { NextResponse, type NextRequest } from "next/server";

/**
 * MAINTENANCE MODE GATE (public traffic only).
 *
 * The Owner toggles NORMAL / MAINTENANCE in Admin → Settings. Previously that
 * setting was stored but nothing enforced it publicly, so the toggle had no
 * visible effect.
 *
 * Design rules:
 *  - FAIL OPEN. Any error, timeout or unexpected response lets the request
 *    through. A maintenance check must never be able to take the site down.
 *  - The Owner Admin and the reseller panel are NEVER gated, so the Owner can
 *    always get in to switch it back off.
 *  - The state is cached in module scope for a few seconds, so this costs at
 *    most one small request per instance per window rather than one per visit.
 *  - A short timeout protects against a slow probe.
 */

const PROBE_TIMEOUT_MS = 1200;
const CACHE_MS = 10_000;

let cached: { maintenance: boolean; at: number } | null = null;

async function isMaintenance(request: NextRequest): Promise<boolean> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.maintenance;

  try {
    const url = new URL("/api/public-state", request.nextUrl.origin);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "x-mk-internal": "middleware" },
      cache: "no-store",
    });
    clearTimeout(timer);

    if (!res.ok) return cached?.maintenance ?? false;

    const data = (await res.json()) as { maintenance?: boolean };
    const maintenance = data.maintenance === true;
    cached = { maintenance, at: Date.now() };
    return maintenance;
  } catch {
    // Probe failed — keep the last known state, defaulting to "site is up".
    return cached?.maintenance ?? false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never gate the panels or the maintenance screen itself (no redirect loop).
  if (
    pathname.startsWith("/mkpanelzoneadmin") ||
    pathname.startsWith("/mkpanelzoneagents") ||
    pathname.startsWith("/mk-agents") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  if (!(await isMaintenance(request))) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/maintenance";
  // Preserve where they were headed so the screen can mention it.
  url.searchParams.set("from", pathname);
  return NextResponse.rewrite(url);
}

export const config = {
  /* Only real page requests — static assets, images and the icon are skipped
     entirely so maintenance mode never breaks asset loading. */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
