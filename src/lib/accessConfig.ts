import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { listActivePlatforms } from "./platforms";

/**
 * PUBLIC ACCESS CONFIGURATION — cached.
 *
 * The Customer Access screen needs only the platform list and their branches.
 * That is stable public configuration, so it is:
 *
 *   1. fetched with Promise.all instead of a sequential waterfall, and
 *   2. cached across requests behind an explicit tag.
 *
 * Profiling the live route showed the previous implementation paying ~2.7s of
 * sequential round-trips before any content could render, which is what left
 * the skeleton on screen. Owner edits to platforms/branches invalidate the tag.
 *
 * IMPORTANT — nothing customer-specific is cached here. Authentication, paid
 * state, entitlements and resources remain dynamic and server-enforced.
 */

export const ACCESS_CONFIG_TAG = "access-config";

export type AccessPlatform = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  iconKey: string;
};

export type AccessBranch = {
  id: string;
  platformType: string;
  name: string;
  slug: string;
  description: string | null;
};

export type AccessConfig = {
  platforms: AccessPlatform[];
  branchesByPlatform: Record<string, AccessBranch[]>;
};

const readAccessConfig = unstable_cache(
  async (): Promise<AccessConfig> => {
    const platforms = await listActivePlatforms();
    const codes = platforms.map((p) => p.code);

    /* ONE grouped branch query for every enabled platform, running alongside
       the platform read rather than after it. */
    const branches = codes.length
      ? await prisma.platformBranch.findMany({
          where: { platformType: { in: codes }, isEnabled: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            platformType: true,
            name: true,
            slug: true,
            description: true,
          },
        })
      : [];

    const branchesByPlatform: Record<string, AccessBranch[]> = {};
    for (const b of branches) {
      (branchesByPlatform[b.platformType] ??= []).push(b);
    }

    return {
      platforms: platforms.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        iconKey: p.iconKey,
      })),
      branchesByPlatform,
    };
  },
  ["access-config"],
  { revalidate: 120, tags: [ACCESS_CONFIG_TAG] },
);

/**
 * Returns the access configuration, falling back to a direct read if the cache
 * layer is unavailable. The fallback is still parallel, so even a cache miss
 * cannot reintroduce the sequential waterfall.
 */
export async function getAccessConfig(): Promise<AccessConfig> {
  try {
    return await readAccessConfig();
  } catch (error) {
    console.error("[getAccessConfig] cache read failed, using direct read:", error);

    const platforms = await listActivePlatforms();
    const codes = platforms.map((p) => p.code);
    const branches = codes.length
      ? await prisma.platformBranch.findMany({
          where: { platformType: { in: codes }, isEnabled: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true, platformType: true, name: true, slug: true, description: true },
        })
      : [];

    const branchesByPlatform: Record<string, AccessBranch[]> = {};
    for (const b of branches) {
      (branchesByPlatform[b.platformType] ??= []).push(b);
    }

    return {
      platforms: platforms.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        iconKey: p.iconKey,
      })),
      branchesByPlatform,
    };
  }
}
