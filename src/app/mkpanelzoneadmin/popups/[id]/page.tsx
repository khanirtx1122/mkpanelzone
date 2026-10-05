import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { AdminImageUploader } from "@/components/ui/AdminImageUploader";

export default async function EditPopupPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isNew = params.id === "new";

  let popup = null;
  if (!isNew) {
    popup = await prisma.popup.findUnique({
      where: { id: params.id }
    });
    if (!popup) return notFound();
  }

  async function savePopup(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const buttonLink = formData.get("buttonLink") as string;
    const buttonText = formData.get("buttonText") as string;
    const frequency = formData.get("frequency") as string;
    const scope = formData.get("scope") as string;
    const active = formData.get("active") === "on";
    const startDateRaw = formData.get("startDate") as string;
    const endDateRaw = formData.get("endDate") as string;

    const startDate = startDateRaw ? new Date(startDateRaw) : null;
    const endDate = endDateRaw ? new Date(endDateRaw) : null;

    try {
      if (isNew) {
        await prisma.popup.create({
          data: { title, message, imageUrl, buttonLink, buttonText, frequency, scope, active, startDate, endDate }
        });
      } else {
        await prisma.popup.update({
          where: { id: params.id },
          data: { title, message, imageUrl, buttonLink, buttonText, frequency, scope, active, startDate, endDate }
        });
      }
      revalidatePath("/mkpanelzoneadmin/popups");
      revalidatePath("/");
      redirect("/mkpanelzoneadmin/popups");
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/popups?error=failed");
    }
  }

  async function deletePopup() {
    "use server";
    if (isNew) return;
    try {
      await prisma.popup.delete({ where: { id: params.id } });
      revalidatePath("/mkpanelzoneadmin/popups");
      revalidatePath("/");
      redirect("/mkpanelzoneadmin/popups");
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/popups?error=failed");
    }
  }

  // Format dates for datetime-local input
  const formatForInput = (date: Date | null | undefined) => {
    if (!date) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/mkpanelzoneadmin/popups" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-brand-ink-3 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
            {isNew ? "Create Popup" : "Edit Popup"}
          </h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">
            Configure popup content, frequency, and audience.
          </p>
        </div>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={savePopup} className="space-y-6" id="popupForm">
          
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Title *</label>
            <input 
              type="text" 
              name="title" 
              defaultValue={popup?.title || ""}
              required
              placeholder="e.g. Flash Sale Live Now!"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Description (Optional)</label>
            <textarea 
              name="message" 
              defaultValue={popup?.message || ""}
              rows={3}
              placeholder="More details..."
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Popup Image (Optional)</label>
            {/* We use a hidden input that AdminImageUploader controls so the form gets the value */}
            <AdminImageUploader 
              name="imageUrl"
              defaultValue={popup?.imageUrl || ""}
              bucket="media"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Button Link (Optional)</label>
              <input 
                type="text" 
                name="buttonLink" 
                defaultValue={popup?.buttonLink || ""}
                placeholder="https://..."
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Button Text</label>
              <input 
                type="text" 
                name="buttonText" 
                defaultValue={popup?.buttonText || "Learn More"}
                placeholder="Learn More"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Show Frequency</label>
              <select 
                name="frequency" 
                defaultValue={popup?.frequency || "ONCE_PER_SESSION"}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              >
                <option value="ALWAYS">Always Show</option>
                <option value="ONCE_PER_SESSION">Once Per Session</option>
                <option value="ONCE_PER_DAY">Once Per Day</option>
                <option value="ONCE_EVER">Once Ever</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Target Audience (Scope)</label>
              <select 
                name="scope" 
                defaultValue={popup?.scope || "ALL"}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              >
                <option value="ALL">Everyone</option>
                <option value="MEMBERS">Logged-in Customers Only</option>
                <option value="GUESTS">Logged-out Guests Only</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Status</label>
              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  name="active"
                  id="active"
                  defaultChecked={isNew ? true : popup?.active}
                  className="w-4 h-4 accent-brand-blue-500 bg-black/50 border-white/10" 
                />
                <label htmlFor="active" className="text-sm text-white font-bold">Active</label>
              </div>
            </div>

            <div className="col-span-1 hidden md:block"></div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Start Date (Optional)</label>
              <input 
                type="datetime-local" 
                name="startDate" 
                defaultValue={formatForInput(popup?.startDate)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">End Date (Optional)</label>
              <input 
                type="datetime-local" 
                name="endDate" 
                defaultValue={formatForInput(popup?.endDate)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>
          </div>
        </form>

        <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
          {!isNew ? (
            <form action={deletePopup}>
              <button 
                type="submit" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
              >
                <Trash2 size={16} /> Delete
              </button>
            </form>
          ) : <div />}
          
          <button 
            type="submit" 
            form="popupForm"
            className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
          >
            <Save size={16} /> Save Popup
          </button>
        </div>
      </div>
    </div>
  );
}
