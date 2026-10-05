import { prisma } from "./prisma";

/**
 * DETERMINISTIC PRICING — single source of truth for what a customer pays.
 *
 * Priority (never stacked):
 *   1. An active per-product sale (enabled + inside its window, if set)
 *      wins outright — the owner chose a specific price for that product.
 *   2. Otherwise, an active global offer applies its percentage.
 *   3. Otherwise the normal price.
 *
 * Both the public storefront and `submitOrder`'s amount check use this, so
 * admin-configured sales can never drift from what checkout expects.
 */

export type PriceableProduct = {
  price: number;
  saleEnabled?: boolean | null;
  salePrice?: number | null;
  saleStartsAt?: Date | string | null;
  saleEndsAt?: Date | string | null;
};

export type GlobalOffer = {
  enabled: boolean;
  title: string;
  message: string;
  discountPercent: number;
  startsAt: string | null;
  endsAt: string | null;
};

export const GLOBAL_OFFER_KEY = "global_offer";

export const GLOBAL_OFFER_DEFAULTS: GlobalOffer = {
  enabled: false,
  title: "",
  message: "",
  discountPercent: 0,
  startsAt: null,
  endsAt: null,
};

export function parseGlobalOffer(raw: string | null | undefined): GlobalOffer {
  if (!raw) return { ...GLOBAL_OFFER_DEFAULTS };
  try {
    const parsed = JSON.parse(raw) as Partial<GlobalOffer>;
    return {
      enabled: parsed.enabled === true,
      title: typeof parsed.title === "string" ? parsed.title : "",
      message: typeof parsed.message === "string" ? parsed.message : "",
      discountPercent:
        typeof parsed.discountPercent === "number" && Number.isFinite(parsed.discountPercent)
          ? Math.min(Math.max(Math.round(parsed.discountPercent), 0), 95)
          : 0,
      startsAt: typeof parsed.startsAt === "string" ? parsed.startsAt : null,
      endsAt: typeof parsed.endsAt === "string" ? parsed.endsAt : null,
    };
  } catch {
    return { ...GLOBAL_OFFER_DEFAULTS };
  }
}

function withinWindow(startsAt: Date | string | null | undefined, endsAt: Date | string | null | undefined, now: Date): boolean {
  if (startsAt) {
    const s = new Date(startsAt);
    if (!Number.isNaN(s.getTime()) && now < s) return false;
  }
  if (endsAt) {
    const e = new Date(endsAt);
    if (!Number.isNaN(e.getTime()) && now > e) return false;
  }
  return true;
}

export type EffectivePrice = {
  /** What the customer actually pays right now. */
  price: number;
  /** The undiscounted list price (for strikethrough display). */
  originalPrice: number;
  /** null = normal price; "SALE" = product sale; "GLOBAL" = global offer. */
  source: "SALE" | "GLOBAL" | null;
  /** Percent off the original price, rounded, when discounted. */
  percentOff: number | null;
};

export function effectivePrice(product: PriceableProduct, offer: GlobalOffer, now: Date = new Date()): EffectivePrice {
  const original = product.price;

  // 1. Per-product sale — always wins when active; never combined with the offer.
  if (product.saleEnabled && product.salePrice != null && product.salePrice >= 0) {
    if (withinWindow(product.saleStartsAt, product.saleEndsAt, now)) {
      const sale = Math.min(product.salePrice, original);
      if (sale < original) {
        return {
          price: sale,
          originalPrice: original,
          source: "SALE",
          percentOff: Math.round(((original - sale) / original) * 100),
        };
      }
    }
  }

  // 2. Global offer.
  if (
    offer.enabled &&
    offer.discountPercent > 0 &&
    withinWindow(offer.startsAt, offer.endsAt, now)
  ) {
    const price = Math.max(Math.round(original * (1 - offer.discountPercent / 100) * 100) / 100, 0);
    if (price < original) {
      return {
        price,
        originalPrice: original,
        source: "GLOBAL",
        percentOff: offer.discountPercent,
      };
    }
  }

  return { price: original, originalPrice: original, source: null, percentOff: null };
}

/** Convenience: reads the global offer from the SiteSetting table. */
export async function getGlobalOffer(): Promise<GlobalOffer> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: GLOBAL_OFFER_KEY } });
    return parseGlobalOffer(row?.value);
  } catch {
    return { ...GLOBAL_OFFER_DEFAULTS };
  }
}

/** Reseller subscription catalogue — prices in PKR, per the owner's spec. */
export const RESELLER_PLANS = [
  { key: "M1", label: "1 Month", price: 1999, days: 30 },
  { key: "M2", label: "2 Months", price: 3299, days: 60 },
  { key: "M3", label: "3 Months", price: 3999, days: 90 },
  { key: "M6", label: "6 Months", price: 5499, days: 180 },
  { key: "Y1", label: "1 Year", price: 7499, days: 365 },
  { key: "PERMANENT", label: "Permanent", price: 9999, days: null },
] as const;

export type ResellerPlanKey = (typeof RESELLER_PLANS)[number]["key"];

export function findResellerPlan(key: string | null | undefined) {
  return RESELLER_PLANS.find((p) => p.key === key) ?? null;
}

/** Human "remaining validity" label. Permanent/absent expiry is honest, not a countdown. */
export function subscriptionRemaining(expiry: Date | string | null | undefined, now: Date = new Date()): string {
  if (!expiry) return "Permanent — no expiry";
  const end = new Date(expiry);
  if (Number.isNaN(end.getTime())) return "Invalid expiry";
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / 86400000);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} remaining`;
  const hours = Math.floor(ms / 3600000);
  return `${Math.max(hours, 1)} hour${hours === 1 ? "" : "s"} remaining`;
}
