import { prisma } from "@/lib/prisma";
import { CreateAgentForm } from "./CreateAgentForm";
import { UserPlus, ShieldCheck, ShieldAlert, Users, ArrowUpRight } from "lucide-react";
import { AgentFilters } from "./AgentFilters";
import { PageHeader } from "@/components/ui/PageHeader";
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
  title: "Manage Agents | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function ManageAgentsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const q = (searchParams?.q as string) || "";
  const statusFilter = (searchParams?.status as string) || "ALL";

  const agents = await prisma.agent.findMany({
    where: {
      role: "AGENT",
      ...(q ? { username: { contains: q } } : {}),
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { createdCustomers: true } },
    },
  });

  const activeCount = agents.filter((a) => a.status === "ACTIVE").length;
  const totalCustomers = agents.reduce((sum, a) => sum + a._count.createdCustomers, 0);
  const isFiltered = Boolean(q) || statusFilter !== "ALL";

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHeader
        eyebrow="Distribution"
        title="Agent Directory"
        description="Sales agents who create and hand off customer accounts. Agents are scoped to customer creation only — no owner-level access."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Agents" }]}
      />

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_368px]">
        {/* ── Directory ────────────────────────────────────────────── */}
        <div className="min-w-0">
          <div className="mb-5 grid grid-cols-3 gap-3">
            <StatTile label={isFiltered ? "Matching" : "Agents"} value={agents.length} />
            <StatTile
              label="Active"
              value={activeCount}
              tone="success"
              icon={<ShieldCheck size={13} />}
            />
            <StatTile
              label="Customers"
              value={totalCustomers}
              tone="info"
              icon={<Users size={13} />}
            />
          </div>

          <AgentFilters />

          <div className="mt-5">
            {agents.length === 0 ? (
              <div className="mat-2 rounded-[16px]">
                <EmptyState
                  icon={ShieldAlert}
                  title={isFiltered ? "No agents match these filters" : "No agents yet"}
                  description={
                    isFiltered
                      ? "Reset the filters to see the full directory."
                      : "Create the first agent using the panel on the right."
                  }
                />
              </div>
            ) : (
              <DataTableShell>
                <DataTableScroll>
                  <DataTableHead>
                    <Th>Agent</Th>
                    <Th>Status</Th>
                    <Th align="right">Customers</Th>
                    <Th>Created</Th>
                    <Th align="right">Action</Th>
                  </DataTableHead>
                  <DataTableBody>
                    {agents.map((agent) => (
                      <Tr key={agent.id}>
                        <Td>
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-9 w-[3px] shrink-0 rounded-full ${
                                agent.status === "ACTIVE"
                                  ? "bg-[color:var(--status-success-solid)]"
                                  : "bg-[color:var(--status-danger-solid)]"
                              }`}
                              aria-hidden
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-bold text-foreground">
                                {agent.username}
                              </p>
                              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-ink-4">
                                {agent.id.slice(0, 10)}
                              </p>
                            </div>
                          </div>
                        </Td>

                        <Td>
                          <StatusBadge tone={toneFromStatus(agent.status)}>
                            {agent.status}
                          </StatusBadge>
                        </Td>

                        <Td align="right">
                          <span className="tabular text-[16px] font-extrabold text-brand-ink-2">
                            {agent._count.createdCustomers}
                          </span>
                        </Td>

                        <Td>
                          <span className="whitespace-nowrap text-[13px] text-brand-ink-2">
                            {agent.createdAt.toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </Td>

                        <Td align="right">
                          <RowActionLink href={`/mkpanelzoneadmin/agents/${agent.id}`}>
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

        {/* ── Create panel ─────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mat-3 rounded-[18px] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-border-subtle pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-border-subtle bg-foreground/[0.05] text-brand-ink-2">
                <UserPlus size={18} aria-hidden />
              </span>
              <div>
                <h2 className="text-[15px] font-extrabold tracking-tight text-foreground">
                  New Agent
                </h2>
                <p className="text-[11.5px] text-brand-ink-3">Customer-creation access</p>
              </div>
            </div>

            <CreateAgentForm />
          </div>
        </aside>
      </div>
    </div>
  );
}
