import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, GitBranch, Link as LinkIcon, Users, Edit, Power, PowerOff } from "lucide-react";
import { toggleResourceStatus } from "../../../../actions";
import { BranchManager } from "../../../BranchManager";

const PLATFORM_LABELS: Record<string, string> = {
  ANDROID: "Android",
  IOS: "iPhone",
  PC: "PC",
};

export default async function BranchResourcesPage(props: {
  params: Promise<{ platform: string; branchId: string }>;
}) {
  const { platform: rawPlatform, branchId } = await props.params;
  const platform = rawPlatform.toUpperCase();
  if (!["ANDROID", "IOS", "PC"].includes(platform)) return notFound();

  const branch = await prisma.platformBranch.findUnique({
    where: { id: branchId },
    include: {
      _count: { select: { customers: true, resources: true } },
    },
  });
  if (!branch || branch.platformType !== platform) return notFound();

  const resources = await prisma.packageResource.findMany({
    where: { branchId: branch.id },
    include: { package: true },
    orderBy: { createdAt: "desc" },
  });

  const addResourceHref = `/mkpanelzoneadmin/resources/new?platform=${platform}&branchId=${branch.id}`;

  const editLink = (id: string) =>
    `/mkpanelzoneadmin/resources/${id}?platform=${platform}&branchId=${branch.id}`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb: Platform Resources / Android / AIM Plus Holo */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <Link href="/mkpanelzoneadmin/resources" className="text-brand-ink-3 hover:text-white transition-colors">
            Platform Resources
          </Link>
          <span className="text-brand-ink-3/50">/</span>
          <Link
            href={`/mkpanelzoneadmin/resources/platform/${platform}`}
            className="text-brand-ink-3 hover:text-white transition-colors"
          >
            {PLATFORM_LABELS[platform]}
          </Link>
          <span className="text-brand-ink-3/50">/</span>
          <span className="text-white">{branch.name}</span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-brand-blue-400 flex-shrink-0">
              <GitBranch size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">{branch.name}</h1>
              <p className="text-sm text-brand-ink-3 mt-1 font-mono flex flex-wrap items-center gap-x-3">
                <span>{PLATFORM_LABELS[platform]} branch</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1"><LinkIcon size={12} /> {resources.length} {resources.length === 1 ? "resource" : "resources"}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1"><Users size={12} /> {branch._count.customers} {branch._count.customers === 1 ? "customer" : "customers"}</span>
              </p>
            </div>
          </div>
          <Link
            href={addResourceHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors active:scale-[0.98] w-fit"
          >
            <Plus size={16} /> Add Resource
          </Link>
        </div>
      </div>

      {/* Branch settings (edit / rename / enable-disable) */}
      <BranchManager branch={branch} />

      {/* Resources belonging ONLY to this branch */}
      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40">
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Resource Name</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3 hidden md:table-cell">Type</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3 hidden md:table-cell">Assignment</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Status</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {resources.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-brand-ink-3">
                    <div className="flex flex-col items-center gap-3">
                      <span>No resources in this branch yet.</span>
                      <Link
                        href={addResourceHref}
                        className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
                      >
                        <Plus size={14} /> Add the first resource
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                resources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-black border border-white/10 flex items-center justify-center flex-shrink-0">
                          <LinkIcon size={18} className="text-brand-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate max-w-[220px]">{resource.name}</div>
                          <div className="text-xs text-brand-ink-3 font-mono max-w-[220px] truncate">{resource.url || resource.secret}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-brand-ink-2 hidden md:table-cell">
                      <span className="px-2 py-1 bg-white/5 rounded text-xs font-bold">{resource.type}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {resource.package ? (
                        <span className="text-sm font-bold text-white/70">{resource.package.name}</span>
                      ) : (
                        <span className="text-xs font-mono text-brand-ink-3 italic">Branch-wide</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${
                          resource.status === "active"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-brand-ink-3/10 text-brand-ink-3 border-brand-ink-3/20"
                        }`}
                      >
                        {resource.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={editLink(resource.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                        >
                          <Edit size={14} /> Edit
                        </Link>
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            await toggleResourceStatus(formData);
                          }}
                        >
                          <input type="hidden" name="resourceId" value={resource.id} />
                          <button
                            type="submit"
                            className={`inline-flex items-center gap-2 px-3 py-1.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded transition-colors ${
                              resource.status === "active"
                                ? "text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20"
                                : "text-green-400 bg-green-500/10 hover:bg-green-500/20 border-green-500/20"
                            }`}
                          >
                            {resource.status === "active" ? <PowerOff size={14} /> : <Power size={14} />}
                            {resource.status === "active" ? "Disable" : "Enable"}
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
