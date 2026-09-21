import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;

  const customer = await prisma.customer.findUnique({
    where: { id: sessionId },
    include: {
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

  const globalResources = await prisma.packageResource.findMany({
    where: {
      platformType: customer.platformType,
      packageId: null,
      status: "active"
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
    />
  );
}
