import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SubmitResourceButton } from "../SubmitResourceButton";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { DeleteResourceButton } from "../DeleteResourceButton";
import { listAllPlatforms, findPlatformByCode } from "@/lib/platforms";
import { requireOwner } from "@/lib/owner";

export default async function EditResourcePage(props: { 
  params: Promise<{ id: string }>,
  searchParams?: Promise<{ packageId?: string, platform?: string, branchId?: string, returnTo?: string, error?: string }>
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

  const [packages, allBranches, platforms] = await Promise.all([
    prisma.package.findMany({
      where: platformFilter ? { platformType: platformFilter } : {},
      orderBy: { name: "asc" }
    }),
    prisma.platformBranch.findMany({
      orderBy: [{ platformType: "asc" }, { sortOrder: "asc" }],
    }),
    listAllPlatforms(),
  ]);

  /* Packages grouped by platform for the <optgroup> picker — derived from the
     platform table so a new platform appears without a source change. */
  const packagesByPlatform = new Map<string, typeof packages>();
  for (const pkg of packages) {
    const list = packagesByPlatform.get(pkg.platformType) ?? [];
    list.push(pkg);
    packagesByPlatform.set(pkg.platformType, list);
  }

  const platformLabel = (code: string) =>
    platforms.find((p) => p.code === code)?.name ?? code;

  async function saveResource(formData: FormData) {
    "use server";
    if (!(await requireOwner())) redirect("/");

    const name = ((formData.get("name") as string) || "").trim();
    const type = ((formData.get("type") as string) || "LINK").toUpperCase();
    const rawPackageId = formData.get("packageId") as string;
    const packageId = rawPackageId === "" ? null : rawPackageId;
    const platformType = ((formData.get("platformType") as string) || "").toUpperCase();
    const rawBranchId = formData.get("branchId") as string;
    const branchId = rawBranchId === "" ? null : rawBranchId;
    const rawUrl = ((formData.get("url") as string) || "").trim();
    const url = rawUrl || null;
    const secret = ((formData.get("secret") as string) || "").trim() || null;
    const bodyText = ((formData.get("bodyText") as string) || "").trim() || null;
    const ACCENTS = ["DEFAULT", "INFO", "WARNING", "SUCCESS", "HIGHLIGHT"];
    const rawAccent = ((formData.get("accentStyle") as string) || "DEFAULT").toUpperCase();
    const accentStyle = ACCENTS.includes(rawAccent) ? rawAccent : "DEFAULT";
    const description = ((formData.get("description") as string) || "").trim() || null;
    const sortOrderRaw = (formData.get("sortOrder") as string) || "";
    const sortOrder = Number.isFinite(parseInt(sortOrderRaw, 10)) ? parseInt(sortOrderRaw, 10) : 0;
    const status = formData.get("status") as string;

    if (!name) {
      redirect(`${backHref}?error=name`);
    }

    /* URL safety: only http(s) or an internal path may be stored, so a resource
       can never become a javascript:/data: payload for the customer. */
    if (url && !/^https?:\/\//i.test(url) && !url.startsWith("/")) {
      redirect(`${backHref}?error=url`);
    }

    try {
      /* The platform code arrives from a client <select>, so it is validated
         against the owner-managed table before anything is persisted. */
      const platformRecord = await findPlatformByCode(platformType);
      if (!platformRecord) {
        throw new Error("Invalid platform selected");
      }

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

      const payload = {
        name, type, packageId, platformType, branchId, url, secret, status,
        bodyText, accentStyle, description, sortOrder,
      };

      if (isNew) {
        await prisma.packageResource.create({ data: payload });
      } else {
        await prisma.packageResource.update({ where: { id: params.id }, data: payload });
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
    if (!(await requireOwner())) redirect("/");
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
            Provide URLs, text, media or secrets for this branch.
          </p>
        </div>
      </div>

      {searchParams?.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold">
          {searchParams.error === "url"
            ? "That URL is not allowed. Use a full https:// link or an internal /path."
            : searchParams.error === "name"
              ? "A resource name is required."
              : "Saving failed. Please try again."}
        </div>
      )}

      {/* Where this resource will live — the platform/branch context is
          inherited from the screen you came from, so it never has to be
          re-selected, but it stays visible and changeable. */}
      {(platformFilter || searchParams?.branchId) && isNew && (
        <div className="p-4 bg-brand-blue-500/5 border border-brand-blue-500/20 rounded-xl text-xs font-bold uppercase tracking-wider text-brand-blue-400">
          Adding to: {platformFilter || "—"}
          {searchParams?.branchId ? ` · branch preselected` : ""}
        </div>
      )}

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={saveResource} className="space-y-6" id="resourceForm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Platform Type</label>
              <select 
                name="platformType"
                defaultValue={resource?.platformType || platformFilter || platforms[0]?.code || ""}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
                required
              >
                {platforms.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
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
                {platforms.map((p) => {
                  const list = packagesByPlatform.get(p.code);
                  if (!list || list.length === 0) return null;
                  return (
                    <optgroup key={p.code} label={`${p.name.toUpperCase()} PACKAGES`}>
                      {list.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                      ))}
                    </optgroup>
                  );
                })}
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
                        {platformLabel(branch.platformType)} — {branch.name}
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
                <option value="FILE">File — download</option>
                <option value="LINK">Link / URL</option>
                <option value="TEXT">Text — instructions block</option>
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
                <option value="TUTORIAL">Tutorial / guide</option>
                <option value="SECRET">Secret key / password</option>
                <option value="NOTE">Note (plain text)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Presentation Accent</label>
              <select
                name="accentStyle"
                defaultValue={resource?.accentStyle || "DEFAULT"}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              >
                <option value="DEFAULT">Default</option>
                <option value="INFO">Information (blue)</option>
                <option value="WARNING">Important (amber)</option>
                <option value="SUCCESS">Success (green)</option>
                <option value="HIGHLIGHT">Highlighted (red)</option>
              </select>
              <p className="text-[10px] text-brand-ink-3 mt-1">
                Used by Text, Note and Tutorial resources to make an important message stand out.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Display Order</label>
              <input
                type="number"
                name="sortOrder"
                defaultValue={resource?.sortOrder ?? 0}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              />
              <p className="text-[10px] text-brand-ink-3 mt-1">Lower numbers appear first for the customer.</p>
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
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Description (Optional)</label>
              <input
                type="text"
                name="description"
                defaultValue={resource?.description || ""}
                placeholder="Short line shown under the title"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">
                Text Content (Text / Tutorial resources)
              </label>
              <textarea 
                name="bodyText" 
                defaultValue={resource?.bodyText || ""}
                rows={5}
                placeholder="Shown to the customer as a professionally formatted block. Plain text only."
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
              <p className="text-[10px] text-brand-ink-3 mt-1">
                Rendered as formatted text inside a resource card — HTML and scripts are never executed.
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Secret Value / Password (Optional)</label>
              <textarea 
                name="secret" 
                defaultValue={resource?.secret || ""}
                rows={3}
                placeholder="Enter license key, password, or credentials..."
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
          
          <SubmitResourceButton />
        </div>
      </div>
    </div>
  );
}
