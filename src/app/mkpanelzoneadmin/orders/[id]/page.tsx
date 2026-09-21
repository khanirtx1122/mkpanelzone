import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Package, ExternalLink, Clock } from "lucide-react";
import { updateOrderStatus } from "../../actions"; // We will add this

export default async function OrderDetailsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      product: true,
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/mkpanelzoneadmin/orders" className="p-2 text-brand-ink-3 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
              Order {order.orderNumber}
            </h1>
            <span className={`px-2 py-1 rounded text-xs font-bold tracking-wider uppercase border ${
              order.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
              order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
              order.status === 'delivered' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
              'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {order.status}
            </span>
          </div>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-[#0E1420] border border-white/5 rounded-xl p-6 shadow-2xl space-y-4">
          <h2 className="text-sm font-bold tracking-widest uppercase text-brand-ink-3 border-b border-white/5 pb-2">Customer Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-ink-3 font-bold mb-1">Email</p>
              <p className="text-sm font-medium text-white">{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-ink-3 font-bold mb-1">Discord/Contact</p>
              <p className="text-sm font-medium text-white">{order.customerDiscord || "Not provided"}</p>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-[#0E1420] border border-white/5 rounded-xl p-6 shadow-2xl space-y-4">
          <h2 className="text-sm font-bold tracking-widest uppercase text-brand-ink-3 border-b border-white/5 pb-2">Product Snapshot</h2>
          <div className="flex items-center gap-4">
            {order.product.coverImageUrl && (
              <div className="w-16 h-16 rounded-lg bg-black border border-white/10 overflow-hidden flex-shrink-0">
                <img src={order.product.coverImageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-white mb-1">{order.product.name}</p>
              <p className="text-xs text-brand-ink-3 font-mono">{order.product.slug}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 p-3 bg-black/40 rounded-lg border border-white/5">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-ink-3">Price Paid</span>
            <span className="text-lg font-black text-brand-blue-400">${order.priceSnapshot.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Proof */}
        <div className="bg-[#0E1420] border border-white/5 rounded-xl p-6 shadow-2xl space-y-4 md:col-span-2">
          <h2 className="text-sm font-bold tracking-widest uppercase text-brand-ink-3 border-b border-white/5 pb-2">Payment Verification</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-ink-3 font-bold mb-1">Amount Reported</p>
                <p className="text-sm font-medium text-white">{order.amountReported ? `$${order.amountReported}` : "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-ink-3 font-bold mb-1">Amount Matches Price</p>
                <p className="text-sm font-medium text-white">{order.amountMatches ? "Yes" : "No"}</p>
              </div>
              
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-brand-ink-3 font-bold mb-3">Order Actions</p>
                <div className="flex flex-wrap gap-2">
                  <form action={updateOrderStatus as any}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" disabled={order.status === 'approved'} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
                      <CheckCircle size={14} /> Approve
                    </button>
                  </form>
                  <form action={updateOrderStatus as any}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status" value="delivered" />
                    <button type="submit" disabled={order.status === 'delivered'} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
                      <Package size={14} /> Mark Delivered
                    </button>
                  </form>
                  <form action={updateOrderStatus as any}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button type="submit" disabled={order.status === 'rejected'} className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
                      <XCircle size={14} /> Reject
                    </button>
                  </form>
                  <form action={updateOrderStatus as any}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <button type="submit" disabled={order.status === 'cancelled'} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
                      <XCircle size={14} /> Cancel
                    </button>
                  </form>
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-brand-ink-3 font-bold mb-2">Payment Proof Screenshot</p>
              {order.paymentProofPath ? (
                <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black aspect-[3/4] max-w-sm">
                  <img src={order.paymentProofPath} alt="Payment Proof" className="w-full h-full object-contain" />
                  <a href={order.paymentProofPath} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="flex items-center gap-2 text-white font-bold tracking-wider uppercase text-xs bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                      Open Full Size <ExternalLink size={14} />
                    </span>
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-black/40 border border-white/5 rounded-xl border-dashed">
                  <p className="text-sm text-brand-ink-3 font-medium">No proof uploaded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
