/**
 * Additive migration — PAID/UNPAID access + richer resource types.
 *
 * Safe by construction:
 *   • ADD COLUMN IF NOT EXISTS only (no drops, no type changes, no resets).
 *   • Existing customers receive paymentStatus = 'PAID', which preserves the
 *     access they already had. Nobody becomes unpaid by accident.
 *   • Re-runnable; it reports row counts before and after.
 *
 * Usage: node scripts/migrate-payment-status.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STATEMENTS = [
  // Access gate -----------------------------------------------------------
  `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'PAID'`,
  `CREATE INDEX IF NOT EXISTS "Customer_paymentStatus_createdAt_idx" ON "Customer" ("paymentStatus", "createdAt" DESC)`,

  // Resource content columns ---------------------------------------------
  `ALTER TABLE "PackageResource" ADD COLUMN IF NOT EXISTS "bodyText" TEXT`,
  `ALTER TABLE "PackageResource" ADD COLUMN IF NOT EXISTS "accentStyle" TEXT NOT NULL DEFAULT 'DEFAULT'`,
];

const before = await prisma.$queryRawUnsafe(
  `SELECT COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE "paymentStatus" = 'UNPAID')::int AS unpaid
   FROM "Customer"`
).catch(async () => {
  const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS total FROM "Customer"`);
  return [{ total: rows[0].total, unpaid: null }];
});

console.log(`before: ${JSON.stringify(before[0])}`);

for (const sql of STATEMENTS) {
  await prisma.$executeRawUnsafe(sql);
  console.log('ok:', sql.slice(0, 78));
}

const after = await prisma.$queryRawUnsafe(
  `SELECT COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE "paymentStatus" = 'PAID')::int AS paid,
          COUNT(*) FILTER (WHERE "paymentStatus" = 'UNPAID')::int AS unpaid
   FROM "Customer"`
);
console.log(`after:  ${JSON.stringify(after[0])}`);

const res = await prisma.$queryRawUnsafe(
  `SELECT COUNT(*)::int AS total, COUNT("bodyText")::int AS withBody FROM "PackageResource"`
);
console.log(`resources: ${JSON.stringify(res[0])}`);

await prisma.$disconnect();
