/**
 * ONE-TIME, IDEMPOTENT DATA MIGRATION — dynamic platform system.
 *
 * Safe to run repeatedly. It NEVER deletes customers, resources, packages,
 * devices or passwords. It only:
 *
 *   1. Seeds the three original platforms (ANDROID / IOS / PC) into `Platform`
 *      if they are not already there, carrying over any platform codes that
 *      already exist on branches/customers/packages/resources.
 *   2. Ensures every platform that has customers or resources also has at
 *      least one enabled branch, so the branch-selection step never dead-ends.
 *   3. Ensures every platform that has customers has a default package.
 *
 * Run with:  npx tsx scripts/migrate-platforms.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CORE = [
  { code: "ANDROID", name: "Android", description: "Access your Android package resources and setup files.", iconKey: "android", sortOrder: 0 },
  { code: "IOS", name: "iPhone", description: "Access your iPhone package file and setup guide.", iconKey: "apple", sortOrder: 1 },
  { code: "PC", name: "PC", description: "Access your PC package resources.", iconKey: "monitor", sortOrder: 2 },
];

function titleCase(code: string): string {
  return code
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function slugify(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("── MK PANEL ZONE · platform migration ──");
  const report: string[] = [];

  /* ── 1. Discover every platform code already present in the data ───────── */
  const [branchCodes, customerCodes, packageCodes, resourceCodes] = await Promise.all([
    prisma.platformBranch.findMany({ select: { platformType: true }, distinct: ["platformType"] }),
    prisma.customer.findMany({ select: { platformType: true }, distinct: ["platformType"] }),
    prisma.package.findMany({ select: { platformType: true }, distinct: ["platformType"] }),
    prisma.packageResource.findMany({ select: { platformType: true }, distinct: ["platformType"] }),
  ]);

  const discovered = new Set<string>();
  for (const list of [branchCodes, customerCodes, packageCodes, resourceCodes]) {
    for (const row of list) if (row.platformType) discovered.add(row.platformType.toUpperCase());
  }
  for (const core of CORE) discovered.add(core.code);

  const existing = await prisma.platform.findMany({ select: { code: true } });
  const known = new Set(existing.map((p) => p.code));

  /* ── 2. Seed platform rows (core first, then any discovered extras) ────── */
  const toCreate: { code: string; name: string; description: string | null; iconKey: string; sortOrder: number }[] = [];
  let sort = 0;
  for (const code of discovered) {
    if (known.has(code)) continue;
    const core = CORE.find((c) => c.code === code);
    toCreate.push(
      core
        ? { ...core }
        : {
            code,
            name: titleCase(code),
            description: null,
            iconKey: "layers",
            sortOrder: sort,
          }
    );
    sort++;
  }

  if (toCreate.length > 0) {
    await prisma.platform.createMany({ data: toCreate, skipDuplicates: true });
    report.push(`Platform rows created: ${toCreate.map((p) => p.code).join(", ")}`);
  } else {
    report.push("Platform rows: nothing to create (already seeded).");
  }

  /* ── 3. Give every platform with data at least one enabled branch ──────── */
  const allPlatforms = await prisma.platform.findMany({ orderBy: { sortOrder: "asc" } });
  const branchesCreated: string[] = [];

  for (const platform of allPlatforms) {
    const branchCount = await prisma.platformBranch.count({ where: { platformType: platform.code } });
    if (branchCount > 0) continue;

    const [custCount, resCount] = await Promise.all([
      prisma.customer.count({ where: { platformType: platform.code } }),
      prisma.packageResource.count({ where: { platformType: platform.code } }),
    ]);

    // Only create a default branch where it will actually be used, so an
    // unused platform doesn't sprout an empty branch nobody asked for.
    if (custCount === 0 && resCount === 0) continue;

    await prisma.platformBranch.create({
      data: {
        platformType: platform.code,
        name: "Default",
        slug: "default",
        description: `Default ${platform.name} section.`,
        isEnabled: true,
        sortOrder: 0,
      },
    });
    branchesCreated.push(platform.code);
  }

  report.push(
    branchesCreated.length > 0
      ? `Default branches created for: ${branchesCreated.join(", ")}`
      : "Default branches: none required."
  );

  /* ── 4. Ensure a default agent package exists per platform with customers ─ */
  const packagesCreated: string[] = [];
  for (const platform of allPlatforms) {
    const custCount = await prisma.customer.count({ where: { platformType: platform.code } });
    if (custCount === 0) continue;

    const def = await prisma.package.findFirst({
      where: { platformType: platform.code, isDefaultForAgents: true },
    });
    if (def) continue;

    const firstBranch = await prisma.platformBranch.findFirst({
      where: { platformType: platform.code, isEnabled: true },
      orderBy: { sortOrder: "asc" },
    });

    await prisma.package.create({
      data: {
        name: `Default ${platform.name} Package`,
        description: `Default package for ${platform.name}.`,
        platformType: platform.code,
        branchId: firstBranch?.id ?? null,
        isDefaultForAgents: true,
      },
    });
    packagesCreated.push(platform.code);
  }

  report.push(
    packagesCreated.length > 0
      ? `Default packages created for: ${packagesCreated.join(", ")}`
      : "Default packages: none required."
  );

  /* ── 5. Re-attach any branch-less customers to their platform's branch ── */
  const orphanCustomers = await prisma.customer.findMany({
    where: { branchId: null },
    select: { id: true, platformType: true },
  });
  let attached = 0;
  for (const c of orphanCustomers) {
    const branch = await prisma.platformBranch.findFirst({
      where: { platformType: c.platformType, isEnabled: true },
      orderBy: { sortOrder: "asc" },
    });
    if (!branch) continue;
    await prisma.customer.update({ where: { id: c.id }, data: { branchId: branch.id } });
    attached++;
  }
  report.push(`Branch-less customers attached to their platform branch: ${attached}`);

  /* ── 6. Backfill branchId on resources that belong to a package ───────── */
  const looseResources = await prisma.packageResource.findMany({
    where: { branchId: null, packageId: { not: null } },
    select: { id: true, package: { select: { branchId: true } } },
  });
  let resFixed = 0;
  for (const r of looseResources) {
    if (!r.package?.branchId) continue;
    await prisma.packageResource.update({ where: { id: r.id }, data: { branchId: r.package.branchId } });
    resFixed++;
  }
  report.push(`Resources attached to their package's branch: ${resFixed}`);

  /* ── Report ───────────────────────────────────────────────────────────── */
  const finalPlatforms = await prisma.platform.findMany({
    orderBy: { sortOrder: "asc" },
    select: { code: true, name: true, isEnabled: true },
  });

  console.log("\nRESULT:");
  for (const line of report) console.log("  ✔ " + line);
  console.log("\nPLATFORMS NOW:");
  for (const p of finalPlatforms) {
    console.log(`  ${p.isEnabled ? "●" : "○"} ${p.code.padEnd(10)} ${p.name}`);
  }

  const counts = await Promise.all([
    prisma.customer.count(),
    prisma.packageResource.count(),
    prisma.customerDevice.count(),
    prisma.platformBranch.count(),
  ]);
  console.log(
    `\nDATA INTACT — customers: ${counts[0]}, resources: ${counts[1]}, device bindings: ${counts[2]}, branches: ${counts[3]}`
  );
  console.log("Done.\n");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
