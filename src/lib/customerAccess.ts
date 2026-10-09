import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Customer, PlatformBranch } from "@prisma/client";

/**
 * CUSTOMER ACCESS GATE — server-side only.
 *
 * Everything a paying customer may see passes through `getPaidAccess()`.
 * The gate is enforced where the data is READ (server), never by hiding markup
 * in the browser: an unpaid customer is never sent file URLs, links, passwords,
 * resource metadata or tutorial links in the first place.
 *
 * Because the customer row is re-read on every request, flipping PAID → UNPAID
 * revokes protected access even for an already-open session.
 */

export const PAYMENT_PAID = "PAID";
export const PAYMENT_UNPAID = "UNPAID";

export type PaymentStatus = typeof PAYMENT_PAID | typeof PAYMENT_UNPAID;

export function normalizePaymentStatus(value: string | null | undefined): PaymentStatus {
  return (value || "").toUpperCase() === PAYMENT_UNPAID ? PAYMENT_UNPAID : PAYMENT_PAID;
}

export type SessionCustomer = Customer & { branch: PlatformBranch | null };

/**
 * Reads the logged-in customer once per request (React cache dedupes the many
 * call sites — layout, page, actions — into a single query).
 */
export const getSessionCustomer = cache(async (): Promise<SessionCustomer | null> => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;
  if (!sessionId) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: sessionId },
    include: { branch: true },
  });

  return customer ?? null;
});

export type AccessState =
  | { kind: "ANONYMOUS" }
  | { kind: "BLOCKED_STATUS"; customer: SessionCustomer }
  | { kind: "BLOCKED_BRANCH"; customer: SessionCustomer }
  | { kind: "BLOCKED_PAYMENT"; customer: SessionCustomer }
  | { kind: "BLOCKED_EXPIRED"; customer: SessionCustomer }
  | { kind: "GRANTED"; customer: SessionCustomer };

/**
 * The single decision point for protected customer content.
 *
 * MULTI-ACCESS: a customer identity can own several independent accesses, so
 * the decision is made against the ENTITLEMENT this session is operating under
 * (resolved from the session cookie), not against one account-wide flag:
 *
 *   - Customer.status stays ACCOUNT-WIDE (administrative suspension).
 *   - paymentStatus / expiresAt / branch are evaluated PER ENTITLEMENT, so an
 *     unpaid or expired access only locks that access — the customer's other
 *     paid accesses keep working.
 *
 * Legacy accounts with no entitlement rows fall back to the customer's own
 * fields, so nothing regresses for existing users.
 *
 * FAIL CLOSED: anything unexpected denies rather than grants.
 */
export const getPaidAccess = cache(async (): Promise<AccessState> => {
  const customer = await getSessionCustomer();
  if (!customer) return { kind: "ANONYMOUS" };

  // Account-wide suspension applies to every access.
  if (customer.status !== "active") return { kind: "BLOCKED_STATUS", customer };

  let entitlement;
  try {
    const { getSessionEntitlement } = await import("@/lib/entitlements");
    entitlement = await getSessionEntitlement(customer);
  } catch (error) {
    console.error("[getPaidAccess] entitlement resolution failed:", error);
    // Fail closed — never grant because resolution broke.
    return { kind: "BLOCKED_PAYMENT", customer };
  }

  // The branch this access belongs to must exist and be enabled.
  const branchId = entitlement.branchId ?? customer.branchId;
  if (branchId) {
    const branch = await prisma.platformBranch.findUnique({ where: { id: branchId } });
    if (!branch || !branch.isEnabled) return { kind: "BLOCKED_BRANCH", customer };
  }

  // Per-access expiry.
  if (entitlement.expiresAt && new Date(entitlement.expiresAt).getTime() <= Date.now()) {
    return { kind: "BLOCKED_EXPIRED", customer };
  }

  // Per-access payment state.
  if (normalizePaymentStatus(entitlement.paymentStatus) !== PAYMENT_PAID) {
    return { kind: "BLOCKED_PAYMENT", customer };
  }

  return { kind: "GRANTED", customer };
});

/** Convenience booleans for pages that only need a badge. */
export function isPaid(customer: { paymentStatus: string } | null | undefined): boolean {
  return normalizePaymentStatus(customer?.paymentStatus) === PAYMENT_PAID;
}
