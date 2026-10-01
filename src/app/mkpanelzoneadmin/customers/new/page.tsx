import { prisma } from "@/lib/prisma";
import { CreateCustomerForm } from "./CreateCustomerForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listActivePlatforms } from "@/lib/platforms";

export const metadata = {
  title: "Create Customer | Owner Panel",
};

export default async function AdminCreateCustomerPage() {
  const { ensureDefaultPackages } = await import("@/lib/auto-repair");
  await ensureDefaultPackages();
  const { ensureDefaultBranches } = await import("@/lib/branches");
  await ensureDefaultBranches();

  const [packages, branches, platforms] = await Promise.all([
    prisma.package.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.platformBranch.findMany({
      orderBy: [{ platformType: "asc" }, { sortOrder: "asc" }],
    }),
    listActivePlatforms(),
  ]);

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

      <CreateCustomerForm
        packages={packages}
        branches={branches.map(b => ({ id: b.id, platformType: b.platformType, name: b.name, isEnabled: b.isEnabled }))}
        platforms={platforms.map(p => ({ code: p.code, name: p.name }))}
      />
    </div>
  );
}
