import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { UserPlus, Calendar, Activity, BadgeCheck, Clock } from "lucide-react";
import { findResellerPlan, subscriptionRemaining } from "@/lib/pricing";

export const metadata = {
  title: "Dashboard | Agent Panel",
};

export default async function AgentDashboardPage() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("agent_session")?.value;

  if (!sessionValue) return null;

  let sessionData;
  try {
    sessionData = JSON.parse(sessionValue);
  } catch (e) {
    return null;
  }

  const agentId = sessionData.userId || sessionData.agentId;

  if (!agentId) return null;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      createdCustomers: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { package: { select: { name: true } } }
      },
      _count: {
        select: { createdCustomers: true }
      }
    }
  });

  if (!agent) return null;

  /* Subscription state is resolved from the DB row (authoritative) — the plan
     label and remaining time are derived, never stored as display text.
     A permanent plan reports "no expiry" instead of a fake countdown. */
  const plan = findResellerPlan(agent.subscriptionPlan);
  const remaining = subscriptionRemaining(agent.subscriptionExpiry);
  const expired = agent.subscriptionExpiry ? new Date(agent.subscriptionExpiry).getTime() <= Date.now() : false;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight uppercase mb-2">Overview</h1>
        <p className="text-brand-ink-3">Your reseller activity, subscription and recent customers.</p>
      </div>

      {/* ── SUBSCRIPTION ── */}
      <GlassCard className="p-5 sm:p-6 border-border-subtle mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-brand-blue-500/10 border border-brand-blue-500/25 text-brand-blue-400 flex items-center justify-center shrink-0">
              <BadgeCheck size={20} />
            </span>
            <div>
              <p className="text-[11px] font-bold text-brand-ink-3 uppercase tracking-widest mb-0.5">Subscription Plan</p>
              <p className="text-lg font-extrabold text-foreground">
                {plan ? plan.label : "No active plan"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-bold text-brand-ink-3 uppercase tracking-widest mb-0.5">Remaining</p>
            <p
              className={`inline-flex items-center gap-1.5 text-sm font-extrabold ${
                expired ? "text-red-400" : "text-green-400"
              }`}
            >
              <Clock size={14} />
              {remaining}
            </p>
            {agent.subscriptionExpiry && !expired && (
              <p className="text-[11px] text-brand-ink-3 font-mono mt-0.5">
                until {new Date(agent.subscriptionExpiry).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <GlassCard className="p-6 border-border-subtle flex flex-col">
          <div className="w-10 h-10 rounded-lg bg-brand-blue-500/10 text-brand-blue-500 flex items-center justify-center mb-4">
            <UserPlus size={20} />
          </div>
          <p className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-1">Total Customers Created</p>
          <p className="text-4xl font-extrabold text-foreground">{agent._count.createdCustomers}</p>
        </GlassCard>

        <GlassCard className="p-6 border-border-subtle flex flex-col">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
            <Activity size={20} />
          </div>
          <p className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-1">Account Status</p>
          <p className="text-4xl font-extrabold text-foreground">{agent.status}</p>
        </GlassCard>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-6 uppercase tracking-widest">Recent Customers</h2>
      <div className="space-y-4">
        {agent.createdCustomers.length === 0 ? (
          <p className="text-brand-ink-3 italic">You have not created any customers yet.</p>
        ) : (
          agent.createdCustomers.map(customer => (
            <GlassCard key={customer.id} className="p-5 border-border-subtle flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-foreground text-lg">{customer.identifier}</p>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-foreground/10 text-foreground uppercase">
                    {customer.platformType}
                  </span>
                </div>
                <p className="text-sm text-brand-ink-3">
                  Package: {customer.package?.name || "N/A"}
                </p>
              </div>
              <div className="text-right flex items-center gap-2 text-brand-ink-3">
                <Calendar size={16} />
                <span className="text-sm font-medium">{customer.createdAt.toLocaleDateString()}</span>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
