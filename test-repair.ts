import { prisma } from "./src/lib/prisma";
import { ensureDefaultPackages } from "./src/lib/auto-repair";

async function main() {
  console.log("Running auto-repair...");
  await ensureDefaultPackages();
  console.log("Auto-repair done.");

  const packages = await prisma.package.findMany();
  console.log("Packages in DB:", packages.map(p => ({ platform: p.platformType, name: p.name, isDefault: p.isDefaultForAgents })));
}

main().catch(console.error);
