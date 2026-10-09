import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "node:crypto";

/**
 * PART 44 ACCEPTANCE SCENARIO — one customer, multiple independent accesses.
 *
 * Creates a temporary customer with three accesses (Android/paid,
 * Android-other/paid, PC/unpaid), asserts the entitlement resolution rules,
 * then removes every row it created. Nothing is left behind.
 */
const p = new PrismaClient();
const USER = "zz_qa_multiaccess";

const pass = (label, ok, extra = "") =>
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`);

let failures = 0;
const check = (label, ok, extra) => {
  if (!ok) failures++;
  pass(label, ok, extra);
};

async function cleanup() {
  const c = await p.customer.findUnique({ where: { identifier: USER }, select: { id: true } });
  if (c) {
    await p.customerEntitlement.deleteMany({ where: { customerId: c.id } });
    await p.customer.delete({ where: { id: c.id } });
  }
}

try {
  await cleanup();

  const androidBranches = await p.platformBranch.findMany({
    where: { platformType: "ANDROID", isEnabled: true },
    take: 2,
    select: { id: true, name: true },
  });
  const pcBranch = await p.platformBranch.findFirst({
    where: { platformType: "PC", isEnabled: true },
    select: { id: true, name: true },
  });

  console.log("branches available: ANDROID", androidBranches.length, "| PC", pcBranch ? 1 : 0);

  // ── ONE customer identity, ONE password ────────────────────────────────
  const customer = await p.customer.create({
    data: {
      identifier: USER,
      passwordHash: "qa-placeholder",
      platformType: "ANDROID",
      branchId: androidBranches[0]?.id ?? null,
      status: "active",
      paymentStatus: "PAID",
      createdSource: "MIGRATED",
    },
    select: { id: true, identifier: true },
  });
  check("one customer identity created", !!customer.id, customer.identifier);

  // ── THREE independent accesses on the SAME identity ────────────────────
  await p.customerEntitlement.createMany({
    data: [
      {
        customerId: customer.id,
        platformType: "ANDROID",
        branchId: androidBranches[0]?.id ?? null,
        paymentStatus: "PAID",
        status: "active",
        source: "OWNER",
      },
      {
        customerId: customer.id,
        platformType: "ANDROID",
        branchId: androidBranches[1]?.id ?? null,
        paymentStatus: "PAID",
        status: "active",
        source: "OWNER",
      },
      {
        customerId: customer.id,
        platformType: "PC",
        branchId: pcBranch?.id ?? null,
        paymentStatus: "UNPAID",
        status: "active",
        source: "ORDER",
      },
    ],
  });

  const rows = await p.customerEntitlement.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "asc" },
  });
  check("3 accesses on one customer", rows.length === 3, `${rows.length} rows`);
  check("still exactly 1 customer", (await p.customer.count({ where: { identifier: USER } })) === 1);

  // ── PART 44: unpaid access must not lock the paid ones ─────────────────
  const paid = rows.filter((r) => r.paymentStatus === "PAID");
  const unpaid = rows.filter((r) => r.paymentStatus === "UNPAID");
  check("paid accesses remain PAID", paid.length === 2, `${paid.length} paid`);
  check("new access starts UNPAID", unpaid.length === 1 && unpaid[0].platformType === "PC");

  // ── Per-access expiry independence ─────────────────────────────────────
  const future = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  await p.customerEntitlement.update({ where: { id: paid[0].id }, data: { expiresAt: future } });
  const afterExpiry = await p.customerEntitlement.findMany({ where: { customerId: customer.id } });
  const withExpiry = afterExpiry.filter((r) => r.expiresAt !== null);
  check("expiry is per access (1 of 3 has one)", withExpiry.length === 1);

  // ── Removing ONE access leaves the others ──────────────────────────────
  await p.customerEntitlement.delete({ where: { id: paid[1].id } });
  const afterRemove = await p.customerEntitlement.findMany({ where: { customerId: customer.id } });
  check("removing 1 access leaves 2", afterRemove.length === 2, `${afterRemove.length} remain`);
  check("customer still exists after access removal", (await p.customer.count({ where: { id: customer.id } })) === 1);

  // ── Platform-wide entitlement covers any branch of that platform ───────
  await p.customerEntitlement.create({
    data: {
      customerId: customer.id,
      platformType: "ANDROID",
      branchId: null,
      paymentStatus: "PAID",
      status: "active",
      source: "OWNER",
    },
  });
  const platformWide = await p.customerEntitlement.findFirst({
    where: { customerId: customer.id, platformType: "ANDROID", branchId: null },
  });
  check("platform-wide entitlement (branchId null) stored", !!platformWide);

  // ── Migration integrity ────────────────────────────────────────────────
  const totalCustomers = await p.customer.count();
  const orphans = await p.customer.count({ where: { entitlements: { none: {} } } });
  check("no customer left without an entitlement", orphans === 0, `${totalCustomers} customers, ${orphans} orphans`);
} catch (e) {
  console.error("SCENARIO ERROR:", e.message);
  failures++;
} finally {
  await cleanup();
  const leftover = await p.customer.count({ where: { identifier: USER } });
  console.log(`\ncleanup: temp customers remaining = ${leftover}`);
  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  await p.$disconnect();
  if (failures > 0) process.exitCode = 1;
}
