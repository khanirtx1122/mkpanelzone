import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Link as LinkIcon, Power, PowerOff, Filter, GitBranch } from "lucide-react";
import { toggleResourceStatus } from "../../actions";
import { BranchManager } from "../BranchManager";
import { listAllPlatforms } from "@/lib/platforms";

export default async function ResourcesPage(props: {
  searchParams?: Promise<{ packageId?: string; platform?: string; branchId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const packageIdFilter = searchParams?.packageId || "";
  const platformFilter = searchParams?.platform || "";
  const branchIdFilter = searchParams?.branchId || "";

  const platformList = await listAllPlatforms();

  const packages = await prisma.package.findMany({
    where: platformFilter ? { platformType: platformFilter } : {},
    orderBy: { name: "asc" }
  });

  const branches = platformFilter
    ? await prisma.platformBranch.findMany({
        where: { platformType: platformFilter },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      })
    : [];

  const activeBranch = branchIdFilter ? branches.find((b) => b.id === branchIdFilter) || null : null;

  const resources = await prisma.packageResource.findMany({
    where: {
      ...(packageIdFilter ? { packageId: packageIdFilter } : {}),
      ...(platformFilter && !packageIdFilter
        ? {
            platformType: platformFilter,
            // Branch scoping: a branch tab shows resources bound to it;
            // the platform-level tab shows everything on the platform.
            ...(branchIdFilter ? { branchId: branchIdFilter } : {}),
          }
        : {}),
    },
    include: { package: true, branch: true },
    orderBy: { createdAt: "desc" }
  });

  const buildUrl = (updates: { platform?: string, packageId?: string, branchId?: string }) => {
    const params = new URLSearchParams();
    const p = updates.platform !== undefined ? updates.platform : platformFilter;
    const pkg = updates.packageId !== undefined ? updates.packageId : packageIdFilter;
    const br = updates.branchId !== undefined ? updates.branchId : branchIdFilter;
    if (p) params.set("platform", p);
    if (pkg) params.set("packageId", pkg);
    if (br) params.set("branchId", br);
    return `/mkpanelzoneadmin/resources/all?${params.toString()}`;
  };

  const addResourceHref = (() => {
    const params = new URLSearchParams();
    if (packageIdFilter) params.set("packageId", packageIdFilter);
    if (platformFilter) params.set("platform", platformFilter);
    if (branchIdFilter) params.set("branchId", branchIdFilter);
    const qs = params.toString();
    return `/mkpanelzoneadmin/resources/new${qs ? '?' + qs : ''}`;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Resources</h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">Manage URLs and secrets for packages.</p>
        </div>
        <Link
          href={addResourceHref}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
        >
          <Plus size={16} /> Add Resource
        </Link>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-black/40 flex flex-col gap-4">
          {/* Platform Tabs */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center border-b border-white/5 pb-4">
            <div className="flex items-center gap-2 text-sm text-brand-ink-3 min-w-[120px]">
              <Filter size={16} />
              <span className="font-bold uppercase tracking-widest text-xs">Platform:</span>
            </div>

            <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide">
              <Link
                href={buildUrl({ platform: "", packageId: "", branchId: "" })}
                className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-colors whitespace-nowrap ${
                  !platformFilter ? "bg-brand-blue-500/20 text-brand-blue-400 border border-brand-blue-500/30" : "text-brand-ink-3 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                All Platforms
              </Link>
              {platformList.map((plat) => (
                <Link
                  key={plat.code}
                  href={buildUrl({ platform: plat.code, packageId: "", branchId: "" })}
                  className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                    platformFilter === plat.code ? "bg-brand-blue-500/20 text-brand-blue-400 border border-brand-blue-500/30" : "text-brand-ink-3 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {plat.name}
                  {!plat.isEnabled && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-orange-500/20 text-orange-400 uppercase">off</span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Branch Tabs (platforms that have branches) */}
          {platformFilter && branches.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 text-sm text-brand-ink-3 min-w-[120px]">
                <GitBranch size={16} />
                <span className="font-bold uppercase tracking-widest text-xs">Branches:</span>
              </div>

              <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide items-center">
                <Link
                  href={buildUrl({ branchId: "" })}
                  className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-colors whitespace-nowrap ${
                    !branchIdFilter ? "bg-white/10 text-white border border-white/20" : "text-brand-ink-3 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  All {platformList.find((p) => p.code === platformFilter)?.name ?? platformFilter}
                </Link>
                {branches.map(branch => (
                  <Link
                    key={branch.id}
                    href={buildUrl({ branchId: branch.id })}
                    className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                      branchIdFilter === branch.id ? "bg-brand-blue-500/20 text-brand-blue-400 border border-brand-blue-500/30" : "text-brand-ink-3 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {branch.name}
                    {!branch.isEnabled && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-orange-500/20 text-orange-400 uppercase">off</span>
                    )}
                  </Link>
                ))}
                <Link
                  href={`/mkpanelzoneadmin/resources/branches/new?platform=${platformFilter}`}
                  className="px-3 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 text-brand-blue-400 hover:text-brand-blue-300 hover:bg-brand-blue-500/10 border border-dashed border-brand-blue-500/30"
                >
                  <Plus size={12} /> New Branch
                </Link>
              </div>
            </div>
          )}

          {/* Package Tabs */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2 text-sm text-brand-ink-3 min-w-[120px]">
              <Filter size={16} />
              <span className="font-bold uppercase tracking-widest text-xs">Package:</span>
            </div>

            <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide">
              <Link
                href={buildUrl({ packageId: "" })}
                className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-colors whitespace-nowrap ${
                  !packageIdFilter ? "bg-brand-blue-500/20 text-brand-blue-400 border border-brand-blue-500/30" : "text-brand-ink-3 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                All Packages
              </Link>
              {packages.map(pkg => (
                <Link
                  key={pkg.id}
                  href={buildUrl({ packageId: pkg.id })}
                  className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-colors whitespace-nowrap ${
                    packageIdFilter === pkg.id ? "bg-brand-blue-500/20 text-brand-blue-400 border border-brand-blue-500/30" : "text-brand-ink-3 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {pkg.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Active branch management panel */}
        {activeBranch && (
          <BranchManager branch={activeBranch} />
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40">
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Resource Name</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Type</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Assignment</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3">Status</th>
                <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-brand-ink-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {resources.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-brand-ink-3">
                    No resources found.
                  </td>
                </tr>
              ) : (
                resources.map(resource => (
                  <tr key={resource.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-black border border-white/10 flex items-center justify-center flex-shrink-0">
                          <LinkIcon size={18} className="text-brand-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{resource.name}</div>
                          <div className="text-xs text-brand-ink-3 font-mono max-w-[200px] truncate">{resource.url || resource.secret}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-brand-ink-2">
                      <span className="px-2 py-1 bg-white/5 rounded text-xs font-bold">
                        {resource.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex flex-col gap-1 items-start justify-center min-h-[72px]">
                      {resource.package ? (
                        <span className="text-sm font-bold text-white/70">
                          {resource.package.name}
                        </span>
                      ) : resource.branch ? (
                        <span className="text-sm font-bold text-brand-blue-400 inline-flex items-center gap-1">
                          <GitBranch size={11} /> {resource.branch.name}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-brand-ink-3 italic">
                          Global Resource
                        </span>
                      )}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border bg-white/5 text-white/50 border-white/10">
                        {resource.platformType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${
                        resource.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-brand-ink-3/10 text-brand-ink-3 border-brand-ink-3/20'
                      }`}>
                        {resource.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/mkpanelzoneadmin/resources/${resource.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
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
                            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border rounded transition-colors ${
                              resource.status === 'active'
                                ? "text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20"
                                : "text-green-400 bg-green-500/10 hover:bg-green-500/20 border-green-500/20"
                            }`}
                          >
                            {resource.status === 'active' ? <PowerOff size={14} /> : <Power size={14} />}
                            {resource.status === 'active' ? "Disable" : "Enable"}
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
