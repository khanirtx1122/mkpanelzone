import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;

  const customer = await prisma.customer.findUnique({
    where: { id: sessionId },
    include: {
      branch: true,
      package: {
        include: {
          resources: {
            where: { status: "active" },
            orderBy: { sortOrder: "asc" }
          }
        }
      }
    }
  });

  if (!customer) {
    redirect("/access");
  }

  /* A disabled branch must deny access cleanly, even mid-session. */
  if (customer.branchId && (!customer.branch || !customer.branch.isEnabled)) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-6 py-32">
        <GlassCard className="border-brand-red-500/40 p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-brand-red-500/10 border border-brand-red-500/30 mx-auto flex items-center justify-center text-brand-red-500 mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2 uppercase tracking-wide">Section Unavailable</h2>
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

  /* Platform-wide (branchId: null) resources stay shared; branch resources
     are only visible inside their own branch. */
  const globalResources = await prisma.packageResource.findMany({
    where: {
      platformType: customer.platformType,
      packageId: null,
      status: "active",
      OR: [{ branchId: null }, ...(customer.branchId ? [{ branchId: customer.branchId }] : [])],
    },
    orderBy: { sortOrder: "asc" }
  });

  const allResources = [...(customer.package?.resources || []), ...globalResources];

  return (
    <DashboardClient
      identifier={customer.identifier}
      packageName={customer.package?.name || "No Package"}
      resources={allResources}
      platformType={customer.platformType}
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
