import { prisma } from "@/lib/prisma";
import { CreateCustomerForm } from "./CreateCustomerForm";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Create Customer | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function AdminCreateCustomerPage() {
  const { ensureDefaultPackages } = await import("@/lib/auto-repair");
  await ensureDefaultPackages();

  /* Only the fields the picker needs — the form narrows packages by platform. */
  const packages = await prisma.package.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, platformType: true },
  });

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader
        eyebrow="New record"
        title="Create customer"
        description="Create an account directly, without going through an agent. The customer can sign in as soon as the account is active."
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Customers", href: "/mkpanelzoneadmin/customers" },
          { label: "New" },
        ]}
      />

      {packages.length === 0 && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-[14px] px-4 py-3.5 text-[12.5px] leading-relaxed"
          style={{
            background: "var(--status-warning-bg)",
            border: "1px solid var(--status-warning-border)",
            color: "var(--status-warning-text)",
          }}
        >
          <UserPlus size={15} className="mt-[2px] shrink-0" aria-hidden />
          <span>
            There are no packages yet, so a customer cannot be given an access tier.
            Create a package first, then come back to this form.
          </span>
        </div>
      )}

      <CreateCustomerForm packages={packages} />
    </div>
  );
}
