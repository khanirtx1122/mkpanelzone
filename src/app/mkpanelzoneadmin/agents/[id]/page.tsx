import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, ShieldCheck, ShieldAlert, Key } from "lucide-react";
import { AgentActions } from "./AgentActions";
import { listAllPlatforms } from "@/lib/platforms";
import { PlatformBadgeIcon } from "../../resources/PlatformBadgeIcon";

export default async function AgentDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [agent, platforms] = await Promise.all([
    prisma.agent.findUnique({
      where: { id: params.id },
      include: {
        createdCustomers: {
          orderBy: { createdAt: "desc" },
          take: 50 // Show recent 50
        }
      }
    }),
    listAllPlatforms(),
  ]);

  if (!agent || agent.role !== "AGENT") {
    notFound();
  }

  // Calculate platform split
  const platformCounts = agent.createdCustomers.reduce((acc, curr) => {
    acc[curr.platformType] = (acc[curr.platformType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
              <p className="text-3xl font-black text-brand-blue-500">{agent.createdCustomers.length}</p>
            </div>
            {platforms.map((platform) => (
              <div key={platform.id} className="p-5 border border-white/10 rounded-2xl bg-white/5 text-center">
                <p className="text-[10px] font-bold text-brand-ink-3 uppercase tracking-widest mb-1 flex justify-center items-center gap-1">
                  <PlatformBadgeIcon iconKey={platform.iconKey} size={12} /> {platform.name}
                </p>
                <p className="text-3xl font-black text-white">{platformCounts[platform.code] || 0}</p>
              </div>
            ))}
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
