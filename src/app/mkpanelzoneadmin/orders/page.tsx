import Link from "next/link";
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { resolveProof } from "@/lib/paymentProof";
import { getOrdersPageCached } from "@/lib/adminCache";

const PAGE_SIZE = 25;

export default async function OrdersPage(props: {
  searchParams?: Promise<{ status?: string; query?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const statusFilter = searchParams?.status || "ALL";
  const query = searchParams?.query || "";
  const page = Math.max(1, parseInt(searchParams?.page || "1", 10) || 1);

  /* Cached across requests (see lib/adminCache): with the database in another
     region, every query costs ~356ms of pure round-trip regardless of size, so
     repeating this on every click was the real source of the panel feeling
     slow. Mutations invalidate ADMIN_TAGS.orders so saved changes appear
     immediately. */
  const { rows: orders, total } = await getOrdersPageCached(statusFilter, query, page, PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /* List rendering deliberately does not probe Storage once per row. Those
     network calls created a 25-request waterfall on every pagination/filter
     click. Presence comes from the stored path; definitive availability is
     checked only when the owner opens the order detail. */
  const proofRefs = new Map(orders.map((order) => [order.id, resolveProof(order.paymentProofPath)]));

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (query) params.set("query", query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/mkpanelzoneadmin/orders${qs ? `?${qs}` : ""}`;
  };

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
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Payment Proof</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Status</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Date</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-brand-ink-3">
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
                      {order.customerWhatsapp && (
                        <div className="text-xs text-brand-ink-3 font-mono">WA: {order.customerWhatsapp}</div>
                      )}
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
                    {/* Proof: lightweight lazy thumbnail, or an honest state. */}
                    <td className="px-6 py-4">
                      {!proofRefs.get(order.id) ? (
                        <span className="text-[11px] font-mono text-brand-ink-3 whitespace-nowrap">
                          No payment proof
                        </span>
                      ) : (
                        <Link
                          href={`/mkpanelzoneadmin/orders/${order.id}`}
                          className="inline-flex items-center gap-2 group/proof"
                          title="Open payment proof"
                        >
                          <span className="w-10 h-10 rounded border border-white/10 flex items-center justify-center text-[9px] font-bold text-brand-ink-3 group-hover/proof:border-brand-blue-500/50 transition-colors">
                            {proofRefs.get(order.id)!.inlineVisible ? "IMG" : "FILE"}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue-400 group-hover/proof:text-brand-blue-300 whitespace-nowrap">
                            View Proof
                          </span>
                        </Link>
                      )}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/20">
            <p className="text-xs font-mono text-brand-ink-3">
              Page {page} of {totalPages} · {total} orders
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
    </div>
  );
}
