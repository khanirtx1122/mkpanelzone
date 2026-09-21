import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, CreditCard, Power, PowerOff } from "lucide-react";
import { togglePaymentMethod } from "../actions"; // will create this

export default async function PaymentMethodsPage() {
  const methods = await prisma.paymentMethod.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Payment Methods</h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">Manage accepted payment types and account details.</p>
        </div>
        <Link
          href="/mkpanelzoneadmin/payments/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
        >
          <Plus size={16} /> Add Method
        </Link>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40">
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Method Name</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Account Details</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Status</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {methods.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-brand-ink-3">
                    No payment methods found.
                  </td>
                </tr>
              ) : (
                methods.map(method => (
                  <tr key={method.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-black border border-white/10 flex items-center justify-center flex-shrink-0">
                          <CreditCard size={18} className="text-brand-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-white">{method.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-brand-ink-2 whitespace-pre-wrap max-w-xs">
                      {method.accountDetails}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${
                        method.active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-brand-ink-3/10 text-brand-ink-3 border-brand-ink-3/20'
                      }`}>
                        {method.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/mkpanelzoneadmin/payments/${method.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                        >
                          <Edit size={14} /> Edit
                        </Link>
                        <form action={togglePaymentMethod as any}>
                          <input type="hidden" name="methodId" value={method.id} />
                          <button 
                            type="submit"
                            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border rounded transition-colors ${
                              method.active 
                                ? "text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20" 
                                : "text-green-400 bg-green-500/10 hover:bg-green-500/20 border-green-500/20"
                            }`}
                          >
                            {method.active ? <PowerOff size={14} /> : <Power size={14} />}
                            {method.active ? "Disable" : "Enable"}
                          </button>
                        </form>
                      </div>
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
