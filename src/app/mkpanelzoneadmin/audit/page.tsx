import { prisma } from "@/lib/prisma";
import { ShieldAlert, Clock } from "lucide-react";

export default async function AuditLogPage() {
  const recentOrders = await prisma.order.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: { product: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Audit Logs</h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">System activity and transaction logs.</p>
        </div>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40">
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Time</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Event</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Status</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-brand-ink-3">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-brand-ink-3 text-xs font-mono">
                        <Clock size={14} />
                        {order.updatedAt.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-black border border-white/10 flex items-center justify-center flex-shrink-0">
                          <ShieldAlert size={14} className="text-brand-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Order Status Updated</div>
                          <div className="text-xs text-brand-ink-3 font-mono">Product: {order.product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${
                        order.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                        order.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-brand-ink-2">
                      #{order.orderNumber}
                      <div className="text-[10px] text-white/30">{order.customerEmail}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
