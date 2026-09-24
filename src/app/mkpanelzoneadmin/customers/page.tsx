import { prisma } from "@/lib/prisma";
import { CustomerFilters } from "./CustomerFilters";
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Monitor,
  UserPlus,
  ArrowUpRight,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge, toneFromStatus } from "@/components/ui/StatusBadge";
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
  title: "Customers | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const q = (searchParams?.q as string) || "";
  const platformFilter = (searchParams?.platform as string) || "ALL";
  const statusFilter = (searchParams?.status as string) || "ALL";
  const agentFilter = (searchParams?.agentId as string) || "";

  /* Agent list powers the "Creator" filter — fetched alongside the rows so the
     page still makes a single round-trip pair instead of a waterfall. */
  const [customers, agents] = await Promise.all([
    prisma.customer.findMany({
      where: {
        ...(q ? { identifier: { contains: q } } : {}),
        ...(platformFilter !== "ALL" ? { platformType: platformFilter } : {}),
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        ...(agentFilter ? { createdByAgentId: agentFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        agent: { select: { username: true } },
        package: { select: { name: true } },
      },
    }),
    prisma.agent.findMany({
      select: { id: true, username: true },
      orderBy: { username: "asc" },
    }),
  ]);

  const activeCount = customers.filter((c) => c.status === "active").length;
  const withProof = customers.filter((c) => c.agentPaymentProof).length;
  const isFiltered =
    Boolean(q) || platformFilter !== "ALL" || statusFilter !== "ALL" || Boolean(agentFilter);

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Access Control"
        title="Customer Records"
        description="Every customer account, its platform binding, owning package and the agent or channel that created it."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Customers" }]}
        actions={
          <Button asChild variant="primary">
            <Link href="/mkpanelzoneadmin/customers/new">
              <UserPlus size={16} />
              <span>Create Customer</span>
            </Link>
          </Button>
        }
      />

      {/* Live result summary — real numbers from the query, not decoration */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label={isFiltered ? "Matching" : "Total"}
          value={customers.length}
          icon={<Users size={14} />}
        />
        <StatTile
          label="Active"
          value={activeCount}
          tone="success"
          icon={<ShieldCheck size={14} />}
        />
        <StatTile
          label="Disabled"
          value={customers.length - activeCount}
          tone={customers.length - activeCount > 0 ? "danger" : "neutral"}
          icon={<ShieldAlert size={14} />}
        />
        <StatTile label="Proof on file" value={withProof} tone="info" />
      </div>

      <CustomerFilters agents={agents} />

      <div className="mt-5">
        {customers.length === 0 ? (
          <div className="mat-2 rounded-[16px]">
            <EmptyState
              icon={Users}
              title={isFiltered ? "No customers match these filters" : "No customers yet"}
              description={
                isFiltered
                  ? "Adjust or reset the filters above to widen the search. Nothing was removed."
                  : "Customer accounts created through checkout or by an agent will appear here."
              }
            />
          </div>
        ) : (
          <DataTableShell>
            <DataTableScroll>
              <DataTableHead>
                <Th>Identifier</Th>
                <Th>Platform</Th>
                <Th>Package</Th>
                <Th>Created by</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
                <Th align="right">Action</Th>
              </DataTableHead>
              <DataTableBody>
                {customers.map((customer) => (
                  <Tr key={customer.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-9 w-[3px] shrink-0 rounded-full ${
                            customer.status === "active"
                              ? "bg-[color:var(--status-success-solid)]"
                              : "bg-[color:var(--status-danger-solid)]"
                          }`}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-foreground">
                            {customer.identifier}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-ink-4">
                            {customer.id.slice(0, 12)}
                          </p>
                        </div>
                      </div>
                    </Td>

                    <Td>
                      <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-border-subtle bg-foreground/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-ink-2">
                        {customer.platformType === "PC" ? (
                          <Monitor size={11} aria-hidden />
                        ) : (
                          <Smartphone size={11} aria-hidden />
                        )}
                        {customer.platformType}
                      </span>
                    </Td>

                    <Td>
                      <span className="text-[13px] text-brand-ink-2">
                        {customer.package?.name || (
                          <span className="text-brand-ink-4">Unassigned</span>
                        )}
                      </span>
                    </Td>

                    <Td>
                      <div className="text-[13px] text-brand-ink-2">
                        {customer.agent?.username || (
                          <span className="text-brand-ink-3">{customer.createdSource}</span>
                        )}
                      </div>
                      {customer.agentPaymentProof && (
                        <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-[0.09em] text-brand-ink-2">
                          Proof attached
                        </span>
                      )}
                    </Td>

                    <Td>
                      <StatusBadge tone={toneFromStatus(customer.status)}>
                        {customer.status}
                      </StatusBadge>
                    </Td>

                    <Td>
                      <span className="whitespace-nowrap text-[13px] font-semibold text-brand-ink-2">
                        {customer.createdAt.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </Td>

                    <Td align="right">
                      <RowActionLink href={`/mkpanelzoneadmin/customers/${customer.id}`}>
                        Open
                        <ArrowUpRight size={12} aria-hidden />
                      </RowActionLink>
                    </Td>
                  </Tr>
                ))}
              </DataTableBody>
            </DataTableScroll>
          </DataTableShell>
        )}
      </div>
    </div>
  );
}
