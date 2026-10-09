import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const customers = await p.customer.count();
const withPlatform = await p.customer.count({ where: { platformType: { not: "" } } });
const paid = await p.customer.count({ where: { paymentStatus: "PAID" } });
const unpaid = await p.customer.count({ where: { paymentStatus: "UNPAID" } });
const withBranch = await p.customer.count({ where: { branchId: { not: null } } });
const withPackage = await p.customer.count({ where: { packageId: { not: null } } });
const withExpiry = await p.customer.count({ where: { expiresAt: { not: null } } });

console.log("=== BEFORE MIGRATION (baseline) ===");
console.log("customers:              ", customers);
console.log("  with platformType:    ", withPlatform);
console.log("  PAID:                 ", paid);
console.log("  UNPAID:               ", unpaid);
console.log("  with branch:          ", withBranch);
console.log("  with package:         ", withPackage);
console.log("  with expiry:          ", withExpiry);

try {
  const ent = await p.customerEntitlement.count();
  console.log("existing entitlements:  ", ent);
} catch {
  console.log("existing entitlements:   (table not created yet)");
}

await p.$disconnect();
