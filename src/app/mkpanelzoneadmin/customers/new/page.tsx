import { prisma } from "@/lib/prisma";
import { CreateCustomerForm } from "./CreateCustomerForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Create Customer | Owner Panel",
};

export default async function AdminCreateCustomerPage() {
  const { ensureDefaultPackages } = await import("@/lib/auto-repair");
  await ensureDefaultPackages();

  const packages = await prisma.package.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/mkpanelzoneadmin/customers" className="inline-flex items-center gap-2 text-brand-ink-3 hover:text-white transition-colors mb-4 text-sm font-bold uppercase tracking-wider">
          <ArrowLeft size={16} />
          Back to Customers
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase mb-2">Create Customer</h1>
        <p className="text-brand-ink-3">Add a new customer directly from the Owner Panel.</p>
      </div>

      <CreateCustomerForm packages={packages} />
    </div>
  );
}
