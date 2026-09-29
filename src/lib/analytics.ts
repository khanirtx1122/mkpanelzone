/**
 * First-party website analytics — shared constants, honest user-agent parsing
 * and display labels. No fingerprinting, no IP storage, no personal data.
 *
 * Imported by both the public ingestion route (server) and the owner admin
 * dashboard (server + client labels), so it stays dependency-free.
 */

/** Only these three event types can ever be written to the database. */
export const ANALYTICS_EVENT_TYPES = ["page_view", "section_view", "important_click"] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

/** A session ends after 30 minutes of inactivity (new session afterwards). */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
/** A visitor counts as "active now" when seen within this window. */
export const PRESENCE_WINDOW_MS = 90 * 1000;
/** Client heartbeat while the tab is visible (must stay inside 20–30s). */
export const HEARTBEAT_MS = 25 * 1000;
/** Client batch flush interval. */
export const FLUSH_INTERVAL_MS = 4000;
/** Max events accepted in one ingestion request. */
export const MAX_BATCH_EVENTS = 20;

/** First-party cookie holding the anonymous visitor token. */
export const VISITOR_COOKIE = "mk_vid";
/** Cookie lifetime — 400 days is under the browser 400-day cap. */
export const VISITOR_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export const DEVICE_CATEGORIES = ["mobile", "desktop", "tablet", "unknown"] as const;
export const OS_NAMES = ["Android", "iOS", "Windows", "macOS", "Linux", "Other"] as const;
export const BROWSER_NAMES = ["Chrome", "Safari", "Edge", "Firefox", "Samsung Internet", "Opera", "Other"] as const;

/** Admin + agent surfaces are never counted as public visitor traffic. */
const EXCLUDED_PREFIXES = ["/mkpanelzoneadmin", "/mk-agents", "/agent", "/dashboard", "/api", "/_next"];

export function isTrackablePath(pathname: string): boolean {
  if (!pathname || !pathname.startsWith("/")) return false;
  return !EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Strip query/hash, collapse duplicate slashes, drop trailing slash (except root). */
export function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  let clean = pathname.split("?")[0].split("#")[0];
  clean = clean.replace(/\/{2,}/g, "/");
  if (clean.length > 1 && clean.endsWith("/")) clean = clean.slice(0, -1);
  if (!clean.startsWith("/")) clean = `/${clean}`;
  return clean.slice(0, 200);
}

/** Keep referrers short and never store a full URL with query strings. */
export function normalizeReferrer(referrer: string | null | undefined, selfHost?: string): string | null {
  if (!referrer) return null;
  const trimmed = referrer.trim();
  if (!trimmed) return null;
  let host = trimmed;
  try {
    const url = new URL(trimmed);
    if (selfHost && url.host === selfHost) return null; // internal navigation
    host = url.host || trimmed;
  } catch {
    /* not a URL — keep the short raw value */
  }
  return host.replace(/^www\./, "").slice(0, 120);
}

export type ParsedUserAgent = {
  deviceCategory: (typeof DEVICE_CATEGORIES)[number];
  deviceName: string;
  osName: (typeof OS_NAMES)[number];
  browserName: (typeof BROWSER_NAMES)[number];
  isBot: boolean;
};

const BOT_PATTERN =
  /bot|crawler|crawl|spider|slurp|bingpreview|headless|lighthouse|pingdom|uptimerobot|semrush|ahrefs|screaming ?frog|preview|facebookexternalhit|whatsapp|telegram|discordbot|python-requests|python-urllib|curl\/|wget|node-fetch|axios|go-http-client|okhttp|java\/|monitoring|google-inspectiontool|chrome-lighthouse/i;

/**
 * Honest user-agent parsing. We only surface a specific model when the UA
 * literally exposes one (e.g. `SM-A155F`, `Pixel 8`). Otherwise we report the
 * device family — never a guessed commercial model.
 */
