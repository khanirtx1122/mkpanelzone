import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * PLATFORM SOURCE OF TRUTH
 *
 * `Platform` is the single canonical list of access platforms. Every part of
 * the app that used to hardcode ["ANDROID", "IOS", "PC"] reads from here:
 * the public Access screen, Platform Resources, branch management, package
 * forms, customer creation and the agent panel.
 *
 * Adding a platform in Admin propagates everywhere automatically. Platform
 * *codes* remain the stable key stored on customers/branches/packages/
 * resources, so existing data keeps working untouched.
 *
 * Behavioural exceptions that genuinely need special-casing (Android's branch
 * split, the Android/iOS/PC resource layout on the customer dashboard) are
 * expressed through the `layoutKey` on a platform row — never by scattering
 * `if (platform === "ANDROID")` through the codebase.
 */

export type PlatformRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  iconKey: string;
  isEnabled: boolean;
  sortOrder: number;
};

/** Seeded on first run; also the fallback if the table is somehow empty. */
export const CORE_PLATFORMS = [
  {
    code: "ANDROID",
    name: "Android",
    description: "Access your Android package resources and setup files.",
    iconKey: "android",
    sortOrder: 0,
  },
  {
    code: "IOS",
    name: "iPhone",
    description: "Access your iPhone package file and setup guide.",
    iconKey: "apple",
    sortOrder: 1,
  },
  {
    code: "PC",
    name: "PC",
    description: "Access your PC package resources.",
    iconKey: "monitor",
    sortOrder: 2,
  },
] as const;

/** Icon keys the UI knows how to render. Anything else falls back to `layers`. */
export const PLATFORM_ICON_KEYS = [
  "android",
  "apple",
  "monitor",
  "tablet",
  "globe",
  "gamepad",
  "layers",
] as const;

export type PlatformIconKey = (typeof PLATFORM_ICON_KEYS)[number];

export function isPlatformIconKey(value: string): value is PlatformIconKey {
  return (PLATFORM_ICON_KEYS as readonly string[]).includes(value);
}

/** Codes are uppercase alphanumeric tokens so they stay URL-safe and stable. */
export function normalizePlatformCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function isValidPlatformCode(code: string): boolean {
  return /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code) && code.length >= 2 && code.length <= 32;
}

/**
 * Idempotent seed. Ensures the three original platforms always exist so a
 * fresh database (or one that never ran the seed) behaves exactly like the
 * original site. Never overwrites an owner's edits.
 */
export async function ensureCorePlatforms(): Promise<void> {
  const existing = await prisma.platform.findMany({ select: { code: true } });
  const known = new Set(existing.map((p) => p.code));
  const missing = CORE_PLATFORMS.filter((p) => !known.has(p.code));
  if (missing.length === 0) return;

  await prisma.platform.createMany({
    data: missing.map((p) => ({
      code: p.code,
      name: p.name,
      description: p.description,
      iconKey: p.iconKey,
      isEnabled: true,
      sortOrder: p.sortOrder,
    })),
    skipDuplicates: true,
  });
}

/**
 * Every platform, ordered for display. Used by Admin (includes disabled rows
 * so the owner can re-enable them).
 *
 * Cached under the "platforms" tag: the admin sidebar, the customers page and
 * the platform manager all read this on every navigation, and it used to cost
 * a table scan plus the seed check each time. Platform writes call
 * revalidateTag("platforms"), so edits appear immediately.
 */
const PLATFORM_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  iconKey: true,
  isEnabled: true,
  sortOrder: true,
} as const;

const readAllPlatforms = unstable_cache(
  async () => {
    await ensureCorePlatforms();
    return prisma.platform.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: PLATFORM_SELECT,
    });
  },
  ["platforms-all"],
  { tags: ["platforms"], revalidate: 300 }
);

export async function listAllPlatforms(): Promise<PlatformRecord[]> {
  try {
    return await readAllPlatforms();
  } catch {
    // A cache failure must never blank the admin panel.
    await ensureCorePlatforms();
    return prisma.platform.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: PLATFORM_SELECT,
    });
  }
}

/**
 * Platforms that may be shown publicly / assigned to new customers.
 *
 * Self-healing: if the owner disabled every platform there would be no way
 * back in through the UI, so an all-disabled table falls back to the full
 * list rather than rendering an empty Access screen.
 */
export async function listActivePlatforms(): Promise<PlatformRecord[]> {
  const all = await listAllPlatforms();
  const rows = all.filter((p) => p.isEnabled);
  if (rows.length > 0) return rows;
  // Self-healing: an all-disabled table must not dead-end the Access screen.
  return all;
}

/** Just the codes — used for cheap validation without loading full rows. */
export async function listPlatformCodes(onlyEnabled = false): Promise<Set<string>> {
  if (!onlyEnabled) {
    const rows = await listAllPlatforms();
    return new Set(rows.map((r) => r.code));
  }
  const rows = await listActivePlatforms();
  return new Set(rows.map((r) => r.code));
}

export async function findPlatformByCode(code: string): Promise<PlatformRecord | null> {
  /* Served from the tagged cache — this runs on every dashboard render and
     every resource save for validation. */
  try {
    const all = await readAllPlatforms();
    return all.find((p) => p.code === code) ?? null;
  } catch {
    return prisma.platform.findUnique({ where: { code }, select: PLATFORM_SELECT });
  }
}

/** Human label for a platform code; falls back to the code itself. */
export function platformLabel(platforms: { code: string; name: string }[], code: string): string {
  return platforms.find((p) => p.code === code)?.name ?? code;
}

/**
 * How the customer dashboard should lay out a platform's resources.
 *
 * This replaces the old scattered `platformType === "ANDROID"` checks with a
 * single lookup: the owner can point a new platform at an existing layout, or
 * let it use the generic layout.
 */
export type PlatformLayout = "ANDROID_FULL" | "IPHONE_SIMPLE" | "PC_FILES" | "GENERIC";

const LAYOUT_BY_CODE: Record<string, PlatformLayout> = {
  ANDROID: "ANDROID_FULL",
  IOS: "IPHONE_SIMPLE",
  PC: "PC_FILES",
};

export function layoutForPlatform(code: string): PlatformLayout {
  return LAYOUT_BY_CODE[code] ?? "GENERIC";
}
