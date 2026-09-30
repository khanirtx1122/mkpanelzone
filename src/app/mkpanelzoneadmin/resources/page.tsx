import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Smartphone, Apple, Monitor, ChevronRight, GitBranch, Link as LinkIcon, Users } from "lucide-react";
import { ensureDefaultBranches, ensureElitePackageMigration } from "@/lib/branches";

const PLATFORMS = [
  { code: "ANDROID", label: "Android", Icon: Smartphone, accent: "text-brand-blue-400", glow: "group-hover:border-brand-blue-500/50 group-hover:shadow-[0_0_20px_rgba(47,95,208,0.15)]" },
  { code: "IOS", label: "iPhone", Icon: Apple, accent: "text-white/80", glow: "group-hover:border-white/40 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]" },
  { code: "PC", label: "PC", Icon: Monitor, accent: "text-brand-red-500", glow: "group-hover:border-brand-red-500/50 group-hover:shadow-[0_0_20px_rgba(179,18,47,0.15)]" },
] as const;

export default async function ResourcesHomePage() {
  await ensureDefaultBranches();
  await ensureElitePackageMigration();

  const [branches, resources, customers] = await Promise.all([
    prisma.platformBranch.groupBy({ by: ["platformType"], _count: true }),
    prisma.packageResource.groupBy({ by: ["platformType"], _count: true }),
    prisma.customer.groupBy({ by: ["platformType"], _count: true }),
  ]);

  const branchCount = (p: string) => branches.find((b) => b.platformType === p)?._count ?? 0;
  const resourceCount = (p: string) => resources.find((r) => r.platformType === p)?._count ?? 0;
  const customerCount = (p: string) => customers.find((c) => c.platformType === p)?._count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Platform Resources</h1>
        <p className="text-sm text-brand-ink-3 mt-1 font-mono">Choose a platform to manage its branches and resources.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLATFORMS.map(({ code, label, Icon, accent, glow }) => (
          <Link
            key={code}
            href={`/mkpanelzoneadmin/resources/platform/${code}`}
            className="group outline-none active:scale-[0.99] transition-transform"
          >
            <div className={`h-full flex flex-col p-7 bg-[#0E1420] border border-white/5 rounded-xl shadow-2xl transition-all duration-300 hover:-translate-y-1 ${glow}`}>
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center ${accent} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={24} />
                </div>
                <ChevronRight size={18} className="text-brand-ink-3 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-extrabold text-white mb-4 tracking-tight uppercase">{label}</h3>
              <div className="mt-auto flex items-center gap-4 text-xs font-bold text-brand-ink-3">
                <span className="inline-flex items-center gap-1.5">
                  <GitBranch size={12} /> {branchCount(code)} {branchCount(code) === 1 ? "branch" : "branches"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <LinkIcon size={12} /> {resourceCount(code)} {resourceCount(code) === 1 ? "resource" : "resources"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users size={12} /> {customerCount(code)} {customerCount(code) === 1 ? "customer" : "customers"}
                </span>
              </div>
            </div>
          </Link>
        ))}
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
