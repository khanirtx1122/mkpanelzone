import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, UserPlus, ShoppingBag } from "lucide-react";
import { getAnalyticsSnapshot } from "@/lib/analyticsAdmin";
import { AnalyticsOverview } from "@/components/admin/AnalyticsOverview";
import { listAllPlatforms } from "@/lib/platforms";
import { PlatformBadgeIcon } from "./resources/PlatformBadgeIcon";

export const metadata = {
  title: "Dashboard | Owner Panel",
};

export const dynamic = "force-dynamic";

async function DashboardAnalytics() {
  const analytics = await getAnalyticsSnapshot();
  return <AnalyticsOverview initial={analytics} />;
}

function AnalyticsFallback() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 animate-pulse">
      <div className="h-4 w-40 rounded bg-white/10" />
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-xl bg-white/[0.05]" />)}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [totalAgents, totalCustomers, pendingOrders, customersByPlatform, platforms] = await Promise.all([
    prisma.agent.count({ where: { role: "AGENT" } }),
    prisma.customer.count(),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.customer.groupBy({
      by: ['platformType'],
      _count: {
        platformType: true
      }
    }),
    listAllPlatforms(),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase mb-2">Overview</h1>
        <p className="text-brand-ink-3">Platform metrics and system status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          href="/mkpanelzoneadmin/agents"
          className="block p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-blue-500/50 hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 group relative overflow-hidden shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-0" />
          <div className="w-12 h-12 rounded-xl bg-brand-blue-500/10 border border-brand-blue-500/20 text-brand-blue-500 flex items-center justify-center mb-6">
            <Users size={24} />
          </div>
          <p className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-1">Total Agents</p>
          <p className="text-5xl font-black text-white">{totalAgents}</p>
        </Link>

        <Link 
          href="/mkpanelzoneadmin/customers"
          className="block p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-red-500/50 hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 group relative overflow-hidden shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-0" />
          <div className="w-12 h-12 rounded-xl bg-brand-red-500/10 border border-brand-red-500/20 text-brand-red-500 flex items-center justify-center mb-6">
            <UserPlus size={24} />
          </div>
          <p className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-1">Total Customers</p>
          <p className="text-5xl font-black text-white">{totalCustomers}</p>
        </Link>

        <Link
          href="/mkpanelzoneadmin/orders?status=PENDING"
          className="block p-6 rounded-2xl bg-amber-500/[0.05] border border-amber-500/20 hover:border-amber-400/60 hover:bg-amber-500/[0.09] hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 group relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6">
            <ShoppingBag size={24} />
          </div>
          <p className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest mb-1">Unreviewed Orders</p>
          <p className="text-5xl font-black text-white tabular-nums">{pendingOrders}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-amber-400">Review pending payments</p>
        </Link>
      </div>

      <div>
        <h2 className="text-sm font-bold text-brand-ink-3 mb-6 uppercase tracking-widest border-b border-white/5 pb-4">Customers by Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platforms.map((platform) => {
            const count = customersByPlatform.find(c => c.platformType === platform.code)?._count.platformType || 0;
            return (
              <Link 
                key={platform.id}
                href={`/mkpanelzoneadmin/customers?platform=${platform.code}`}
                className="block p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 flex flex-col items-center text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-black border border-white/10 text-brand-ink-2 group-hover:text-white flex items-center justify-center mb-4 transition-colors">
                  <PlatformBadgeIcon iconKey={platform.iconKey} size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1 tracking-wider">{platform.name}</h3>
                <p className="text-3xl font-black text-brand-ink-2 group-hover:text-white transition-colors">{count}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Website analytics streams after operational admin data. Slow secondary
          aggregates never block order/customer navigation or dashboard paint. */}
      <div className="border-t border-white/5 pt-10">
        <Suspense fallback={<AnalyticsFallback />}>
          <DashboardAnalytics />
        </Suspense>
      </div>
    </div>
  );
}
