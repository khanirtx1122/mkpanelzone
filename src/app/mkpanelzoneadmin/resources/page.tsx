import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight, GitBranch, Link as LinkIcon, Users, Globe } from "lucide-react";
import { ensureDefaultBranches, ensureElitePackageMigration, ensureBranchesForActivePlatforms } from "@/lib/branches";
import { listAllPlatforms } from "@/lib/platforms";
import { PlatformBadgeIcon } from "./PlatformBadgeIcon";

/* Decorative accents cycle by index so a newly added platform inherits the
   visual language without any per-platform styling. */
const ACCENTS = [
  { accent: "text-brand-blue-400", glow: "group-hover:border-brand-blue-500/50 group-hover:shadow-[0_0_20px_rgba(47,95,208,0.15)]" },
  { accent: "text-white/80", glow: "group-hover:border-white/40 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]" },
  { accent: "text-brand-red-500", glow: "group-hover:border-brand-red-500/50 group-hover:shadow-[0_0_20px_rgba(179,18,47,0.15)]" },
];

export default async function ResourcesHomePage() {
  await ensureDefaultBranches();
  await ensureElitePackageMigration();
  /* Guarantees every platform (including newly created ones with no branches
     yet) has at least one branch, so this page is never a dead end. */
  await ensureBranchesForActivePlatforms();

  const [platforms, branches, resources, customers] = await Promise.all([
    listAllPlatforms(),
    prisma.platformBranch.groupBy({ by: ["platformType"], _count: true }),
    prisma.packageResource.groupBy({ by: ["platformType"], _count: true }),
    prisma.customer.groupBy({ by: ["platformType"], _count: true }),
  ]);

  const branchCount = (p: string) => branches.find((b) => b.platformType === p)?._count ?? 0;
  const resourceCount = (p: string) => resources.find((r) => r.platformType === p)?._count ?? 0;
  const customerCount = (p: string) => customers.find((c) => c.platformType === p)?._count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Platform Resources</h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">Choose a platform to manage its branches and resources.</p>
        </div>
        <Link
          href="/mkpanelzoneadmin/platforms"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors w-fit"
        >
          <Globe size={15} /> Manage Platforms
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {platforms.map((platform, i) => {
          const { accent, glow } = ACCENTS[i % ACCENTS.length];
          const bc = branchCount(platform.code);
          const rc = resourceCount(platform.code);
          const cc = customerCount(platform.code);
          return (
            <Link
              key={platform.id}
              href={`/mkpanelzoneadmin/resources/platform/${platform.code}`}
              className="group outline-none active:scale-[0.99] transition-transform"
            >
              <div className={`h-full flex flex-col p-7 bg-[#0E1420] border border-white/5 rounded-xl shadow-2xl transition-all duration-300 hover:-translate-y-1 ${glow}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center ${accent} group-hover:scale-110 transition-transform duration-300`}>
                    <PlatformBadgeIcon iconKey={platform.iconKey} size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    {!platform.isEnabled && (
                      <span className="text-[9px] font-bold px-2 py-1 rounded bg-orange-500/20 text-orange-400 uppercase tracking-widest">Disabled</span>
                    )}
                    <ChevronRight size={18} className="text-brand-ink-3 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-white mb-4 tracking-tight uppercase">{platform.name}</h3>
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-brand-ink-3">
                  <span className="inline-flex items-center gap-1.5">
                    <GitBranch size={12} /> {bc} {bc === 1 ? "branch" : "branches"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <LinkIcon size={12} /> {rc} {rc === 1 ? "resource" : "resources"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={12} /> {cc} {cc === 1 ? "customer" : "customers"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="pt-2">
        <Link
          href="/mkpanelzoneadmin/resources/all"
          className="text-xs font-bold uppercase tracking-widest text-brand-ink-3 hover:text-white transition-colors"
        >
          View all resources (legacy flat list) →
        </Link>
      </div>
    </div>
  );
}
