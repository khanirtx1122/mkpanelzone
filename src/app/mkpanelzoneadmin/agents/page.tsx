import { prisma } from "@/lib/prisma";
import { CreateAgentForm } from "./CreateAgentForm";
import { UserPlus, ShieldAlert, ShieldCheck, ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import { AgentFilters } from "./AgentFilters";
import { RESELLER_PLANS, subscriptionRemaining } from "@/lib/pricing";
import Link from "next/link";

export const metadata = {
  title: "Manage Agents | Owner Panel",
};

const PAGE_SIZE = 25;

export default async function ManageAgentsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q as string || "";
  const statusFilter = searchParams?.status as string || "ALL";
  const page = Math.max(1, parseInt((searchParams?.page as string) || "1", 10) || 1);

  const where = {
    role: "AGENT" as const,
    ...(q ? { username: { contains: q } } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
  };

  /* Paginated: the agent directory was previously loaded in full on every
     render, including a per-agent customer count. */
  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        username: true,
        status: true,
        createdAt: true,
        subscriptionPlan: true,
        subscriptionExpiry: true,
        _count: { select: { createdCustomers: true } },
      },
    }),
    prisma.agent.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/mkpanelzoneadmin/agents${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Agent List */}
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase mb-2">Agent Directory</h1>
          <p className="text-brand-ink-3">View and manage agent accounts.</p>
        </div>

        <AgentFilters />

        <div className="space-y-4">
          {agents.length === 0 ? (
            <div className="p-8 text-center border border-white/5 rounded-2xl bg-white/5">
              <p className="text-brand-ink-3">No agents found matching your criteria.</p>
            </div>
          ) : (
            agents.map((agent) => (
              <Link key={agent.id} href={`/mkpanelzoneadmin/agents/${agent.id}`} className="block">
                <div className="p-5 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-brand-blue-500/50 transition-all duration-200 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full ${agent.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"}`}></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-lg group-hover:text-brand-blue-400 transition-colors">{agent.username}</p>
                        {agent.status === "ACTIVE" ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider border border-green-500/20 flex items-center gap-1"><ShieldCheck size={12}/> Active</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-500/20 flex items-center gap-1"><ShieldAlert size={12}/> Disabled</span>
                        )}
                      </div>
                      <p className="text-xs text-brand-ink-3 mt-1 font-mono">
                        ID: {agent.id.slice(0, 8)} • Created: {agent.createdAt.toLocaleDateString()}
                      </p>
                      {agent.subscriptionPlan && (
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-brand-blue-400">
                          <CalendarClock size={11} />
                          {RESELLER_PLANS.find((p) => p.key === agent.subscriptionPlan)?.label ?? agent.subscriptionPlan}
                          <span className="text-brand-ink-3 font-normal">· {subscriptionRemaining(agent.subscriptionExpiry)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-brand-ink-3 mb-1 tracking-widest">Customers</p>
                    <p className="text-2xl font-black text-brand-blue-500">{agent._count.createdCustomers}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
            <p className="text-xs font-mono text-brand-ink-3">
              Page {page} of {totalPages} · {total} agents
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={buildPageUrl(Math.max(1, page - 1))}
                className={`inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  page <= 1
                    ? "text-brand-ink-3/40 pointer-events-none border border-white/5"
                    : "text-white bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                <ChevronLeft size={14} /> Prev
              </Link>
              <Link
                href={buildPageUrl(Math.min(totalPages, page + 1))}
                className={`inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  page >= totalPages
                    ? "text-brand-ink-3/40 pointer-events-none border border-white/5"
                    : "text-white bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                Next <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Create Agent Form */}
      <div className="w-full lg:w-96">
        <div className="p-6 border border-white/10 rounded-2xl bg-white/5 sticky top-24">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-lg bg-brand-blue-500/10 text-brand-blue-500 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight uppercase">New Agent</h2>
          </div>
          
          <CreateAgentForm />
        </div>
      </div>
    </div>
  );
}
