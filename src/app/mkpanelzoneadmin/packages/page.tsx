import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Package as PackageIcon, Settings } from "lucide-react";

export default async function PackagesPage() {
  const { ensureDefaultPackages } = await import("@/lib/auto-repair");
  await ensureDefaultPackages();

  const packages = await prisma.package.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { customers: true, resources: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Packages</h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">Manage customer tiers and access levels.</p>
        </div>
        <Link
          href="/mkpanelzoneadmin/packages/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
        >
          <Plus size={16} /> Add Package
        </Link>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40">
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Package Name</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Description</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Platform</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3 text-center">Customers</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3 text-center">Resources</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-brand-ink-3">
                    No packages found.
                  </td>
                </tr>
              ) : (
                packages.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-black border border-white/10 flex items-center justify-center flex-shrink-0">
                          <PackageIcon size={18} className="text-brand-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-white">{pkg.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-brand-ink-2 max-w-xs truncate">
                      {pkg.description || <span className="text-white/20 italic">No description</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-white/5 text-white border border-white/10">
                          {pkg.platformType}
                        </span>
                        {pkg.isDefaultForAgents && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-brand-blue-500/10 text-brand-blue-400 border border-brand-blue-500/20">
                            AGENT DEFAULT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-brand-blue-500/10 text-brand-blue-400 font-mono text-xs font-bold">
                        {pkg._count.customers}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/5 text-white/50 font-mono text-xs font-bold">
                        {pkg._count.resources}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/mkpanelzoneadmin/resources?packageId=${pkg.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-ink-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                          title="Manage Resources"
                        >
                          <Settings size={14} /> Resources
                        </Link>
                        <Link 
                          href={`/mkpanelzoneadmin/packages/${pkg.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                        >
                          <Edit size={14} /> Edit
                        </Link>
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
