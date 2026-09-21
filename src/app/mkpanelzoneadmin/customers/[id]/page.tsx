import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, ShieldCheck, ShieldAlert, Monitor, Smartphone, Key, PackageOpen, CreditCard, Tag } from "lucide-react";
import { CustomerActions } from "./CustomerActions";

export default async function CustomerDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      agent: { select: { username: true } },
      package: { select: { id: true, name: true } },
      devices: true
    }
  });

  const packages = await prisma.package.findMany({
    orderBy: { name: "asc" }
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <Link href="/mkpanelzoneadmin/customers" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{customer.identifier}</h1>
            <span className="px-3 py-1 rounded bg-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              {customer.platformType === "PC" ? <Monitor size={14} /> : <Smartphone size={14} />}
              {customer.platformType}
            </span>
            {customer.status === "active" ? (
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider border border-green-500/20 flex items-center gap-1"><ShieldCheck size={14}/> Active</span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider border border-red-500/20 flex items-center gap-1"><ShieldAlert size={14}/> Disabled</span>
            )}
          </div>
          <p className="text-sm font-mono text-brand-ink-3">ID: {customer.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="space-y-6">
          <div className="p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
            <h2 className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest border-b border-white/5 pb-3">Customer Record</h2>
            
            <div className="flex items-center gap-3 text-white">
              <Tag size={18} className="text-brand-ink-3" />
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-ink-3">Creator</p>
                <p className="text-sm font-bold">{customer.agent?.username || customer.createdSource}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-white">
              <PackageOpen size={18} className="text-brand-ink-3" />
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-ink-3">Assigned Package</p>
                <p className="text-sm font-bold">{customer.package?.name || "None"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white">
              <Calendar size={18} className="text-brand-ink-3" />
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-ink-3">Created At</p>
                <p className="text-sm">{customer.createdAt.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-white">
              <Key size={18} className="text-brand-ink-3" />
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-ink-3">Last Login</p>
                <p className="text-sm">{customer.lastLoginAt ? customer.lastLoginAt.toLocaleString() : "Never"}</p>
              </div>
            </div>
          </div>

          <div className="p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
            <h2 className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest border-b border-white/5 pb-3 flex justify-between items-center">
              Payment Proof
            </h2>
            {customer.agentPaymentProof ? (
              <a 
                href={customer.agentPaymentProof} 
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-brand-blue-500/10 border border-brand-blue-500/20 text-sm font-bold hover:bg-brand-blue-500/20 text-brand-blue-400 transition-colors"
              >
                <CreditCard size={18} /> View Payment Proof
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-black/30 border border-white/5 text-sm font-bold text-brand-ink-3">
                No Proof Attached
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="md:col-span-2">
          <CustomerActions 
            customerId={customer.id} 
            currentStatus={customer.status} 
            deviceCount={customer.devices.length}
            currentPlatform={customer.platformType}
            currentPackageId={customer.packageId || ""}
            packages={packages}
          />
        </div>
      </div>
    </div>
  );
}
