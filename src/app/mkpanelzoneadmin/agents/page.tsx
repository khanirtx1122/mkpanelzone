import { prisma } from "@/lib/prisma";
import { CreateAgentForm } from "./CreateAgentForm";
import { UserPlus, ShieldAlert, ShieldCheck } from "lucide-react";
import { AgentFilters } from "./AgentFilters";
import Link from "next/link";

export const metadata = {
  title: "Manage Agents | Owner Panel",
};

export default async function ManageAgentsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q as string || "";
  const statusFilter = searchParams?.status as string || "ALL";

  const agents = await prisma.agent.findMany({
    where: { 
      role: "AGENT",
      ...(q ? { username: { contains: q } } : {}),
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { createdCustomers: true }
      }
    }
  });

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
