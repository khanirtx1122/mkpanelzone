import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  UserPlus,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Users,
  ArrowRight,
  Clock,
  Monitor,
  Smartphone,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge, toneFromStatus } from "@/components/ui/StatusBadge";
import { StatTile, StatGrid } from "@/components/admin/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Dashboard | Agent Panel",
};

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("agent_session")?.value;

  if (!sessionValue) return null;

  let sessionData;
  try {
    sessionData = JSON.parse(sessionValue);
  } catch (e) {
    console.error("page.tsx: unexpected failure:", e);
    return null;
  }

  const agentId = sessionData.userId || sessionData.agentId;

  if (!agentId) return null;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      createdCustomers: {
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { package: { select: { name: true } } },
      },
      _count: { select: { createdCustomers: true } },
    },
  });

  if (!agent) return null;

  /* Real aggregates from this agent's own customers only — an agent never sees
     another agent's records (spec §24). */
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [createdToday, createdThisWeek, activeCount] = await Promise.all([
    prisma.customer.count({
      where: { createdByAgentId: agent.id, createdAt: { gte: startOfToday } },
    }),
    prisma.customer.count({
      where: { createdByAgentId: agent.id, createdAt: { gte: weekAgo } },
    }),
    prisma.customer.count({
      where: { createdByAgentId: agent.id, status: "active" },
    }),
  ]);

  const isActive = agent.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader
        eyebrow="Workstation"
        title="Overview"
        description="Your customer-creation activity. Only the accounts you created are shown here."
        actions={
          <Button asChild variant="primary">
            <Link href="/agent/create">
              <UserPlus size={16} />
              <span>Create Customer</span>
            </Link>
          </Button>
        }
      />

      <StatGrid cols={4}>
        <StatTile
          label="Total created"
          value={agent._count.createdCustomers}
          icon={<Users size={13} />}
        />
        <StatTile label="Created today" value={createdToday} tone="info" icon={<Clock size={13} />} />
        <StatTile label="Last 7 days" value={createdThisWeek} tone="info" />
        <StatTile
          label="Active accounts"
          value={activeCount}
          tone="success"
          icon={<ShieldCheck size={13} />}
        />
      </StatGrid>

      {/* Account state — read from the database, never hard-coded */}
      <div className="mat-3 mb-6 flex flex-col gap-4 rounded-[18px] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className="mt-[2px] flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border"
            style={{
              borderColor: isActive
                ? "var(--status-success-border)"
                : "var(--status-danger-border)",
              background: isActive ? "var(--status-success-bg)" : "var(--status-danger-bg)",
              color: isActive
                ? "var(--status-success-text)"
                : "var(--status-danger-text)",
            }}
          >
            {isActive ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          </span>
          <div>
            <p className="text-[14px] font-bold text-foreground">
              {agent.username}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-brand-ink-3">
              {isActive
                ? "Your account is active. You can create customer accounts and attach payment proof."
                : "Your account is disabled. Customer creation is blocked — contact the owner."}
            </p>
          </div>
        </div>
        <StatusBadge tone={toneFromStatus(agent.status)} size="sm">
          {agent.status}
        </StatusBadge>
      </div>

      <section>
        <h2 className="mb-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
          Recent customers
          <span className="text-brand-ink-4">
            {agent._count.createdCustomers > 12 ? "Latest 12" : `All ${agent._count.createdCustomers}`}
          </span>
        </h2>

        {agent.createdCustomers.length === 0 ? (
          <div className="mat-2 rounded-[16px]">
            <EmptyState
              icon={UserPlus}
              title="No customers yet"
              description="Accounts you create will be listed here with their platform and package."
              action={
                <Button asChild variant="primary" size="sm">
                  <Link href="/agent/create">
                    <UserPlus size={14} />
                    <span>Create your first customer</span>
                  </Link>
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="space-y-2.5">
            {agent.createdCustomers.map((customer) => (
              <li key={customer.id}>
                <div className="mat-2 flex flex-col gap-3 rounded-[14px] p-4 transition-[border-color] duration-150 hover:border-border-strong sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`h-9 w-[3px] shrink-0 rounded-full ${
                        customer.status === "active"
                          ? "bg-[color:var(--status-success-solid)]"
                          : "bg-[color:var(--status-danger-solid)]"
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[14px] font-bold text-foreground">
                          {customer.identifier}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-[7px] border border-border-subtle bg-foreground/[0.04] px-1.5 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.08em] text-brand-ink-2">
                          {customer.platformType === "PC" ? (
                            <Monitor size={10} aria-hidden />
                          ) : (
                            <Smartphone size={10} aria-hidden />
                          )}
                          {customer.platformType}
                        </span>
                        <StatusBadge tone={toneFromStatus(customer.status)} size="xs">
                          {customer.status}
                        </StatusBadge>
                      </div>
                      <p className="mt-1 truncate text-[12px] text-brand-ink-3">
                        {customer.package?.name || "No package assigned"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    {customer.agentPaymentProof && (
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.09em] text-brand-ink-2">
                        Proof attached
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] text-brand-ink-3">
                      <Calendar size={12} aria-hidden />
                      {customer.createdAt.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {agent.createdCustomers.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Link
            href="/agent/create"
            className="group inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-brand-ink-3 transition-colors hover:text-foreground"
          >
            Create another customer
            <ArrowRight
              size={13}
              className="transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      )}
    </div>
  );
}
