import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, ShieldCheck, ShieldAlert, Key, PackageOpen, CreditCard, Tag } from "lucide-react";
import { CustomerActions } from "./CustomerActions";
import { listAllPlatforms } from "@/lib/platforms";
import { PlatformBadgeIcon } from "../../resources/PlatformBadgeIcon";
import { resolveProofWithExistence } from "@/lib/paymentProof";
import { normalizePaymentStatus } from "@/lib/customerAccess";

export default async function CustomerDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  /* Customer, package catalogue and platform list load in one round-trip. */
  const [customer, packages, platforms] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        agent: { select: { username: true } },
        package: { select: { id: true, name: true } },
        devices: { select: { id: true } },
      },
    }),
    prisma.package.findMany({
      orderBy: { name: "asc" }
    }),
    listAllPlatforms(),
  ]);

  if (!customer) {
    notFound();
  }

  /* Resolve the stored proof reference (object path OR legacy value) and check
     the object still exists, so Admin sees either the real image or an honest
     "no proof" / "file unavailable" message — never a broken image icon. */
  const proof = await resolveProofWithExistence(customer.agentPaymentProof);

  const platformLabel = platforms.find((p) => p.code === customer.platformType)?.name ?? customer.platformType;
  const paymentStatus = normalizePaymentStatus(customer.paymentStatus);

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
              <PlatformBadgeIcon
                iconKey={platforms.find((p) => p.code === customer.platformType)?.iconKey}
                size={14}
              />
              {platformLabel}
            </span>
            {customer.status === "active" ? (
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider border border-green-500/20 flex items-center gap-1"><ShieldCheck size={14}/> Active</span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider border border-red-500/20 flex items-center gap-1"><ShieldAlert size={14}/> Disabled</span>
            )}
            {paymentStatus === "UNPAID" ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/25">Unpaid</span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-wider border border-green-500/25">Paid</span>
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
            <h2 className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest border-b border-white/5 pb-3">
              Payment Proof
            </h2>

            {!proof ? (
              <div className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-black/30 border border-white/5 text-sm font-bold text-brand-ink-3 text-center">
                No payment proof submitted
              </div>
            ) : !proof.exists ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-bold text-red-400 text-center">
                  Proof file is missing from storage
                </div>
                <p className="text-[11px] text-brand-ink-3 font-mono break-all">
                  Recorded reference: {proof.raw}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {proof.inlineVisible ? (
                  <a href={proof.url} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={proof.url}
                      alt="Payment proof"
                      loading="lazy"
                      decoding="async"
                      className="w-full max-h-64 object-contain rounded-xl border border-white/10 bg-black/40"
                    />
                  </a>
                ) : (
                  <p className="text-[12px] text-brand-ink-3">
                    This proof is not an inline-image format (HEIC/PDF). Open it to view the original.
                  </p>
                )}
                <a
                  href={proof.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-brand-blue-500/10 border border-brand-blue-500/20 text-sm font-bold hover:bg-brand-blue-500/20 text-brand-blue-400 transition-colors"
                >
                  <CreditCard size={18} /> View Payment Proof
                </a>
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
            currentPaymentStatus={paymentStatus}
            packages={packages}
            platforms={platforms.map((p) => ({ code: p.code, name: p.name }))}
          />
        </div>
      </div>
    </div>
  );
}
