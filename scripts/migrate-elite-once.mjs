/* One-off: migrate Elite Panel Access customers/resources to the Default Android Package + AIM Plus Holo. Flag-guarded, idempotent. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FLAG = "elite_package_migration_v1";

const done = await prisma.siteSetting.findUnique({ where: { key: FLAG } });
if (done) {
  console.log("Already migrated:", done.value);
  process.exit(0);
}

const legacy = await prisma.package.findUnique({ where: { id: "pkg_elite_1" } });
if (!legacy) {
  await prisma.siteSetting.create({ data: { key: FLAG, value: JSON.stringify({ note: "legacy package absent" }) } });
  console.log("Legacy package absent; flag set.");
  process.exit(0);
}

const aim = await prisma.platformBranch.findUnique({
  where: { platformType_slug: { platformType: "ANDROID", slug: "aim-plus-holo" } },
});
if (!aim) throw new Error("AIM Plus Holo branch missing");

let target = await prisma.package.findFirst({ where: { platformType: "ANDROID", isDefaultForAgents: true } });
if (!target) throw new Error("No default ANDROID package");

const r = await prisma.$transaction(async (tx) => {
  const c = await tx.customer.updateMany({
    where: { packageId: legacy.id },
    data: { packageId: target.id, branchId: aim.id },
  });
  const res = await tx.packageResource.updateMany({
    where: { packageId: legacy.id },
    data: { packageId: target.id, branchId: aim.id },
  });
  await tx.siteSetting.create({
    data: { key: FLAG, value: JSON.stringify({ from: legacy.name, to: target.name, customers: c.count, resources: res.count, at: new Date().toISOString() }) },
  });
  return { customers: c.count, resources: res.count };
});

console.log(`Migrated ${r.customers} customers + ${r.resources} resources from "${legacy.name}" to "${target.name}" (branch: AIM Plus Holo)`);

await prisma.$disconnect();
