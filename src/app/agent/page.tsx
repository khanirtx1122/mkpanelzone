import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { UserPlus, Calendar, Activity } from "lucide-react";

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

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight uppercase mb-2">Overview</h1>
        <p className="text-brand-ink-3">Your agent activity and recent customers.</p>
      </div>

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
          <p className="text-4xl font-extrabold text-foreground">ACTIVE</p>
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
