import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, ShieldCheck, ShieldAlert, Monitor, Smartphone, Apple, Key, UserPlus } from "lucide-react";
import { AgentActions } from "./AgentActions";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile, StatGrid } from "@/components/admin/StatTile";
import { StatusBadge, toneFromStatus } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DataTableShell, DataTableBody, DataTableHead, Th, Td, Tr, RowActionLink } from "@/components/ui/DataTable";

export const metadata = {
  title: "Agent | Owner Panel",
};

export const dynamic = "force-dynamic";

const PLATFORM_LABEL: Record<string, string> = {
  ANDROID: "Android",
  IOS: "iPhone",
  PC: "PC",
};

export default async function AgentDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
  });

  if (!agent || agent.role !== "AGENT") {
    notFound();
  }

  /*
    The previous version derived every figure on this page from a `take: 50`
    relation, so an agent with 300 customers was reported as having 50. These
    are real aggregate queries over the whole set instead (spec §22: real values,
    never fabricated analytics).
  */
  const [totalCustomers, platformGroups, recentCustomers] = await Promise.all([
    prisma.customer.count({ where: { createdByAgentId: agent.id } }),
    prisma.customer.groupBy({
      by: ["platformType"],
      where: { createdByAgentId: agent.id },
      _count: { _all: true },
    }),
    prisma.customer.findMany({
      where: { createdByAgentId: agent.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        identifier: true,
        platformType: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const byPlatform = platformGroups.reduce<Record<string, number>>((acc, group) => {
    acc[group.platformType] = group._count._all;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Agent"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {agent.username}
            <StatusBadge tone={toneFromStatus(agent.status)}>{agent.status}</StatusBadge>
          </span>
        }
        description={
          <span className="font-mono text-[12px] text-brand-ink-4">ID {agent.id}</span>
        }
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Agents", href: "/mkpanelzoneadmin/agents" },
          { label: agent.username },
        ]}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/mkpanelzoneadmin/customers?agentId=${agent.id}`}>
              <UserPlus size={14} aria-hidden />
              View all customers
            </Link>
          </Button>
        }
      />

      <StatGrid cols={4}>
        <StatTile
          label="Customers created"
          value={totalCustomers}
          tone={totalCustomers > 0 ? "info" : "neutral"}
          icon={<UserPlus size={13} />}
        />
        <StatTile
          label="Android"
          value={byPlatform.ANDROID ?? 0}
          icon={<Smartphone size={13} />}
        />
        <StatTile label="iPhone" value={byPlatform.IOS ?? 0} icon={<Apple size={13} />} />
        <StatTile label="PC" value={byPlatform.PC ?? 0} icon={<Monitor size={13} />} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Left: record + operations ────────────────────────────────── */}
        <div className="space-y-5">
          <section className="mat-3 rounded-[18px] p-5">
            <h2 className="mb-4 border-b border-border-subtle pb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
              Account record
            </h2>

            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar size={14} className="mt-[2px] shrink-0 text-brand-ink-4" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-brand-ink-4">
                    Created
                  </dt>
                  <dd className="mt-0.5 text-[12.5px] text-brand-ink-2">
                    {agent.createdAt.toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Key size={14} className="mt-[2px] shrink-0 text-brand-ink-4" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-brand-ink-4">
                    Last sign-in
                  </dt>
                  <dd className="mt-0.5 text-[12.5px] text-brand-ink-2">
                    {agent.lastLoginAt
                      ? agent.lastLoginAt.toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never signed in"}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {agent.status === "ACTIVE" ? (
                  <ShieldCheck
                    size={14}
                    className="mt-[2px] shrink-0 text-[color:var(--status-success-text)]"
                    aria-hidden
                  />
                ) : (
                  <ShieldAlert
                    size={14}
                    className="mt-[2px] shrink-0 text-[color:var(--status-danger-text)]"
                    aria-hidden
                  />
                )}
                <div className="min-w-0">
                  <dt className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-brand-ink-4">
                    Access
                  </dt>
                  <dd className="mt-0.5 text-[12.5px] text-brand-ink-2">
                    {agent.status === "ACTIVE"
                      ? "Can sign in and create customers"
                      : "Blocked from signing in"}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <AgentActions
            agentId={agent.id}
            currentStatus={agent.status}
            username={agent.username}
          />
        </div>

        {/* ── Right: recent customers ──────────────────────────────────── */}
        <div className="min-w-0 lg:col-span-2">
          <h2 className="mb-3.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
            Most recent customers
          </h2>

          {recentCustomers.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No customers yet"
              description="Customers created through this agent's panel will appear here."
            />
          ) : (
            <DataTableShell>
              <DataTableHead>
                <Th>Identifier</Th>
                <Th>Platform</Th>
                <Th>Status</Th>
                <Th align="right">Created</Th>
                <Th align="right">{""}</Th>
              </DataTableHead>
              <DataTableBody>
                {recentCustomers.map((customer) => (
                  <Tr key={customer.id}>
                    <Td>
                      <span className="font-mono text-[12.5px] text-foreground">
                        {customer.identifier}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-[12px] text-brand-ink-2">
                        {PLATFORM_LABEL[customer.platformType] ?? customer.platformType}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge tone={toneFromStatus(customer.status)}>
                        {customer.status}
                      </StatusBadge>
                    </Td>
                    <Td align="right">
                      <span className="text-[11.5px] text-brand-ink-4">
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
                      </RowActionLink>
                    </Td>
                  </Tr>
                ))}
              </DataTableBody>
            </DataTableShell>
          )}

          {totalCustomers > recentCustomers.length && (
            <p className="mt-3 text-[11.5px] text-brand-ink-4">
              Showing the {recentCustomers.length} most recent of {totalCustomers} customers.{" "}
              <Link
                href={`/mkpanelzoneadmin/customers?agentId=${agent.id}`}
                className="text-brand-ink-2 transition-colors hover:text-brand-ink-2"
              >
                View the full list
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
