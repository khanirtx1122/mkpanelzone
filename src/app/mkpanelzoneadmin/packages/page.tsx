import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit3, Package as PackageIcon, Layers, Users, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/admin/StatTile";
import {
  DataTableShell,
  DataTableScroll,
  DataTableHead,
  DataTableBody,
  Th,
  Td,
  Tr,
  RowActionLink,
} from "@/components/ui/DataTable";

export const metadata = {
  title: "Packages | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const { ensureDefaultPackages } = await import("@/lib/auto-repair");
  await ensureDefaultPackages();

  const packages = await prisma.package.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { customers: true, resources: true } },
    },
  });

  const totalCustomers = packages.reduce((s, p) => s + p._count.customers, 0);
  const totalResources = packages.reduce((s, p) => s + p._count.resources, 0);
  const defaults = packages.filter((p) => p.isDefaultForAgents).length;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Access Tiers"
        title="Packages"
        description="Access tiers that determine which resources a customer receives on their platform."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Packages" }]}
        actions={
          <Button asChild variant="primary">
            <Link href="/mkpanelzoneadmin/packages/new">
              <Plus size={16} />
              <span>Add Package</span>
            </Link>
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Packages" value={packages.length} icon={<PackageIcon size={13} />} />
        <StatTile
          label="Customers"
          value={totalCustomers}
          tone="info"
          icon={<Users size={13} />}
        />
        <StatTile
          label="Resources"
          value={totalResources}
          tone="info"
          icon={<Layers size={13} />}
        />
        <StatTile
          label="Agent defaults"
          value={defaults}
          tone={defaults > 0 ? "success" : "neutral"}
          icon={<Sparkles size={13} />}
        />
      </div>

      {packages.length === 0 ? (
        <div className="mat-2 rounded-[16px]">
          <EmptyState
            icon={PackageIcon}
            title="No packages defined"
            description="Packages group the resources a customer receives. Create one to start assigning access."
          />
        </div>
      ) : (
        <DataTableShell>
          <DataTableScroll>
            <DataTableHead>
              <Th>Package</Th>
              <Th>Description</Th>
              <Th>Platform</Th>
              <Th align="right">Customers</Th>
              <Th align="right">Resources</Th>
              <Th align="right">Actions</Th>
            </DataTableHead>
            <DataTableBody>
              {packages.map((pkg) => (
                <Tr key={pkg.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border-subtle bg-foreground/[0.05] text-brand-ink-2">
                        <PackageIcon size={15} aria-hidden />
                      </span>
                      <span className="max-w-[220px] truncate text-[13.5px] font-bold text-foreground">
                        {pkg.name}
                      </span>
                    </div>
                  </Td>

                  <Td>
                    <span className="block max-w-[280px] truncate text-[12.5px] text-brand-ink-2">
                      {pkg.description || (
                        <span className="italic text-brand-ink-4">No description</span>
                      )}
                    </span>
                  </Td>

                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      <span className="rounded-[7px] border border-border-subtle bg-foreground/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-ink-2">
                        {pkg.platformType}
                      </span>
                      {pkg.isDefaultForAgents && (
                        <span className="badge-info inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.08em]">
                          <Sparkles size={9} aria-hidden />
                          Agent default
                        </span>
                      )}
                    </div>
                  </Td>

                  <Td align="right">
                    <span className="tabular text-[15px] font-extrabold text-brand-ink-2">
                      {pkg._count.customers}
                    </span>
                  </Td>

                  <Td align="right">
                    <span className="tabular text-[15px] font-extrabold text-brand-ink-2">
                      {pkg._count.resources}
                    </span>
                  </Td>

                  <Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      <RowActionLink
                        href={`/mkpanelzoneadmin/resources?packageId=${pkg.id}`}
                        title="View this package's resources"
                      >
                        <Layers size={12} aria-hidden />
                        Resources
                      </RowActionLink>
                      <RowActionLink href={`/mkpanelzoneadmin/packages/${pkg.id}`}>
                        <Edit3 size={12} aria-hidden />
                        Edit
                      </RowActionLink>
                    </div>
                  </Td>
                </Tr>
              ))}
            </DataTableBody>
          </DataTableScroll>
        </DataTableShell>
      )}
    </div>
  );
}
