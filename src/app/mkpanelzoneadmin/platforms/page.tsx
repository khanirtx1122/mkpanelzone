import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, GitBranch, Link as LinkIcon, Users, Package as PackageIcon, ShieldCheck, ShieldOff } from "lucide-react";
import { listAllPlatforms } from "@/lib/platforms";
import { PlatformManager } from "./PlatformManager";

export const metadata = { title: "Platforms | Owner Panel" };

export default async function PlatformsPage() {
  const platforms = await listAllPlatforms();

  /* Counts for every platform in four grouped queries instead of 4×N. */
  const [branches, resources, customers, packages] = await Promise.all([
    prisma.platformBranch.groupBy({ by: ["platformType"], _count: true }),
    prisma.packageResource.groupBy({ by: ["platformType"], _count: true }),
    prisma.customer.groupBy({ by: ["platformType"], _count: true }),
    prisma.package.groupBy({ by: ["platformType"], _count: true }),
  ]);

  const countFor = (rows: { platformType: string; _count: number }[], code: string) =>
    rows.find((r) => r.platformType === code)?._count ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Platforms</h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">
            The master list of access platforms. Adding one here makes it available everywhere automatically.
          </p>
        </div>
      </div>

      {/* Add platform */}
      <PlatformManager
        mode="create"
        trigger={
          <div className="group flex min-h-[92px] cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 p-6 text-brand-ink-3 transition-colors hover:border-brand-blue-500/40 hover:bg-brand-blue-500/[0.03] hover:text-brand-blue-400">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/40 transition-transform duration-300 group-hover:scale-110">
              <Plus size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Add Platform</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`flex h-full flex-col rounded-xl border p-6 shadow-2xl ${
              platform.isEnabled
                ? "border-white/5 bg-[#0E1420]"
                : "border-orange-500/30 bg-[#0E1420]/60"
            }`}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <PlatformManager mode="edit" platform={platform} />
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
                  platform.isEnabled
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-orange-500/20 text-orange-400 border border-orange-500/20"
                }`}
              >
                {platform.isEnabled ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
                {platform.isEnabled ? "Active" : "Disabled"}
              </span>
            </div>

            <h3 className="mb-1 text-lg font-extrabold uppercase tracking-tight text-white">{platform.name}</h3>
            <p className="mb-4 font-mono text-[11px] uppercase text-brand-ink-3">{platform.code}</p>
            {platform.description && (
              <p className="mb-4 text-[13px] leading-relaxed text-brand-ink-3">{platform.description}</p>
            )}

            <div className="mt-auto grid grid-cols-2 gap-2 text-xs font-bold text-brand-ink-3">
              <span className="inline-flex items-center gap-1.5">
                <GitBranch size={12} /> {countFor(branches, platform.code)} branches
              </span>
              <span className="inline-flex items-center gap-1.5">
                <LinkIcon size={12} /> {countFor(resources, platform.code)} resources
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={12} /> {countFor(customers, platform.code)} customers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PackageIcon size={12} /> {countFor(packages, platform.code)} packages
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3 border-t border-white/5 pt-4">
              <Link
                href={`/mkpanelzoneadmin/resources/platform/${platform.code}`}
                className="text-[11px] font-bold uppercase tracking-widest text-brand-ink-3 transition-colors hover:text-white"
              >
                Manage branches →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
