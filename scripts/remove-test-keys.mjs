/**
 * One-off cleanup: delete the demo/test Free Panel keys created during
 * development (pattern: MKPC-* / *-DEMO). Owner batches are never touched.
 * Run: node scripts/remove-test-keys.mjs          (dry run)
 *      node scripts/remove-test-keys.mjs --yes    (delete)
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const CONFIRM = process.argv.includes("--yes");
const TEST_PATTERN = /^(MKPC-|.*-DEMO.*$)/i;

const prisma = new PrismaClient();

async function main() {
  const testKeys = await prisma.freePanelKey.findMany({
    where: { keyValue: { contains: "MKPC" } },
    select: { id: true, keyValue: true, status: true, claimId: true },
  });
  const demoKeys = await prisma.freePanelKey.findMany({
    where: { keyValue: { contains: "-DEMO" } },
    select: { id: true, keyValue: true, status: true, claimId: true },
  });

  const merged = new Map();
  for (const k of [...testKeys, ...demoKeys]) merged.set(k.id, k);
  const keys = [...merged.values()];

  const byStatus = keys.reduce((acc, k) => { acc[k.status] = (acc[k.status] || 0) + 1; return acc; }, {});
  const claimed = keys.filter((k) => k.claimId).length;

  console.log(JSON.stringify({ matched: keys.length, byStatus, withClaim: claimed }, null, 2));
  console.log(keys.map((k) => `${k.keyValue} [${k.status}]${k.claimId ? " (claimed)" : ""}`).join("\n"));

  if (!CONFIRM) {
    console.log("\nDRY RUN — rerun with --yes to delete.");
    return;
  }

  const ids = keys.map((k) => k.id);
  const res = await prisma.freePanelKey.deleteMany({ where: { id: { in: ids } } });
  const total = await prisma.freePanelKey.count();
  const available = await prisma.freePanelKey.count({ where: { status: "AVAILABLE" } });
  console.log(`\nDeleted: ${res.count}. DB totals: ${total} keys, ${available} available.`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
