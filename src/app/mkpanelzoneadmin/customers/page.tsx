import { prisma } from "@/lib/prisma";
import { CustomerFilters } from "./CustomerFilters";
import { ShieldAlert, ShieldCheck, Smartphone, Monitor, UserPlus } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Customers | Owner Panel",
};

export default async function AdminCustomersPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q as string || "";
  const platformFilter = searchParams?.platform as string || "ALL";
  const statusFilter = searchParams?.status as string || "ALL";
  const agentFilter = searchParams?.agentId as string || "";

  const customers = await prisma.customer.findMany({
    where: {
      ...(q ? { identifier: { contains: q } } : {}),
      ...(platformFilter !== "ALL" ? { platformType: platformFilter } : {}),
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      ...(agentFilter ? { createdByAgentId: agentFilter } : {})
    },
    orderBy: { createdAt: "desc" },
    include: {
      agent: {
        select: { username: true }
      },
      package: {
        select: { name: true }
      }
    }
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase mb-2">Customer Records</h1>
          <p className="text-brand-ink-3">View and manage all registered customers.</p>
        </div>
        <Link 
          href="/mkpanelzoneadmin/customers/new" 
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-blue-500 hover:bg-brand-blue-400 text-white font-bold rounded-lg transition-colors"
        >
          <UserPlus size={18} />
          <span>Create Customer</span>
        </Link>
      </div>

      <CustomerFilters />

      <div className="space-y-4">
        {customers.length === 0 ? (
          <div className="p-8 text-center border border-white/5 rounded-2xl bg-white/5">
            <p className="text-brand-ink-3">No customers found matching your criteria.</p>
          </div>
        ) : (
          customers.map((customer) => (
            <Link key={customer.id} href={`/mkpanelzoneadmin/customers/${customer.id}`} className="block">
              <div className="p-5 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-brand-blue-500/50 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${customer.status === "active" ? "bg-green-500" : "bg-red-500"}`}></div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white text-lg group-hover:text-brand-blue-400 transition-colors">{customer.identifier}</p>
                      
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        {customer.platformType === "PC" ? <Monitor size={10} /> : <Smartphone size={10} />}
                        {customer.platformType}
                      </span>
                      
                      {customer.status === "active" ? (
                        <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold uppercase tracking-wider">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider">Disabled</span>
                      )}
                    </div>
                    <div className="text-xs text-brand-ink-3 font-mono flex items-center gap-2">
                      <span>Package: {customer.package?.name || "None"}</span>
                      <span>•</span>
                      <span>Creator: {customer.agent?.username || customer.createdSource}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right flex items-center gap-4 justify-end">
                  {customer.agentPaymentProof && (
                    <span className="text-[10px] uppercase font-bold px-2 py-1 bg-brand-blue-500/10 text-brand-blue-500 border border-brand-blue-500/20 rounded">Proof Attached</span>
                  )}
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-brand-ink-3 tracking-widest mb-0.5">Joined</p>
                    <p className="text-sm font-bold text-white">{customer.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
