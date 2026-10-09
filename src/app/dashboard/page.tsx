import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { findPlatformByCode } from "@/lib/platforms";
import { getPaidAccess } from "@/lib/customerAccess";
import { PaymentPending } from "@/components/ui/PaymentPending";

/**
 * Customer resource portal.
 *
 * SECURITY: the payment gate is the FIRST thing that runs. An unpaid customer
 * never reaches the resource queries, so no file URL, link, password or
 * resource metadata is ever serialised into the response — this is a real
 * server-side refusal, not a CSS hide.
 */
export default async function DashboardPage() {
  const access = await getPaidAccess();

  if (access.kind === "ANONYMOUS") redirect("/access");

  if (access.kind === "BLOCKED_PAYMENT") {
    const platform = await findPlatformByCode(access.customer.platformType);
    return (
      <PaymentPending
        identifier={access.customer.identifier}
        platformName={platform?.name ?? access.customer.platformType}
      />
    );
  }

  /* This ACCESS has expired. Other accesses the customer owns are unaffected —
     the gate is evaluated per entitlement. */
  if (access.kind === "BLOCKED_EXPIRED") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-6 py-32">
        <GlassCard className="border-amber-500/40 p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2 uppercase tracking-wide">
            Access Expired
          </h2>
          <p className="text-brand-ink-3 text-sm mb-8">
            This access has reached its expiry date. Contact support to renew it —
            any other access on your account is unaffected.
          </p>
          <Button variant="primary" asChild className="w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (access.kind === "BLOCKED_STATUS" || access.kind === "BLOCKED_BRANCH") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-6 py-32">
        <GlassCard className="border-brand-red-500/40 p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-brand-red-500/10 border border-brand-red-500/30 mx-auto flex items-center justify-center text-brand-red-500 mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2 uppercase tracking-wide">
            Section Unavailable
          </h2>
          <p className="text-brand-ink-3 text-sm mb-8">
            This section is currently unavailable.
          </p>
          <Button variant="primary" asChild className="w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </GlassCard>
      </div>
    );
  }

  const customer = access.customer;

  /* MULTI-ACCESS: resolve resources for the SPECIFIC access this session is
     operating under, not for every access the customer owns. Using the
     entitlement's platform/branch/package prevents resources leaking across a
     customer's other accesses. Falls back to the customer's own fields for
     legacy accounts. */
  const { getSessionEntitlement } = await import("@/lib/entitlements");
  const entitlement = await getSessionEntitlement(customer);
  const ctxPlatform = entitlement.platformType || customer.platformType;
  const ctxBranchId = entitlement.branchId ?? customer.branchId;
  const ctxPackageId = entitlement.packageId ?? customer.packageId;

  /* Platform-wide resources stay shared; branch resources are only visible
     inside their own enabled branch. Both queries run in parallel. */
  const [branchResources, globalResources, packageResources, platformRecord] = await Promise.all([
    ctxBranchId
      ? prisma.packageResource.findMany({
          where: { branchId: ctxBranchId, status: "active" },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        })
      : Promise.resolve([]),
    prisma.packageResource.findMany({
      where: {
        platformType: ctxPlatform,
        packageId: null,
        status: "active",
        OR: [{ branchId: null }, ...(ctxBranchId ? [{ branchId: ctxBranchId }] : [])],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    /* Resources attached to THIS access's package. */
    ctxPackageId
      ? prisma.packageResource.findMany({
          where: { packageId: ctxPackageId, status: "active" },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        })
      : Promise.resolve([]),
    findPlatformByCode(ctxPlatform),
  ]);

  /* De-duplicate by id while preserving the manual display order. */
  const seen = new Set<string>();
  const allResources = [...branchResources, ...packageResources, ...globalResources].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return (
    <DashboardClient
      identifier={customer.identifier}
      resources={allResources}
      platformType={ctxPlatform}
      platformName={platformRecord?.name}
      branchName={customer.branch?.name || null}
      warning={
        customer.branch?.warningEnabled
          ? {
              branchId: customer.branch.id,
              title: customer.branch.warningTitle,
              message: customer.branch.warningMessage,
              buttonText: customer.branch.warningButtonText,
            }
          : null
      }
    />
  );
}
