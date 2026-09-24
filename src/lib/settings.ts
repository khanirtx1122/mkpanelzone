import { prisma } from "@/lib/prisma";

/**
 * Read-side helpers for `SiteSetting`.
 *
 * The admin panel has always been able to *write* these key/value rows, but for a
 * long time nothing outside the settings forms read them — so several toggles
 * were decorative. `maintenance_mode` and `enforce_device_binding` are now read
 * through here.
 */

/**
 * Batch read for page-level settings.
 *
 * Returns a plain record keyed by setting name, with **every requested key
 * present**. Keys that have never been saved come back as `""` rather than being
 * absent, so callers can treat the result as `Record<string, string>` and simply
 * fall back on falsiness (`settings.foo || "default"`, `settings.foo?.trim()`).
 *
 * Errors propagate: the callers that use this are server components that already
 * wrap it in a `try`/`catch` and render a designed fallback, and swallowing a
 * database failure here would turn a visible error into a silently unstyled page.
 */
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
  });

  const stored = new Map(rows.map((row) => [row.key, row.value]));

  /* Seed every requested key so the result is total, not partial. */
  const result: Record<string, string> = {};
  for (const key of keys) {
    result[key] = stored.get(key) ?? "";
  }
  return result;
}

/* ================================================================
   Single-key reads for hot paths
   ================================================================ */

/**
 * These run on the request boundary and on every customer sign-in, so a short
 * in-process memo keeps a database round-trip off each request. The TTL is
 * deliberately brief: an owner flipping a switch should see it take effect
 * within seconds, not minutes.
 */
const CACHE_TTL_MS = 10_000;
const cache = new Map<string, { value: string | null; at: number }>();

/** Raw string value of a setting, or `null` when it has never been set. */
export async function getSetting(key: string): Promise<string | null> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.value;

  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    const value = row?.value ?? null;
    cache.set(key, { value, at: now });
    return value;
  } catch {
    /*
      Fail to the caller's default rather than throwing. A database problem must
      not take down the request boundary, and it must not silently switch a
      restriction on either — so the failure is deliberately not cached.
    */
    return null;
  }
}

/**
 * Boolean setting. Anything other than the literal string `"true"` is false, so
 * an unset, empty or malformed value resolves to `fallback` rather than
 * accidentally enabling a restriction.
 */
export async function getBooleanSetting(key: string, fallback = false): Promise<boolean> {
  const raw = await getSetting(key);
  if (raw === null) return fallback;
  return raw === "true";
}

/** Drop a memoised value. Used after a settings write so the change is instant. */
export function invalidateSetting(key: string): void {
  cache.delete(key);
}
