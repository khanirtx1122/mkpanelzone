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
  | { kind: "GRANTED"; customer: SessionCustomer };

/**
 * The single decision point for protected customer content.
 *
 * Order matters: a disabled account is treated as anonymous, a disabled branch
 * denies the section, and only then is payment evaluated — so a UI bug can
 * never accidentally downgrade a hard block into a soft one.
 */
export const getPaidAccess = cache(async (): Promise<AccessState> => {
  const customer = await getSessionCustomer();
  if (!customer) return { kind: "ANONYMOUS" };

  if (customer.status !== "active") return { kind: "BLOCKED_STATUS", customer };

  if (customer.branchId && (!customer.branch || !customer.branch.isEnabled)) {
    return { kind: "BLOCKED_BRANCH", customer };
  }

  if (normalizePaymentStatus(customer.paymentStatus) !== PAYMENT_PAID) {
    return { kind: "BLOCKED_PAYMENT", customer };
  }

  return { kind: "GRANTED", customer };
});

/** Convenience booleans for pages that only need a badge. */
export function isPaid(customer: { paymentStatus: string } | null | undefined): boolean {
  return normalizePaymentStatus(customer?.paymentStatus) === PAYMENT_PAID;
}
