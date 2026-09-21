import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function EditAnnouncementPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isNew = params.id === "new";

  let announcement = null;
  if (!isNew) {
    announcement = await prisma.announcement.findUnique({
      where: { id: params.id }
    });
    if (!announcement) return notFound();
  }

  async function saveAnnouncement(formData: FormData) {
    "use server";
    
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const link = formData.get("link") as string;
    const type = formData.get("type") as string;
    const scope = formData.get("scope") as string;
    const active = formData.get("active") === "on";
    const startDateRaw = formData.get("startDate") as string;
    const endDateRaw = formData.get("endDate") as string;

    const startDate = startDateRaw ? new Date(startDateRaw) : null;
    const endDate = endDateRaw ? new Date(endDateRaw) : null;

    try {
      if (isNew) {
        await prisma.announcement.create({
          data: { title, message, link, type, scope, active, startDate, endDate }
        });
      } else {
        await prisma.announcement.update({
          where: { id: params.id },
          data: { title, message, link, type, scope, active, startDate, endDate }
        });
      }
      revalidatePath("/mkpanelzoneadmin/announcements");
      // Optionally revalidate public routes where announcements are shown
      revalidatePath("/");
      redirect("/mkpanelzoneadmin/announcements");
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/announcements?error=failed");
    }
  }

  async function deleteAnnouncement() {
    "use server";
    if (isNew) return;
    try {
      await prisma.announcement.delete({ where: { id: params.id } });
      revalidatePath("/mkpanelzoneadmin/announcements");
      revalidatePath("/");
      redirect("/mkpanelzoneadmin/announcements");
    } catch (error) {
      console.error(error);
      redirect("/mkpanelzoneadmin/announcements?error=failed");
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
        <Link href="/mkpanelzoneadmin/announcements" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-brand-ink-3 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
            {isNew ? "Create Announcement" : "Edit Announcement"}
          </h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">
            Configure announcement text, scheduling, and targeting.
          </p>
        </div>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={saveAnnouncement} className="space-y-6" id="announcementForm">
          
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Internal Title (Optional)</label>
            <input 
              type="text" 
              name="title" 
              defaultValue={announcement?.title || ""}
              placeholder="e.g. Summer Sale 2026"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Announcement Message *</label>
            <textarea 
              name="message" 
              defaultValue={announcement?.message || ""}
              required
              rows={3}
              placeholder="Message shown to visitors..."
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Click Link (Optional)</label>
              <input 
                type="text" 
                name="link" 
                defaultValue={announcement?.link || ""}
                placeholder="https://..."
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Style / Type</label>
              <select 
                name="type" 
                defaultValue={announcement?.type || "INFO"}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              >
                <option value="INFO">Info (Blue)</option>
                <option value="WARNING">Warning (Orange)</option>
                <option value="SUCCESS">Success (Green)</option>
                <option value="ALERT">Alert (Red)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Target Audience (Scope)</label>
              <select 
                name="scope" 
                defaultValue={announcement?.scope || "ALL"}
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
                  defaultChecked={isNew ? true : announcement?.active}
                  className="w-4 h-4 accent-brand-blue-500 bg-black/50 border-white/10" 
                />
                <label htmlFor="active" className="text-sm text-white font-bold">Active</label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Start Date (Optional)</label>
              <input 
                type="datetime-local" 
                name="startDate" 
                defaultValue={formatForInput(announcement?.startDate)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">End Date (Optional)</label>
              <input 
                type="datetime-local" 
                name="endDate" 
                defaultValue={formatForInput(announcement?.endDate)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>
          </div>
        </form>

        <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
          {!isNew ? (
            <form action={deleteAnnouncement}>
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
            form="announcementForm"
            className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
          >
            <Save size={16} /> Save Announcement
          </button>
        </div>
      </div>
    </div>
  );
}
