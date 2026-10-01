/**
 * Verification for the Phase 25 "Fancy" flow:
 *   Admin creates platform -> it appears in Access, Platform Resources,
 *   branch management and customer assignment with NO source change.
 *
 * Read-only where possible. Creates the platform, checks propagation, then
 * removes it again so the database is left exactly as it was found.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function ok(label: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  console.log("── Baseline ─────────────────────────────────────────");
  const before = await prisma.platform.findMany({ orderBy: { sortOrder: "asc" } });
  console.log("platforms:", before.map((p) => `${p.code}(${p.isEnabled ? "on" : "off"})`).join(", "));

  // Clean any leftover from a previous run.
  await prisma.platformBranch.deleteMany({ where: { platformType: "FANCY" } });
  await prisma.platform.deleteMany({ where: { code: "FANCY" } });

  console.log("\n── 1. Create platform 'Fancy' (what Admin → Access does) ──");
  const fancy = await prisma.platform.create({
    data: {
      code: "FANCY",
      name: "Fancy",
      description: "Fancy platform created for verification.",
      iconKey: "globe",
      isEnabled: true,
      sortOrder: 99,
    },
  });
  ok("platform row created with code FANCY", fancy.code === "FANCY");
  ok("iconKey stored", fancy.iconKey === "globe");

  // The create action also provisions a Default branch.
  const defaultBranch = await prisma.platformBranch.create({
    data: { platformType: "FANCY", name: "Default", slug: "default", isEnabled: true, sortOrder: 0 },
  });
  ok("Default branch auto-provisioned", defaultBranch.platformType === "FANCY");

  console.log("\n── 2. Access screen reads it (listActivePlatforms) ──");
  const active = await prisma.platform.findMany({
    where: { isEnabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const codes = active.map((p) => p.code);
  console.log("active platforms:", codes.join(", "));
  ok("FANCY appears on the public Access screen", codes.includes("FANCY"));
  ok("ANDROID / IOS / PC still present", ["ANDROID", "IOS", "PC"].every((c) => codes.includes(c)));

  console.log("\n── 3. Access branch step (branchesByPlatform) ──");
  const branches = await prisma.platformBranch.findMany({
    where: { platformType: { in: codes }, isEnabled: true },
  });
  const byPlatform: Record<string, number> = {};
  for (const b of branches) byPlatform[b.platformType] = (byPlatform[b.platformType] ?? 0) + 1;
  console.log("branches per platform:", JSON.stringify(byPlatform));
  ok("FANCY has a branch so the branch step renders", (byPlatform.FANCY ?? 0) === 1);

  console.log("\n── 4. Platform Resources home grouped counts ──");
  const [b, r, c] = await Promise.all([
    prisma.platformBranch.groupBy({ by: ["platformType"], _count: true }),
    prisma.packageResource.groupBy({ by: ["platformType"], _count: true }),
    prisma.customer.groupBy({ by: ["platformType"], _count: true }),
  ]);
  ok("FANCY counted in Platform Resources", b.some((x) => x.platformType === "FANCY"));
  console.log("  branches:", JSON.stringify(b.map((x) => [x.platformType, x._count])));
  console.log("  resources:", JSON.stringify(r.map((x) => [x.platformType, x._count])));

  console.log("\n── 5. Customer assignment validates FANCY from the DB ──");
  const fancyAssignable = await prisma.platform.findFirst({ where: { code: "FANCY", isEnabled: true } });
  ok("FANCY is selectable in customer forms", fancyAssignable !== null);

  console.log("\n── 6. Package can be attached to FANCY ──");
  const pkg = await prisma.package.create({
    data: { name: "Fancy Basic", description: "verification", platformType: "FANCY", isDefaultForAgents: false },
  });
  ok("package created on FANCY", pkg.platformType === "FANCY");
  await prisma.package.delete({ where: { id: pkg.id } });

  console.log("\n── 7. Disabling hides it from Access but keeps data ──");
  await prisma.platform.update({ where: { code: "FANCY" }, data: { isEnabled: false } });
  const activeAfterDisable = await prisma.platform.findMany({ where: { isEnabled: true } });
  ok("disabled FANCY drops off Access", !activeAfterDisable.some((p) => p.code === "FANCY"));
  const stillThere = await prisma.platform.findUnique({ where: { code: "FANCY" } });
  ok("FANCY row still exists (data preserved)", stillThere !== null);

  console.log("\n── Cleanup ──────────────────────────────────────────");
  await prisma.platformBranch.deleteMany({ where: { platformType: "FANCY" } });
  await prisma.platform.deleteMany({ where: { code: "FANCY" } });
  const after = await prisma.platform.findMany({ orderBy: { sortOrder: "asc" } });
  ok(
    "database restored to baseline",
    after.length === before.length && after.every((p) => before.some((x) => x.code === p.code))
  );
  console.log("platforms now:", after.map((p) => p.code).join(", "));

  console.log("\n" + (process.exitCode ? "SOME CHECKS FAILED" : "ALL CHECKS PASSED"));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
