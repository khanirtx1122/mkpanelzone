"use client";

/**
 * HeroProductSlider — the MK PANEL ZONE homepage showcase.
 *
 * It is a thin adapter: real admin/product records in, coverflow slides out.
 * All of the 3D motion, ring loop, drag physics and settle timing live in
 * <CoverflowCarousel/>, the single implementation shared by desktop and mobile
 * (only measured sizes differ).
 *
 * Everything shown on a card — platform, category, badge, one-line
 * descriptor — is derived from the product record itself. No invented
 * metadata, no hard-coded product list.
 */

import { useMemo } from "react";
import { Shield, Headset, Smartphone, Monitor, Package } from "lucide-react";
import { CoverflowCarousel, type CoverflowSlide } from "./CoverflowCarousel";
import { productContent } from "@/lib/productContent";
import type { Product } from "@/components/ui/ProductCard";

/** how many products the hero ring carries */
const MAX_SLIDES = 6;

/* ── Derivation helpers ─────────────────────────────────────────────────── */

/** platform first — the record's own words decide, never the slug alone */
function getPlatform(haystack: string) {
  if (/\b(pc|windows|desktop|exe)\b/.test(haystack)) return "PC";
  if (/(ios|iphone|ipad|apple)/.test(haystack)) return "iOS";
  if (/(android|sensi|head|location|uid)/.test(haystack)) return "Android";
  if (/(setup|support|service)/.test(haystack)) return "Service";
  return "Digital";
}

const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/location/, "Spoofing Tools"],
  [/(sensi|sensitiv)/, "Sensitivity Pack"],
  [/(uid|bypass)/, "Bypass Tools"],
  [/head/, "Headshot Tools"],
  [/injector/, "Injector Tools"],
  [/support/, "Priority Support"],
  [/setup|guide|tutorial/, "Setup & Tools"],
  [/panel|config/, "Panel Access"],
];

const DESCRIPTOR_RULES: Array<[RegExp, string]> = [
  [/lifetime/, "Lifetime access with priority support."],
  [/weekly|7[- ]day/, "Seven days of access with trial support."],
  [/3[- ]month|90[- ]day/, "Ninety days of access with standard support."],
  [/monthly|30[- ]day/, "Thirty days of access with standard support."],
  [/location/, "Precision location setup for supported devices."],
  [/(sensi|sensitiv)/, "Tuned sensitivity presets with a guided setup."],
  [/(uid|bypass)/, "Device-bound bypass access, verified delivery."],
  [/head/, "Headshot tuning built for competitive play."],
  [/injector/, "Injector toolkit with bonus files included."],
  [/support/, "Direct one-to-one installation assistance."],
  [/setup|guide|tutorial/, "Complete setup files with guided tutorials."],
];

const BADGE_RULES: Array<[RegExp, string, "blue" | "red" | "neutral"]> = [
  [/lifetime/, "Best Seller", "red"],
  [/weekly/, "Trial", "blue"],
  [/3[- ]month/, "Best Value", "blue"],
  [/support|setup/, "Add-on", "neutral"],
];

function getCategory(haystack: string) {
  for (const [pattern, label] of CATEGORY_RULES) {
    if (pattern.test(haystack)) return label;
  }
  return "Digital Product";
}

function getDescriptor(haystack: string) {
  for (const [pattern, text] of DESCRIPTOR_RULES) {
    if (pattern.test(haystack)) return text;
  }
  return "Premium digital access, delivered after verification.";
}

function getBadge(haystack: string) {
  for (const [pattern, label, tone] of BADGE_RULES) {
    if (pattern.test(haystack)) return { badge: label, tone };
  }
  return { badge: undefined, tone: "blue" as const };
}

function getIcon(platform: string) {
  switch (platform) {
    case "PC":
      return Monitor;
    case "iOS":
      return Smartphone;
    case "Service":
      return Headset;
    case "Digital":
      return Package;
    default:
      return Shield;
  }
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function HeroProductSlider({ products }: { products: Product[] }) {
  const slides = useMemo<CoverflowSlide[]>(() => {
    if (!products?.length) return [];

    return products.slice(0, MAX_SLIDES).map((product) => {
      const content = productContent[product.slug];
      const haystack = `${product.name} ${product.slug}`.toLowerCase();

      const platform = getPlatform(haystack);
      const category = getCategory(haystack);
      const { badge, tone } = getBadge(haystack);

      return {
        id: product.id,
        href: `/products/${product.slug}`,
        title: product.name,
        alt: `${product.name} — ${platform} ${category.toLowerCase()} artwork`,
        image: product.coverImageUrl || content?.image || null,
        price: product.price,
        badge,
        tone,
        icon: getIcon(platform),
        platform,
        category,
        descriptor: getDescriptor(haystack),
      };
    });
  }, [products]);

  if (slides.length === 0) return null;

  return (
    <div className="w-full mx-auto relative" data-analytics-section="hero_slider">
      <CoverflowCarousel slides={slides} label="Featured products" />
    </div>
  );
}
