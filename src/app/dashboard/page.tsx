import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";
import { ErrorState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;

  if (!sessionId) {
    redirect("/access");
  }

  let customer: Awaited<
    ReturnType<
      typeof prisma.customer.findUnique<{
        where: { id: string };
        include: {
          package: { include: { resources: { where: { status: string }; orderBy: { sortOrder: "asc" } } } };
        };
      }>
    >
  > = null;

  let globalResources: Awaited<ReturnType<typeof prisma.packageResource.findMany>> = [];
  let loadFailed = false;

  try {
    customer = await prisma.customer.findUnique({
      where: { id: sessionId },
      include: {
        package: {
          include: {
            resources: {
              where: { status: "active" },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (customer) {
      globalResources = await prisma.packageResource.findMany({
        where: {
          platformType: customer.platformType,
          packageId: null,
          status: "active",
        },
        orderBy: { sortOrder: "asc" },
      });
    }
  } catch (error) {
    console.error("[dashboard] load failed:", error);
    loadFailed = true;
  }

  // A designed failure surface rather than a raw 500 (spec §41).
  if (loadFailed) {
    return (
      <div className="mx-auto max-w-[620px] px-4 pt-[140px] sm:px-6">
        <ErrorState
          title="We couldn't load your resources"
          description="There was a problem reaching the resource service. Your access is unaffected — please refresh in a moment."
        />
      </div>
    );
  }

  if (!customer) {
    redirect("/access");
  }

  /*
    An open session must not outlive the account's access. Without this, a
    customer disabled in the owner panel would keep working for the remaining
    lifetime of the 30-day `auth_session` cookie. `/access` re-checks the same
    condition before auto-redirecting back here, so this cannot loop.
  */
  if (customer.status !== "active") {
    redirect("/access");
  }

  const allResources = [...(customer.package?.resources ?? []), ...globalResources];

  return (
    <DashboardClient
      identifier={customer.identifier}
      packageName={customer.package?.name || "No package assigned"}
      resources={allResources}
      platformType={customer.platformType}
    />
  );
}