export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  const ua = (userAgent || "").trim();

  if (!ua) {
    return { deviceCategory: "unknown", deviceName: "Unknown Device", osName: "Other", browserName: "Other", isBot: false };
  }

  if (BOT_PATTERN.test(ua)) {
    return { deviceCategory: "unknown", deviceName: "Bot", osName: "Other", browserName: "Other", isBot: true };
  }

  // ── OS ──
  let osName: ParsedUserAgent["osName"] = "Other";
  if (/Android/i.test(ua)) osName = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) osName = "iOS";
  else if (/CrOS/i.test(ua)) osName = "Linux";
  else if (/Windows/i.test(ua)) osName = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) osName = "macOS";
  else if (/Linux|X11/i.test(ua)) osName = "Linux";

  // ── Browser (order matters: Edge/Opera/Samsung all claim Chrome) ──
  let browserName: ParsedUserAgent["browserName"] = "Other";
  if (/Edg[A-Z]?\//i.test(ua)) browserName = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browserName = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browserName = "Samsung Internet";
  else if (/CriOS\//i.test(ua)) browserName = "Chrome";
  else if (/FxiOS\/|Firefox\//i.test(ua)) browserName = "Firefox";
  else if (/Chrome\//i.test(ua)) browserName = "Chrome";
  else if (/Safari\//i.test(ua)) browserName = "Safari";

  const isTablet = /iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) || /Tablet/i.test(ua);
  const isMobile = /iPhone|iPod|Windows Phone|IEMobile|Opera Mini|Mobile/i.test(ua);

  let deviceCategory: ParsedUserAgent["deviceCategory"] = "desktop";
  if (isTablet) deviceCategory = "tablet";
  else if (isMobile) deviceCategory = "mobile";

  // ── Device family / model (only when the UA genuinely exposes it) ──
  let deviceName: string;
  const samsung = ua.match(/;\s*(SM-[A-Z0-9]+)/i);
  const pixel = ua.match(/;\s*(Pixel [A-Za-z0-9 ]+?)(?:\s+Build|\)|;)/i);
  const otherAndroid = ua.match(/;\s*([A-Za-z0-9._-]+)\s+Build\//);
  const iphoneModel = /iPhone/i.test(ua);

  if (/iPad/i.test(ua)) deviceName = "iPad";
  else if (iphoneModel) deviceName = "iPhone";
  else if (samsung) deviceName = `Samsung ${samsung[1].toUpperCase()}`;
  else if (pixel) deviceName = pixel[1].trim();
  else if (osName === "Android") deviceName = otherAndroid ? otherAndroid[1] : "Android Device";
  else if (deviceCategory === "tablet") deviceName = "Tablet";
  else if (osName === "Windows") deviceName = "Windows PC";
  else if (osName === "macOS") deviceName = "Mac";
  else if (/CrOS/i.test(ua)) deviceName = "Chromebook";
  else if (osName === "Linux") deviceName = "Linux PC";
  else deviceName = "Desktop Device";

  return { deviceCategory, deviceName, osName, browserName, isBot: false };
}

// ────────────────────────────────────────────────────────────────────────────
// DISPLAY LABELS
// ────────────────────────────────────────────────────────────────────────────

export const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  hero_slider: "Hero Product Slider",
  explore_products: "Explore Products",
  featured_products: "Featured Products",
  trust_stats: "Trust Stats",
  why_choose_us: "Why Choose Us",
  customer_access: "Customer Access",
  free_panel: "Free Panel",
  footer: "Footer",
};

export function sectionLabel(key: string): string {
  if (!key) return "Unknown";
  return SECTION_LABELS[key] || key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const CLICK_LABELS: Record<string, string> = {
  "nav:products": "Opened Products",
  "nav:access": "Opened Customer Access",
  "nav:support": "Opened Support",
  "nav:home": "Opened Home",
  "cta:hero": "Hero CTA Clicked",
  "cta:view_products": "Products CTA Clicked",
  "cta:customer_access": "Customer Access CTA",
  "cta:free_panel": "Free Panel Opened",
  "checkout:start": "Started Checkout",
};

export function clickLabel(key: string): string {
  if (!key) return "Interaction";
  if (CLICK_LABELS[key]) return CLICK_LABELS[key];
  if (key.startsWith("product:")) return `Viewed Product: ${prettifySlug(key.slice(8))}`;
  return key.replace(/[:_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function prettifySlug(slug: string): string {
  return slug
    .split(/[/-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .slice(0, 60);
}

/** Friendly label for a tracked route (used in Top Pages + live rows). */
export function describePath(path: string): string {
  if (!path || path === "/") return "Home";
  const clean = normalizePath(path);
  const parts = clean.split("/").filter(Boolean);

  if (parts[0] === "products") return parts[1] ? `Product: ${prettifySlug(parts.slice(1).join(" "))}` : "Products";
  if (parts[0] === "checkout") return parts[1] ? `Checkout: ${prettifySlug(parts[1])}` : "Checkout";
  if (parts[0] === "support") return "Support";
  if (parts[0] === "access") return "Customer Access";
  if (parts[0] === "order") return parts[1] === "success" ? "Order Success" : "Order";
  if (parts[0] === "privacy") return "Privacy";
  if (parts[0] === "terms") return "Terms";
  return prettifySlug(clean) || "Home";
}

export function deviceCategoryLabel(category: string): string {
  switch (category) {
    case "mobile":
      return "Mobile";
    case "desktop":
      return "Desktop";
    case "tablet":
      return "Tablet";
    default:
      return "Unknown";
  }
}
