import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Eye } from "lucide-react";

export default async function OrdersPage(props: {
  searchParams?: Promise<{ status?: string; query?: string }>;
}) {
  const searchParams = await props.searchParams;
  const statusFilter = searchParams?.status || "ALL";
  const query = searchParams?.query || "";

  let whereClause: any = {};
  if (statusFilter !== "ALL") {
    whereClause.status = statusFilter.toLowerCase();
  }
  
  if (query) {
    whereClause.OR = [
      { orderNumber: { contains: query, mode: "insensitive" } },
      { customerEmail: { contains: query, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      product: { select: { name: true, coverImageUrl: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const statuses = ["ALL", "PENDING", "APPROVED", "DELIVERED", "REJECTED", "CANCELLED"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Orders</h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">Review payments and order fulfillment.</p>
        </div>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between bg-black/20">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {statuses.map(status => (
              <Link
                key={status}
                href={`/mkpanelzoneadmin/orders?status=${status}${query ? `&query=${query}` : ""}`}
                className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter.toUpperCase() === status ? "bg-brand-blue-500/20 text-brand-blue-400 border border-brand-blue-500/30" : "text-brand-ink-3 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {status}
              </Link>
            ))}
          </div>

          <form className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink-3" size={16} />
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="Search order or email..."
              className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-brand-ink-3 focus:outline-none focus:border-brand-blue-500/50 transition-colors"
            />
            <input type="hidden" name="status" value={statusFilter} />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40">
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Order</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Customer</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Product</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Amount</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Status</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Date</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-brand-ink-3">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-white">{order.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{order.customerEmail}</div>
                      {order.customerDiscord && <div className="text-xs text-brand-ink-3">{order.customerDiscord}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {order.product.coverImageUrl && (
                          <div className="w-8 h-8 rounded bg-black border border-white/10 overflow-hidden flex-shrink-0">
                            <img src={order.product.coverImageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">{order.product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-brand-blue-400">${order.priceSnapshot.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${
                        order.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        order.status === 'delivered' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-ink-2">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/mkpanelzoneadmin/orders/${order.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                      >
                        <Eye size={14} /> View
                      </Link>
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
