import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

/**
 * CUSTOMER ENTITLEMENTS — the access model.
 *
 * One customer identity (one User ID + one password) can hold MANY independent
 * accesses: different platforms, branches and packages, each with its OWN
 * paid/unpaid state and its OWN expiry.
 *
 * Migration safety: the legacy single-access columns on Customer
 * (platformType / branchId / packageId / paymentStatus / expiresAt) are still
 * populated and are used as a CONTROLLED FALLBACK whenever a customer has no
 * entitlement rows — so a session created before this change keeps working
 * without forcing anyone to log in again.
 */

export const ENTITLEMENT_COOKIE = "access_entitlement";

export type EntitlementRecord = {
  id: string;
  customerId: string;
  platformType: string;
  branchId: string | null;
  packageId: string | null;
  paymentStatus: string;
  status: string;
  startsAt: Date | null;
  expiresAt: Date | null;
  source: string;
};

/** All entitlements for a customer, newest first. */
export const listCustomerEntitlements = cache(
  async (customerId: string): Promise<EntitlementRecord[]> => {
    return prisma.customerEntitlement.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerId: true,
        platformType: true,
        branchId: true,
        packageId: true,
        paymentStatus: true,
        status: true,
        startsAt: true,
        expiresAt: true,
        source: true,
      },
    });
  },
);

/** Expiry check — a null expiry means permanent. */
export function isEntitlementExpired(e: { expiresAt: Date | null }): boolean {
  if (!e.expiresAt) return false;
  return new Date(e.expiresAt).getTime() <= Date.now();
}

export function isEntitlementPaid(e: { paymentStatus: string }): boolean {
  return (e.paymentStatus || "").toUpperCase() === "PAID";
}

/**
 * The entitlement the current browser session is operating under.
 *
 * Reads the entitlement id the login action stored, then verifies it still
 * belongs to the signed-in customer (a stale/forged cookie must never grant
 * access to someone else's entitlement). Falls back to the customer's legacy
 * access when there is no cookie or it no longer resolves.
 */
export async function getSessionEntitlement(customer: {
  id: string;
  platformType: string;
  branchId: string | null;
  packageId: string | null;
  paymentStatus: string;
  expiresAt: Date | null;
}): Promise<EntitlementRecord> {
  const cookieStore = await cookies();
  const requestedId = cookieStore.get(ENTITLEMENT_COOKIE)?.value;

  if (requestedId) {
    const row = await prisma.customerEntitlement.findFirst({
      where: { id: requestedId, customerId: customer.id },
      select: {
        id: true,
        customerId: true,
        platformType: true,
        branchId: true,
        packageId: true,
        paymentStatus: true,
        status: true,
        startsAt: true,
        expiresAt: true,
        source: true,
      },
    });
    if (row) return row;
  }

  /* Fallback: the customer's own access rows, or — for a customer who has not
     been migrated — a synthetic entitlement built from the legacy columns. */
  const any = await prisma.customerEntitlement.findFirst({
    where: { customerId: customer.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      customerId: true,
      platformType: true,
      branchId: true,
      packageId: true,
      paymentStatus: true,
      status: true,
      startsAt: true,
      expiresAt: true,
      source: true,
    },
  });
  if (any) return any;

  return {
    id: "",
    customerId: customer.id,
    platformType: customer.platformType,
    branchId: customer.branchId,
    packageId: customer.packageId,
    paymentStatus: customer.paymentStatus,
    status: "active",
    startsAt: null,
    expiresAt: customer.expiresAt,
    source: "LEGACY",
  };
}

/**
 * Finds the entitlement matching a login attempt's platform + branch.
 *
 * Returns null when the customer has no access for that context, which the
 * login action reports with a neutral message that does not reveal what the
 * account does own.
 */
export async function findEntitlementForContext(
  customerId: string,
  platformType: string,
  branchId: string | null,
): Promise<EntitlementRecord | null> {
  const rows = await prisma.customerEntitlement.findMany({
    where: { customerId, platformType },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      customerId: true,
      platformType: true,
      branchId: true,
      packageId: true,
      paymentStatus: true,
      status: true,
      startsAt: true,
      expiresAt: true,
      source: true,
    },
  });

  if (rows.length === 0) return null;

  // A branch-specific request must match that branch. A platform-wide
  // entitlement (branchId null) covers any branch of that platform.
  if (branchId) {
    const exact = rows.find((r) => r.branchId === branchId);
    if (exact) return exact;
    const platformWide = rows.find((r) => r.branchId === null);
    if (platformWide) return platformWide;
    return null;
  }

  // No branch requested: prefer a platform-wide entitlement, else the first.
  return rows.find((r) => r.branchId === null) ?? rows[0];
}

/** Summary counts for the admin customer detail header. */
export function summarizeEntitlements(rows: EntitlementRecord[]) {
  let paid = 0;
  let unpaid = 0;
  let expired = 0;
  let disabled = 0;

  for (const e of rows) {
    if (e.status !== "active") {
      disabled++;
      continue;
    }
    if (isEntitlementExpired(e)) {
      expired++;
      continue;
    }
    if (isEntitlementPaid(e)) paid++;
    else unpaid++;
  }

  return { total: rows.length, paid, unpaid, expired, disabled };
}
