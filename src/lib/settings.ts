import { cache } from "react";
import { prisma } from "./prisma";

/**
 * Site settings reader.
 *
 * Wrapped in React's `cache()` so multiple components rendering in the same
 * request share one database round-trip instead of each issuing their own
 * `findMany`. Admin layout + page, or several sections of the same page, now
 * resolve settings exactly once per request.
 *
 * The cache is per-request only — mutations stay immediately visible because
 * every settings write already calls `revalidatePath`.
 */
export const getSettings = cache(async function getSettings(keys: string[]) {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: keys } }
  });

  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return result;
});

/** SiteSetting key holding the owner's WhatsApp contact number. */
export const WHATSAPP_NUMBER_KEY = "support_whatsapp_number";

/**
 * Normalizes a human-entered WhatsApp number into the digits-only form that
 * `wa.me` requires (country code + number, no `+`, spaces, dashes or brackets).
 * Returns "" when nothing usable was supplied.
 */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string {
  if (!raw) return "";
  // Keep digits only; a leading "+" is implied by the international format.
  return raw.replace(/[^\d]/g, "").slice(0, 15);
}

/**
 * Resolves the owner's WhatsApp number for customer-facing links.
 *
 * Order: the Admin-managed SiteSetting first, then the legacy
 * `OWNER_WHATSAPP_NUMBER` env var so an existing deployment keeps working
 * until the owner saves a number in the panel. Wrapped in React `cache()` so
 * a page that builds several WhatsApp links still pays one query.
 */
export const getWhatsAppNumber = cache(async function getWhatsAppNumber(): Promise<string> {
  try {
    const stored = await getSettings([WHATSAPP_NUMBER_KEY]);
    const normalized = normalizeWhatsAppNumber(stored[WHATSAPP_NUMBER_KEY]);
    if (normalized) return normalized;
  } catch {
    /* fall through to env */
  }
  return normalizeWhatsAppNumber(process.env.OWNER_WHATSAPP_NUMBER);
});

/** Builds a `wa.me` deep link, or null when no number is configured. */
export function whatsappLink(number: string, text?: string): string | null {
  const digits = normalizeWhatsAppNumber(number);
  if (!digits) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}
