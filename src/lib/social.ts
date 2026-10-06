import { getSettings } from "./settings";

/**
 * SOCIAL LINKS — one shared reader for every public surface.
 *
 * The owner manages these in Admin → Footer (SiteSetting key `social_links`).
 * Nothing on the public site hard-codes a social URL.
 */

export type SocialLink = {
  platform: string;
  url: string;
  enabled: boolean;
};

export type SocialPlatform =
  | "whatsapp"
  | "discord"
  | "tiktok"
  | "facebook"
  | "instagram"
  | "youtube"
  | "x"
  | "telegram";

/** Presentation metadata for the platforms the UI knows how to render. */
export const SOCIAL_META: Record<
  string,
  {
    label: string;
    /** Hero rotator accent (used for chip styling). */
    accent: string;
    accentSoft: string;
    text: string;
    border: string;
  }
> = {
  whatsapp: {
    label: "WhatsApp Channel",
    accent: "#25D366",
    accentSoft: "rgba(37,211,102,0.14)",
    text: "#5BF29A",
    border: "rgba(37,211,102,0.45)",
  },
  tiktok: {
    label: "Follow on TikTok",
    accent: "#0B0B0D",
    accentSoft: "rgba(255,255,255,0.07)",
    text: "#FFFFFF",
    border: "rgba(255,255,255,0.35)",
  },
  discord: {
    label: "Join Discord",
    accent: "#5865F2",
    accentSoft: "rgba(88,101,242,0.16)",
    text: "#A9B4FF",
    border: "rgba(88,101,242,0.5)",
  },
  instagram: {
    label: "Follow on Instagram",
    accent: "#E1306C",
    accentSoft: "rgba(255,255,255,0.10)",
    text: "#FFD9E6",
    border: "rgba(225,48,108,0.45)",
  },
  facebook: {
    label: "Follow on Facebook",
    accent: "#1877F2",
    accentSoft: "rgba(24,119,242,0.15)",
    text: "#9CC4FF",
    border: "rgba(24,119,242,0.45)",
  },
  youtube: {
    label: "Watch on YouTube",
    accent: "#FF0000",
    accentSoft: "rgba(255,0,0,0.13)",
    text: "#FF9A9A",
    border: "rgba(255,0,0,0.4)",
  },
  x: {
    label: "Follow on X",
    accent: "#0F1419",
    accentSoft: "rgba(255,255,255,0.07)",
    text: "#FFFFFF",
    border: "rgba(255,255,255,0.3)",
  },
  telegram: {
    label: "Join Telegram",
    accent: "#229ED9",
    accentSoft: "rgba(34,158,217,0.15)",
    text: "#8FD8F5",
    border: "rgba(34,158,217,0.45)",
  },
};

/** Order the hero rotator prefers (matches the owner's requested rotation). */
export const HERO_ROTATION_ORDER: SocialPlatform[] = [
  "whatsapp",
  "tiktok",
  "discord",
  "instagram",
  "facebook",
  "youtube",
  "telegram",
  "x",
];

function parse(raw: string | null | undefined): SocialLink[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SocialLink[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l) =>
        l &&
        typeof l.platform === "string" &&
        typeof l.url === "string" &&
        /^https?:\/\//i.test(l.url),
    );
  } catch {
    return [];
  }
}

/** Enabled links, in the owner's stored order. */
export async function getSocialLinks(): Promise<SocialLink[]> {
  try {
    const s = await getSettings(["social_links"]);
    return parse(s.social_links).filter((l) => l.enabled);
  } catch {
    return [];
  }
}

/** SiteSetting key for the hero CTA rotator (Owner-managed, independent of the
    footer list so the Owner can label and order the hero states separately). */
export const HERO_CTAS_KEY = "hero_social_ctas";

export type HeroCta = { platform: string; label: string; url: string; enabled: boolean };

/** Ordered hero CTA entries as stored by Admin (no fallback applied). */
export async function getStoredHeroCtas(): Promise<HeroCta[]> {
  try {
    const s = await getSettings([HERO_CTAS_KEY]);
    const raw = s[HERO_CTAS_KEY];
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HeroCta[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c) => c && typeof c.platform === "string")
      .map((c) => ({
        platform: c.platform.toLowerCase(),
        label: typeof c.label === "string" ? c.label : "",
        url: typeof c.url === "string" ? c.url : "",
        enabled: c.enabled !== false,
      }));
  } catch {
    return [];
  }
}

/**
 * Resolves the hero rotator entries.
 *
 * Order of truth:
 *   1. Hero-specific entries saved in Admin → Hero CTA (respecting enabled +
 *      a valid http(s) URL).
 *   2. Otherwise the enabled footer social links.
 *   3. Otherwise a WhatsApp entry derived from the admin-configured PRIMARY
 *      WhatsApp number, so the hero is useful before anything else is set up.
 *
 * Platforms without a valid URL are dropped entirely — a dead CTA is never
 * rendered, and no URL is ever invented.
 */
export async function getHeroCtas(): Promise<HeroCta[]> {
  const stored = await getStoredHeroCtas();
  const usable = stored.filter((c) => c.enabled && /^https?:\/\//i.test(c.url));
  if (usable.length > 0) return usable;

  const links = await getSocialLinks();
  const fromFooter: HeroCta[] = links
    .filter((l) => SOCIAL_META[l.platform])
    .map((l) => ({ platform: l.platform, label: "", url: l.url, enabled: true }));

  if (fromFooter.some((l) => l.platform === "whatsapp")) {
    return sortHeroOrder(fromFooter);
  }

  try {
    const { getWhatsAppNumber, whatsappLink } = await import("./settings");
    const number = await getWhatsAppNumber();
    const url = whatsappLink(number, "MK Panel Zone — official WhatsApp channel");
    if (url) fromFooter.unshift({ platform: "whatsapp", label: "", url, enabled: true });
  } catch {
    /* nothing configured at all — the hero falls back to the static badge */
  }

  return sortHeroOrder(fromFooter);
}

function sortHeroOrder(links: HeroCta[]): HeroCta[] {
  const rank = (p: string) => {
    const i = HERO_ROTATION_ORDER.indexOf(p as SocialPlatform);
    return i === -1 ? 99 : i;
  };
  return [...links].sort((a, b) => rank(a.platform) - rank(b.platform)).slice(0, 4);
}

/** Enabled links ordered for the hero rotator (falls back to stored order). */
export async function getHeroSocialLinks(): Promise<SocialLink[]> {
  const ctas = await getHeroCtas();
  return ctas.map((c) => ({ platform: c.platform, url: c.url, enabled: true }));
}
