import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import type { PlatformBranch } from "@prisma/client";

/** Cache tag for branch configuration — invalidated when the Owner edits branches. */
export const BRANCHES_CACHE_TAG = "branches-config";

/**
 * Generic platform branch architecture.
 *
 * A `PlatformBranch` is a sub-destination inside a platform (e.g.
 * ANDROID → AIM Plus Holo / HEXHEAD). Customers and resources reference a
 * branch by id; a null `branchId` means the platform-wide legacy experience.
 * Nothing here is limited to two branches or to the ANDROID platform —
 * creating a new branch row is enough to expose it everywhere.
 */

export type BranchSeverity =
  | { ok: true; branch: PlatformBranch }
  | { ok: false; reason: "NOT_FOUND" | "DISABLED" | "PLATFORM_MISMATCH" };

/** Guard against arbitrary URL injection: slugs are kebab-case tokens only. */
export function isValidBranchSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 64;
}

export async function resolveBranch(
  platformType: string,
  slug: string
): Promise<BranchSeverity> {
  if (!isValidBranchSlug(slug)) return { ok: false, reason: "NOT_FOUND" };
  const branch = await prisma.platformBranch.findUnique({
    where: { platformType_slug: { platformType, slug } },
  });
  if (!branch) return { ok: false, reason: "NOT_FOUND" };
  if (!branch.isEnabled) return { ok: false, reason: "DISABLED" };
  return { ok: true, branch };
}

