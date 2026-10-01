import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, GitBranch, Link as LinkIcon, Users } from "lucide-react";
import { BranchManager } from "../../BranchManager";
import { findPlatformByCode } from "@/lib/platforms";

export default async function PlatformBranchesPage(props: {
  params: Promise<{ platform: string }>;
}) {
  const { platform: rawPlatform } = await props.params;
  const platform = rawPlatform.toUpperCase();

  /* Platform validity now comes from the database, so a platform created in
     Admin opens here immediately — with no source change. */
  const platformRecord = await findPlatformByCode(platform);
  if (!platformRecord) return notFound();
  const platformLabel = platformRecord.name;

  const branches = await prisma.platformBranch.findMany({
    where: { platformType: platform },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { customers: true, resources: true } },
    },
  });

  const platformResourceTotal = await prisma.packageResource.count({
    where: { platformType: platform },
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-col gap-4">
        <Link
          href="/mkpanelzoneadmin/resources"
          className="inline-flex items-center gap-2 text-brand-ink-3 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider w-fit"
        >
          <ArrowLeft size={16} /> Platform Resources
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
            {platformLabel} Branches
          </h1>
          {!platformRecord.isEnabled && (
            <span className="text-[9px] font-bold px-2 py-1 rounded bg-orange-500/20 text-orange-400 uppercase tracking-widest">Platform Disabled</span>
          )}
        </div>
        <p className="text-sm text-brand-ink-3 font-mono -mt-2">
          {platformResourceTotal} {platformResourceTotal === 1 ? "resource" : "resources"} on this platform.
        </p>
      </div>

      {/* Branch cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {branches.map((branch) => (
          <div key={branch.id} className="flex flex-col gap-2">
            <Link
              href={`/mkpanelzoneadmin/resources/platform/${platform}/${branch.id}`}
              className="group outline-none active:scale-[0.99] transition-transform"
            >
              <div className={`h-full flex flex-col p-6 bg-[#0E1420] border rounded-xl shadow-2xl transition-all duration-300 hover:-translate-y-1 group-hover:border-brand-blue-500/50 group-hover:shadow-[0_0_20px_rgba(47,95,208,0.15)] ${branch.isEnabled ? "border-white/5" : "border-orange-500/30"}`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-brand-blue-400 group-hover:scale-110 transition-transform duration-300">
                    <GitBranch size={20} />
                  </div>
                  {!branch.isEnabled && (
                    <span className="text-[9px] font-bold px-2 py-1 rounded bg-orange-500/20 text-orange-400 uppercase tracking-widest">Disabled</span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-white mb-3 tracking-tight uppercase">{branch.name}</h3>
                <div className="mt-auto flex items-center gap-4 text-xs font-bold text-brand-ink-3">
                  <span className="inline-flex items-center gap-1.5"><LinkIcon size={12} /> {branch._count.resources} {branch._count.resources === 1 ? "resource" : "resources"}</span>
                  <span className="inline-flex items-center gap-1.5"><Users size={12} /> {branch._count.customers} {branch._count.customers === 1 ? "customer" : "customers"}</span>
                </div>
              </div>
            </Link>
            <BranchManager branch={branch} compact />
          </div>
        ))}

        {/* Add Branch card */}
        <Link
          href={`/mkpanelzoneadmin/resources/branches/new?platform=${platform}`}
          className="group outline-none active:scale-[0.99] transition-transform"
        >
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center p-6 border border-dashed border-white/15 rounded-xl text-brand-ink-3 hover:text-brand-blue-400 hover:border-brand-blue-500/40 hover:bg-brand-blue-500/[0.03] transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Plus size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Add Branch</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
