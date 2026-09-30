import { prisma } from "@/lib/prisma";
import type { PlatformBranch } from "@prisma/client";

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
export async function ensureDefaultBranches() {
  const FLAG = "android_branch_migration_v1";

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

  const done = await prisma.siteSetting.findUnique({ where: { key: FLAG } });
  if (done) return aim;

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
