import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { listAllPlatforms, findPlatformByCode } from "@/lib/platforms";

export default async function EditPackagePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isNew = params.id === "new";

  const platforms = await listAllPlatforms();

  let pkg = null;
  if (!isNew) {
    pkg = await prisma.package.findUnique({
      where: { id: params.id }
    });
    if (!pkg) return notFound();
  }

  async function savePackage(formData: FormData) {
    "use server";
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const platformType = formData.get("platformType") as string;
    const isDefaultForAgents = formData.get("isDefaultForAgents") === "true";

    try {
      /* Platform comes from a client <select> — validated server-side so a
         package can only ever be attached to a real, owner-managed platform. */
      const platformRecord = await findPlatformByCode(platformType);
      if (!platformRecord) {
        throw new Error("Invalid platform selected");
      }

      if (isDefaultForAgents) {
        // Unset any existing default for this platform
        await prisma.package.updateMany({
          where: { platformType, isDefaultForAgents: true },
          data: { isDefaultForAgents: false }
        });
      }

      if (isNew) {
        await prisma.package.create({
          data: { name, description, platformType, isDefaultForAgents }
        });
      } else {
        await prisma.package.update({
          where: { id: params.id },
          data: { name, description, platformType, isDefaultForAgents }
        });
      }
      revalidatePath("/mkpanelzoneadmin/packages");
      redirect("/mkpanelzoneadmin/packages");
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/packages?error=failed");
    }
  }

  async function deletePackage() {
    "use server";
    if (isNew) return;
    try {
      await prisma.package.delete({ where: { id: params.id } });
      revalidatePath("/mkpanelzoneadmin/packages");
      redirect("/mkpanelzoneadmin/packages");
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/packages?error=failed");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/mkpanelzoneadmin/packages" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-brand-ink-3 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
            {isNew ? "Add Package" : "Edit Package"}
          </h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">
            Define customer access tiers.
          </p>
        </div>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={savePackage} className="space-y-6" id="packageForm">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Package Name</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={pkg?.name || ""}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Platform</label>
                <select
                  name="platformType"
                  defaultValue={pkg?.platformType || platforms[0]?.code || ""}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
                >
                  {platforms.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}{!p.isEnabled ? " (disabled)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Description</label>
              <textarea 
                name="description" 
                defaultValue={pkg?.description || ""}
                rows={4}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
              />
            </div>
            
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                name="isDefaultForAgents"
                id="isDefaultForAgents"
                value="true"
                defaultChecked={pkg?.isDefaultForAgents || false}
                className="w-4 h-4 bg-black/50 border-white/10 rounded text-brand-blue-500 focus:ring-brand-blue-500/50 focus:ring-offset-0 focus:ring-offset-transparent"
              />
              <label htmlFor="isDefaultForAgents" className="text-sm font-bold text-white tracking-wide">
                Set as Default Package for Agents
              </label>
            </div>
          </div>
        </form>

        <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
          {!isNew ? (
            <form action={deletePackage}>
              <button 
                type="submit" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
              >
                <Trash2 size={16} /> Delete Package
              </button>
            </form>
          ) : <div />}
          
          <button 
            type="submit" 
            form="packageForm"
            className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
          >
            <Save size={16} /> Save Package
          </button>
        </div>
      </div>
    </div>
  );
}
