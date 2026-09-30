import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { DeleteResourceButton } from "../DeleteResourceButton";

export default async function EditResourcePage(props: { 
  params: Promise<{ id: string }>,
  searchParams?: Promise<{ packageId?: string, platform?: string, branchId?: string, returnTo?: string }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const isNew = params.id === "new";
  const defaultPackageId = searchParams?.packageId || "";
  const platformFilter = searchParams?.platform || null;
  const returnTo = searchParams?.returnTo === "all" ? "all" : "branch";
  const backHref = returnTo === "all"
    ? "/mkpanelzoneadmin/resources/all"
    : "/mkpanelzoneadmin/resources";

  let resource = null;
  if (!isNew) {
    resource = await prisma.packageResource.findUnique({
      where: { id: params.id }
    });
    if (!resource) return notFound();
  }

  const packages = await prisma.package.findMany({
    where: platformFilter ? { platformType: platformFilter } : {},
    orderBy: { name: "asc" }
  });

  const allBranches = await prisma.platformBranch.findMany({
    orderBy: [{ platformType: "asc" }, { sortOrder: "asc" }],
  });

  const androidPackages = packages.filter(p => p.platformType === "ANDROID");
  const iosPackages = packages.filter(p => p.platformType === "IOS");
  const pcPackages = packages.filter(p => p.platformType === "PC");

  async function saveResource(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const rawPackageId = formData.get("packageId") as string;
    const packageId = rawPackageId === "" ? null : rawPackageId;
    const platformType = formData.get("platformType") as string;
    const rawBranchId = formData.get("branchId") as string;
    const branchId = rawBranchId === "" ? null : rawBranchId;
    const url = formData.get("url") as string || null;
    const secret = formData.get("secret") as string || null;
    const status = formData.get("status") as string;

    try {
      if (packageId) {
        const pkg = await prisma.package.findUnique({ where: { id: packageId } });
        if (!pkg) {
          throw new Error("Invalid package selected");
        }
        if (pkg.platformType !== platformType) {
          throw new Error(`Platform mismatch: Package belongs to ${pkg.platformType} but resource is set to ${platformType}`);
        }
      }

      if (branchId) {
        const branch = await prisma.platformBranch.findUnique({ where: { id: branchId } });
        if (!branch) {
          throw new Error("Invalid branch selected");
        }
        if (branch.platformType !== platformType) {
          throw new Error(`Platform mismatch: Branch belongs to ${branch.platformType} but resource is set to ${platformType}`);
        }
      }

      if (isNew) {
        await prisma.packageResource.create({
          data: { name, type, packageId, platformType, branchId, url, secret, status }
        });
      } else {
        await prisma.packageResource.update({
          where: { id: params.id },
          data: { name, type, packageId, platformType, branchId, url, secret, status }
        });
      }
      revalidatePath("/mkpanelzoneadmin/resources");
      revalidatePath("/mkpanelzoneadmin/resources/all");
      redirect(backHref);
    } catch (error) {
      console.error(error);
      redirect(`${backHref}?error=failed`);
    }
  }

  async function deleteResource() {
    "use server";
    if (isNew) return;
    try {
      await prisma.packageResource.delete({ where: { id: params.id } });
      revalidatePath("/mkpanelzoneadmin/resources");
      revalidatePath("/mkpanelzoneadmin/resources/all");
      redirect(backHref);
    } catch (error) {
      console.error(error);
      redirect(`${backHref}?error=failed`);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={backHref} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-brand-ink-3 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
            {isNew ? "Add Resource" : "Edit Resource"}
          </h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">
            Provide URLs or secrets for packages.
          </p>
        </div>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={saveResource} className="space-y-6" id="resourceForm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Platform Type</label>
              <select 
                name="platformType"
                defaultValue={resource?.platformType || platformFilter || "ANDROID"}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
                required
              >
                <option value="ANDROID">ANDROID</option>
                <option value="IOS">IPHONE / IOS</option>
                <option value="PC">PC</option>
              </select>
              <p className="text-[10px] text-brand-ink-3 mt-1">If a package is selected below, its platform must match this.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Target Package (Optional)</label>
              <select 
                name="packageId"
                defaultValue={resource?.packageId || defaultPackageId}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              >
                <option value="">-- No Specific Package --</option>
                {androidPackages.length > 0 && (
                  <optgroup label="ANDROID PACKAGES">
                    {androidPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </optgroup>
                )}
                {iosPackages.length > 0 && (
                  <optgroup label="IPHONE / IOS PACKAGES">
                    {iosPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </optgroup>
                )}
                {pcPackages.length > 0 && (
                  <optgroup label="PC PACKAGES">
                    {pcPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Branch (Optional)</label>
              <select
                name="branchId"
                defaultValue={resource?.branchId || (isNew ? searchParams?.branchId || "" : "")}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              >
                <option value="">-- Platform-wide --</option>
                {allBranches.length > 0 && (
                  <optgroup label="BRANCHES">
                    {allBranches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.platformType === "IOS" ? "IPHONE" : branch.platformType} — {branch.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="text-[10px] text-brand-ink-3 mt-1">Platform-wide resources are visible to every branch on the platform. Branch resources only inside their branch.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Resource Type</label>
              <select 
                name="type"
                defaultValue={resource?.type || "LINK"}
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              >
                <option value="LINK">External Link</option>
                <option value="FILE">File Download URL</option>
                <option value="SECRET">Secret Key / License</option>
                <option value="NOTE">Instruction Note</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Resource Name</label>
              <input 
                type="text" 
                name="name" 
                defaultValue={resource?.name || ""}
                required
                placeholder="e.g. Premium Scripts Hub"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Status</label>
              <select 
                name="status"
                defaultValue={resource?.status || "active"}
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">URL (Optional)</label>
              <input 
                type="text" 
                name="url" 
                defaultValue={resource?.url || ""}
                placeholder="https://..."
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Secret Value / Notes (Optional)</label>
              <textarea 
                name="secret" 
                defaultValue={resource?.secret || ""}
                rows={3}
                placeholder="Enter license key, credentials, or instructions..."
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
              />
            </div>
          </div>
        </form>

        <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
          {!isNew ? (
            <form action={deleteResource}>
              <DeleteResourceButton resource={resource?.name || "this resource"} />
            </form>
          ) : <div />}
          
          <button 
            type="submit" 
            form="resourceForm"
            className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
          >
            <Save size={16} /> Save Resource
          </button>
        </div>
      </div>
    </div>
  );
}
