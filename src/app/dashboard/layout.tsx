import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("auth_session")?.value;

  if (!sessionId) {
    redirect("/access");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: sessionId },
  });

  if (!customer) {
    redirect("/access");
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {children}
    </div>
  );
}
