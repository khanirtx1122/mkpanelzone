import { prisma } from "./prisma";
import crypto from "crypto";

/**
 * MK FREE PC PANEL — owner-configured promotion.
 * All copy/links live in SiteSetting (key `free_panel_config`) so the owner
 * can edit everything from Admin without touching source. Unknown keys fall
 * back to the defaults below.
 */

export interface FreePanelConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  durationLabel: string;
  ctaLabel: string;
  whatsappUrl: string;
  youtubeUrl: string;
  discordUrl: string;
  downloadUrl: string;
  downloadLabel: string;
  setupInstructions: string;
  popupDelaySeconds: number;
  popupFrequency: "ONCE_PER_SESSION" | "EVERY_VISIT" | "ONCE_PER_VISITOR";
  startDate: string | null;
  endDate: string | null;
}

export const FREE_PANEL_SETTING_KEY = "free_panel_config";

export const FREE_PANEL_DEFAULTS: FreePanelConfig = {
  enabled: true,
  title: "MK FREE PC PANEL",
  subtitle: "5 DAYS FREE ACCESS",
  durationLabel: "Get temporary access to our PC version at no cost.",
  ctaLabel: "GET FREE ACCESS",
  whatsappUrl: "",
  youtubeUrl: "",
  discordUrl: "",
  downloadUrl: "",
  downloadLabel: "Windows Download",
  setupInstructions:
    "1. Download the Windows app.\n2. Install/open the application.\n3. Enter your provided access key.\n4. Follow the in-app setup instructions.",
  popupDelaySeconds: 4,
  popupFrequency: "ONCE_PER_SESSION",
  startDate: null,
  endDate: null,
};



/** Only https:// or internal relative URLs are allowed. Blocks js:, data:, etc. */
export function sanitizeUrl(raw: string | undefined | null): string {
  if (!raw) return "";
  const url = raw.trim();
  if (!url) return "";
  if (url.startsWith("/")) return url; // internal relative
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") return url;
    if (parsed.protocol === "http:") return url; // allow http for local dev tooling
    return "";
  } catch {
    return "";
  }
}

export async function getFreePanelConfig(): Promise<FreePanelConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: FREE_PANEL_SETTING_KEY },
    });
    if (!row) return { ...FREE_PANEL_DEFAULTS };
    const parsed = JSON.parse(row.value) as Partial<FreePanelConfig>;
    const merged: FreePanelConfig = { ...FREE_PANEL_DEFAULTS, ...parsed };
    // Hard-sanitize every owner-editable URL at read time.
    merged.whatsappUrl = sanitizeUrl(merged.whatsappUrl);
    merged.youtubeUrl = sanitizeUrl(merged.youtubeUrl);
    merged.discordUrl = sanitizeUrl(merged.discordUrl);
    merged.downloadUrl = sanitizeUrl(merged.downloadUrl);
    const n = Number(merged.popupDelaySeconds);
    merged.popupDelaySeconds = Number.isFinite(n) ? Math.min(Math.max(n, 0), 60) : FREE_PANEL_DEFAULTS.popupDelaySeconds;
    merged.enabled = merged.enabled === true; // stored as real JSON boolean
    return merged;
  } catch {
    return { ...FREE_PANEL_DEFAULTS };
  }
}

/**
 * Owner-configurable Hero Top CTA (label chip above the hero headline).
 * Stored as JSON in SiteSetting `hero_cta`. Link is sanitized: internal
 * relative or https:// only — unsafe schemes are dropped at read time too.
 */
export interface HeroCta {
  enabled: boolean;
  text: string;
  link: string;
  newTab: boolean;
}

export const HERO_CTA_DEFAULTS: HeroCta = {
  enabled: false,
  text: "",
  link: "",
  newTab: false,
};

export async function getHeroCta(): Promise<HeroCta> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "hero_cta" } });
    if (!row) return { ...HERO_CTA_DEFAULTS };
    const parsed = JSON.parse(row.value) as Partial<HeroCta>;
    const link = sanitizeUrl(parsed.link ?? "");
    return {
      enabled: parsed.enabled === true && !!parsed.text && !!link,
      text: (parsed.text ?? "").slice(0, 40),
      link,
      newTab: parsed.newTab === true,
    };
  } catch {
    return { ...HERO_CTA_DEFAULTS };
  }
}

/** Is the promotion within its optional schedule window? */
export function isWithinSchedule(config: FreePanelConfig, now = new Date()): boolean {
  if (config.startDate && new Date(config.startDate).getTime() > now.getTime()) return false;
  if (config.endDate && new Date(config.endDate).getTime() < now.getTime()) return false;
  return true;
}

/**
 * Server-side key generation. Unique, random, non-sequential, hard to guess.
 * Crockford-ish alphabet with ambiguous characters (0/O/1/I/L) removed.
 */
const KEY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateAccessKey(): string {
  const bytes = crypto.randomBytes(12);
  let key = "";
  for (let i = 0; i < 12; i++) {
    key += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
    if (i === 3 || i === 7) key += "-";
  }
  return key; // e.g. "K7M2-QP9X-WT4A"
}

export function generateClaimToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}
