import { prisma } from "@/lib/prisma";
import { listAllPlatforms } from "@/lib/platforms";

/**
 * Ensures every platform has a branch bound to it and a default agent package,
 * so a newly created platform is immediately usable by agents and customers
 * without any manual setup.
 *
 * Idempotent and cheap: it only writes what is genuinely missing.
 */
export async function ensureDefaultPackages() {
  const platforms = await listAllPlatforms();

  for (const platform of platforms) {
    const existing = await prisma.package.findFirst({
      where: { platformType: platform.code, isDefaultForAgents: true },
      select: { id: true },
    });
    if (existing) continue;

    const branch = await prisma.platformBranch.findFirst({
      where: { platformType: platform.code, isEnabled: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });

    await prisma.package.create({
      data: {
        name: `Default ${platform.name} Package`,
        description: `Auto-generated default package for the ${platform.name} platform.`,
        platformType: platform.code,
        branchId: branch?.id ?? null,
        isDefaultForAgents: true,
      },
    });
  }
}

/**
 * Guarantees a platform has at least one enabled branch, creating a `Default`
 * one when the platform has activity but no branches. Returns the branch id
 * that should be used as the fallback for that platform.
 */
export async function ensurePlatformBranch(platformCode: string): Promise<string | null> {
  const existing = await prisma.platformBranch.findFirst({
    where: { platformType: platformCode, isEnabled: true },
    orderBy: { sortOrder: "asc" },
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
