import { PrismaClient } from "@prisma/client";

/**
 * MIGRATE LEGACY CUSTOMERS → CUSTOMER ENTITLEMENTS
 *
 * Every existing customer currently expresses their access through single
 * Customer fields (platformType / branchId / packageId / paymentStatus /
 * expiresAt). The multi-access architecture represents that same access as a
 * CustomerEntitlement row, so one customer identity can hold many independent
 * accesses.
 *
 * This script backfills ONE initial entitlement per existing customer,
 * mirroring exactly what they already have. It is:
 *   - IDEMPOTENT: customers that already have an entitlement for their current
 *     platform+branch+package are skipped, so re-running is harmless.
 *   - NON-DESTRUCTIVE: it only INSERTs. No customer, credential, device
 *     binding, order or resource is modified, and the legacy columns are left
 *     intact as a controlled fallback.
 *   - ATOMIC PER CUSTOMER: each customer + entitlement pair is written in one
 *     transaction, so a failure cannot leave a half-migrated record.
 *
 * Run:  node scripts/migrate-entitlements.mjs
 * Dry:  node scripts/migrate-entitlements.mjs --dry-run
 */

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      identifier: true,
      platformType: true,
      branchId: true,
      packageId: true,
      paymentStatus: true,
      expiresAt: true,
      createdAt: true,
      entitlements: { select: { id: true, platformType: true, branchId: true, packageId: true } },
    },
  });

  let created = 0;
  let skipped = 0;
  const failures = [];

  for (const customer of customers) {
    // Already has an entitlement describing this exact access → nothing to do.
    const existing = customer.entitlements.some(
      (e) =>
        e.platformType === customer.platformType &&
        e.branchId === customer.branchId &&
        e.packageId === customer.packageId,
    );

    if (existing) {
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`[dry] would create entitlement for ${customer.identifier} (${customer.platformType})`);
      created++;
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.customerEntitlement.create({
          data: {
            customerId: customer.id,
            platformType: customer.platformType,
            branchId: customer.branchId,
            packageId: customer.packageId,
            // Mirrors the access the customer already had — never downgrades.
            paymentStatus: customer.paymentStatus === "UNPAID" ? "UNPAID" : "PAID",
            status: "active",
            startsAt: customer.createdAt,
            expiresAt: customer.expiresAt,
            source: "MIGRATED",
          },
        });
      });
      created++;
    } catch (error) {
      failures.push({ identifier: customer.identifier, error: String(error.message || error).slice(0, 160) });
    }
  }

  console.log("\n=== ENTITLEMENT MIGRATION ===");
  console.log("customers inspected:", customers.length);
  console.log("entitlements created:", created);
  console.log("already migrated (skipped):", skipped);
  console.log("failures:", failures.length);
  for (const f of failures) console.log("  FAILED", f.identifier, "-", f.error);

  // Verification
  const total = await prisma.customerEntitlement.count();
  const customerCount = await prisma.customer.count();
  const withoutEntitlement = await prisma.customer.count({ where: { entitlements: { none: {} } } });

  console.log("\n=== VERIFICATION ===");
  console.log("customers:", customerCount, "(must be unchanged)");
  console.log("total entitlements:", total);
  console.log("customers with NO entitlement:", withoutEntitlement, "(should be 0)");

  await prisma.$disconnect();
  if (failures.length > 0) process.exitCode = 1;
}

main().catch(async (e) => {
  console.error("MIGRATION FAILED:", e);
  await prisma.$disconnect();
  process.exit(1);
});
