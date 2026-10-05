import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, ShieldCheck, ShieldAlert, Key } from "lucide-react";
import { AgentActions } from "./AgentActions";
import { listAllPlatforms } from "@/lib/platforms";
import { PlatformBadgeIcon } from "../../resources/PlatformBadgeIcon";

export default async function AgentDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [agent, platforms, platformCounts, branchCounts, totalCustomers] = await Promise.all([
    prisma.agent.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        role: true,
        createdCustomers: {
          orderBy: { createdAt: "desc" },
          take: 25,
          select: { id: true, identifier: true, platformType: true, branchId: true, createdAt: true, paymentStatus: true, agentPaymentProof: true },
        },
      },
    }),
    listAllPlatforms(),
    prisma.customer.groupBy({
      by: ["platformType"],
      where: { createdByAgentId: params.id },
      _count: { _all: true },
    }),
    prisma.customer.groupBy({
      by: ["branchId"],
      where: { createdByAgentId: params.id, branchId: { not: null } },
      _count: { _all: true },
    }),
    prisma.customer.count({ where: { createdByAgentId: params.id } }),
  ]);

  if (!agent || agent.role !== "AGENT") {
    notFound();
  }

  const platformCountByCode = new Map(platformCounts.map((row) => [row.platformType, row._count._all]));
  const branchCountById = new Map(branchCounts.flatMap((row) => row.branchId ? [[row.branchId, row._count._all] as const] : []));
  const branches = branchCounts.length
    ? await prisma.platformBranch.findMany({
        where: { id: { in: branchCounts.flatMap((row) => row.branchId ? [row.branchId] : []) } },
        select: { id: true, name: true, platformType: true },
        orderBy: [{ platformType: "asc" }, { sortOrder: "asc" }],
      })
    : [];
  const proofCount = agent.createdCustomers.filter((customer) => Boolean(customer.agentPaymentProof)).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <Link href="/mkpanelzoneadmin/agents" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{agent.username}</h1>
            {agent.status === "ACTIVE" ? (
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider border border-green-500/20 flex items-center gap-1"><ShieldCheck size={14}/> Active</span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider border border-red-500/20 flex items-center gap-1"><ShieldAlert size={14}/> Disabled</span>
            )}
          </div>
          <p className="text-sm font-mono text-brand-ink-3">ID: {agent.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Details & Actions */}
        <div className="space-y-6">
          <div className="p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
            <h2 className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest border-b border-white/5 pb-3">Agent Details</h2>
            
            <div className="flex items-center gap-3 text-white">
              <Calendar size={18} className="text-brand-ink-3" />
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-ink-3">Created At</p>
                <p className="text-sm">{agent.createdAt.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-white">
              <Key size={18} className="text-brand-ink-3" />
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-ink-3">Last Login</p>
                <p className="text-sm">{agent.lastLoginAt ? agent.lastLoginAt.toLocaleString() : "Never"}</p>
              </div>
            </div>
          </div>

          <AgentActions agentId={agent.id} currentStatus={agent.status} />
        </div>

        {/* Right Column: Customers */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 border border-white/10 rounded-2xl bg-white/5 text-center">
              <p className="text-[10px] font-bold text-brand-ink-3 uppercase tracking-widest mb-1">Total Customers</p>
              <p className="text-3xl font-black text-brand-blue-500">{totalCustomers}</p>
            </div>
            {platforms.map((platform) => (
              <div key={platform.id} className="p-5 border border-white/10 rounded-2xl bg-white/5 text-center">
                <p className="text-[10px] font-bold text-brand-ink-3 uppercase tracking-widest mb-1 flex justify-center items-center gap-1">
                  <PlatformBadgeIcon iconKey={platform.iconKey} size={12} /> {platform.name}
                </p>
                <p className="text-3xl font-black text-white">{platformCountByCode.get(platform.code) || 0}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 border border-white/10 rounded-2xl bg-white/5 text-center">
              <p className="text-[10px] font-bold text-brand-ink-3 uppercase tracking-widest mb-1">Recent Proofs</p>
              <p className="text-3xl font-black text-amber-400">{proofCount}</p>
              <p className="mt-1 text-[10px] text-brand-ink-3">Among the latest 25 customer records</p>
            </div>
            <div className="p-5 border border-white/10 rounded-2xl bg-white/5">
              <p className="text-[10px] font-bold text-brand-ink-3 uppercase tracking-widest mb-3">Customers by Branch</p>
              {branches.length ? (
                <ul className="space-y-2">
                  {branches.map((branch) => (
                    <li key={branch.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-white">{branch.name}</span>
                      <span className="shrink-0 font-bold text-brand-blue-400">{branchCountById.get(branch.id) || 0}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-brand-ink-3">No branch assignments yet.</p>}
            </div>
          </div>

          <div className="p-6 border border-white/10 rounded-2xl bg-white/5">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center justify-between">
              Recent Customers
              <Link href={`/mkpanelzoneadmin/customers?agentId=${agent.id}`} className="text-[10px] text-brand-blue-400 hover:text-brand-blue-300">View All</Link>
            </h2>

            <div className="space-y-2">
              {agent.createdCustomers.length === 0 ? (
                <p className="text-sm text-brand-ink-3 italic">No customers created yet.</p>
              ) : (
                agent.createdCustomers.map(customer => (
                  <Link key={customer.id} href={`/mkpanelzoneadmin/customers/${customer.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                    <div>
                      <p className="font-bold text-white text-sm">{customer.identifier}</p>
                      <p className="text-xs text-brand-ink-3">{customer.createdAt.toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/10 text-white">{customer.platformType}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