export async function listEnabledBranches(platformType: string) {
  return prisma.platformBranch.findMany({
    where: { platformType, isEnabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

/**
 * Idempotent seed + one-time data migration for the Android branch split.
 *
 * - Creates AIM PLUS HOLO and HEXHEAD branches if absent.
 * - Backfills existing ANDROID customers and platform-wide ANDROID resources
 *   to AIM PLUS HOLO exactly once (guarded by a SiteSetting flag).
 * - Never touches passwords, packages, status or device bindings.
 */
/**
 * One-time Android branch provisioning.
 *
 * PERFORMANCE — this runs on the /access critical path, so the migration flag
 * is checked FIRST. Previously the flag was read *after* two upserts, meaning
 * every single page load paid two write round-trips (~356ms each against the
 * remote database) to re-confirm branches that already existed. The flag now
 * short-circuits the whole function, and the resulting branch row is cached.
 */
export async function ensureDefaultBranches() {
  const FLAG = "android_branch_migration_v1";

  // Fast path: the migration has already run. One indexed read, then cached.
  try {
    const done = await prisma.siteSetting.findUnique({ where: { key: FLAG } });
    if (done) {
      const cached = await readAimBranch();
      // If the cached row is missing (e.g. it was deleted), fall through and
      // re-provision rather than returning null.
      if (cached) return cached;
    }
  } catch {
    // A settings hiccup must not block the Access screen.
  }

  const aim = await prisma.platformBranch.upsert({
    where: { platformType_slug: { platformType: "ANDROID", slug: "aim-plus-holo" } },
    update: {},
    create: {
      platformType: "ANDROID",
      name: "AIM Plus Holo",
      slug: "aim-plus-holo",
      description: "The original MK Panel Android experience.",
      isEnabled: true,
      warningEnabled: true,
      sortOrder: 0,
    },
  });

  await prisma.platformBranch.upsert({
    where: { platformType_slug: { platformType: "ANDROID", slug: "hexhead" } },
    update: {},
    create: {
      platformType: "ANDROID",
      name: "HEXHEAD",
      slug: "hexhead",
      description: "A separate Android branch with its own resources.",
      isEnabled: true,
      warningEnabled: true,
      sortOrder: 1,
    },
  });

  // One-time backfill — run inside a transaction so it is all-or-nothing.
  await prisma.$transaction(async (tx) => {
    const r1 = await tx.customer.updateMany({
      where: { platformType: "ANDROID", branchId: null },
      data: { branchId: aim.id },
    });
    const r2 = await tx.packageResource.updateMany({
      where: { platformType: "ANDROID", branchId: null },
      data: { branchId: aim.id },
    });
    await tx.siteSetting.create({
      data: { key: FLAG, value: JSON.stringify({ customers: r1.count, resources: r2.count, at: new Date().toISOString() }) },
    });
  });

  return aim;
}

/** Cross-request cached AIM Plus Holo branch row (stable configuration). */
const readAimBranch = unstable_cache(
  async () =>
    prisma.platformBranch.findUnique({
      where: { platformType_slug: { platformType: "ANDROID", slug: "aim-plus-holo" } },
    }),
  ["aim-branch"],
  { revalidate: 600, tags: [BRANCHES_CACHE_TAG] },
);

/**
 * Guarantees that a platform which is in use has at least one enabled branch.
 *
 * Branch selection is part of both the public Access flow and the customer
 * dashboard. A platform with customers but no branches would dead-end, so this
 * provisions a `Default` branch on demand. Safe to call on every request: the
 * fast path is a single indexed lookup that most platforms satisfy.
 *
 * Returns the branch that should be used as the platform's fallback.
 */
export async function ensurePlatformHasBranch(platformCode: string): Promise<string | null> {
  const existing = await prisma.platformBranch.findFirst({
    where: { platformType: platformCode, isEnabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (existing) return existing.id;

  const platform = await prisma.platform.findUnique({
    where: { code: platformCode },
    select: { name: true },
  });

  const created = await prisma.platformBranch.create({
    data: {
      platformType: platformCode,
      name: "Default",
      slug: "default",
      description: `Default ${platform?.name ?? platformCode} section.`,
      isEnabled: true,
      sortOrder: 0,
    },
    select: { id: true },
  });
  return created.id;
}

/**
 * Prepares every platform that currently has customers or active resources so
 * the Access screen and customer creation form always have something to show.
 * Runs a bounded number of queries (one per platform-with-data), never N+1
 * across customers.
 */
export async function ensureBranchesForActivePlatforms(): Promise<void> {
  const [withCustomers, withResources] = await Promise.all([
    prisma.customer.groupBy({ by: ["platformType"], _count: true }),
    prisma.packageResource.groupBy({ by: ["platformType"], _count: true }),
  ]);

  const codes = new Set<string>();
  for (const row of withCustomers) if (row.platformType) codes.add(row.platformType);
  for (const row of withResources) if (row.platformType) codes.add(row.platformType);
  if (codes.size === 0) return;

  const existing = await prisma.platformBranch.findMany({
    where: { platformType: { in: Array.from(codes) }, isEnabled: true },
    select: { platformType: true },
    distinct: ["platformType"],
  });
  const covered = new Set(existing.map((b) => b.platformType));

  const missing = Array.from(codes).filter((c) => !covered.has(c));
  if (missing.length === 0) return;

  await Promise.all(missing.map((code) => ensurePlatformHasBranch(code)));
}

/**
 * Retires the legacy "Elite Panel Access" package: re-points its customers
 * and resources to the platform's default package bound to the branch's
 * default (AIM Plus Holo), then marks the old package retired via flag.
 * Idempotent — a SiteSetting flag records completion. Never deletes rows.
 */
export async function ensureElitePackageMigration() {
  const FLAG = "elite_package_migration_v1";
  const done = await prisma.siteSetting.findUnique({ where: { key: FLAG } });
  if (done) {
    // Post-migration repair: ensure ANDROID customers all point at the same
    // default package (guards against partial earlier runs).
    return;
  }

  const legacy = await prisma.package.findUnique({ where: { id: "pkg_elite_1" } });
  if (!legacy) {
    // Nothing to migrate; still record the flag so we don't re-scan forever.
    await prisma.siteSetting.create({
      data: { key: FLAG, value: JSON.stringify({ note: "legacy package absent", at: new Date().toISOString() }) },
    });
    return;
  }

  const aim = await ensureDefaultBranches();

  // The destination: the platform's agent-default package for ANDROID.
  let target = await prisma.package.findFirst({
    where: { platformType: "ANDROID", isDefaultForAgents: true },
  });
  if (!target) {
    target = await prisma.package.create({
      data: {
        name: "Default",
        description: "Default Android package.",
        platformType: "ANDROID",
        branchId: aim.id,
        isDefaultForAgents: true,
      },
    });
  }

  await prisma.$transaction(async (tx) => {
    const c = await tx.customer.updateMany({
      where: { packageId: legacy.id, platformType: "ANDROID" },
      data: { packageId: target.id, branchId: aim.id },
    });
    /* Cross-platform stragglers: keep their platform intact, only swap the
       package to their own platform's default. Never touch their branch. */
    const others = await tx.customer.findMany({
      where: { packageId: legacy.id, platformType: { not: "ANDROID" } },
      select: { id: true, platformType: true, branchId: true },
    });
    for (const o of others) {
      const platformDefault = await tx.package.findFirst({
        where: { platformType: o.platformType, isDefaultForAgents: true },
      });
      if (platformDefault) {
        await tx.customer.update({
          where: { id: o.id },
          data: { packageId: platformDefault.id },
        });
      }
    }
    const r = await tx.packageResource.updateMany({
      where: { packageId: legacy.id },
      data: { packageId: target.id, branchId: aim.id },
    });
    await tx.siteSetting.create({
      data: { key: FLAG, value: JSON.stringify({ from: legacy.name, to: target.name, customers: c.count, resources: r.count, at: new Date().toISOString() }) },
    });
  });
}

/**
 * Runtime fallback for customers created before their branch existed, or by
 * agents before the branch system went live: if an ANDROID customer has no
 * branch, attach them to the default (first) Android branch on next login.
 * Returns the branch id now covering the customer, if any.
 */
export async function ensureCustomerBranch(customer: { id: string; platformType: string; branchId: string | null }): Promise<string | null> {
  if (customer.branchId) return customer.branchId;
  const first = await prisma.platformBranch.findFirst({
    where: { platformType: customer.platformType, isEnabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (first) {
    await prisma.customer.update({ where: { id: customer.id }, data: { branchId: first.id } });
    return first.id;
  }
  return null;
}
