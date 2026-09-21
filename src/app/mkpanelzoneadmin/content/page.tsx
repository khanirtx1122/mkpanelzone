import { getSettings } from "@/lib/settings";
import { Save, FileText } from "lucide-react";
import { saveSettings } from "../actions";

export default async function ContentSettingsPage() {
  const settings = await getSettings([
    "content_homepage_title",
    "content_homepage_subtitle",
    "content_about_us",
    "content_contact_email",
    "content_discord_link",
  ]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Content Management</h1>
        <p className="text-sm text-brand-ink-3 mt-1 font-mono">Manage global text, titles, and links.</p>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={saveSettings as any} className="space-y-8">
          <input type="hidden" name="redirectUrl" value="/mkpanelzoneadmin/content" />
          
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <FileText className="text-brand-blue-400" size={18} /> Homepage Content
            </h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Hero Title</label>
              <input 
                type="text" 
                name="setting_content_homepage_title" 
                defaultValue={settings.content_homepage_title || ""}
                placeholder="Welcome to MK PANEL ZONE"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Hero Subtitle</label>
              <input 
                type="text" 
                name="setting_content_homepage_subtitle" 
                defaultValue={settings.content_homepage_subtitle || ""}
                placeholder="The best place for premium scripts."
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <FileText className="text-brand-blue-400" size={18} /> General Information
            </h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">About Us Text</label>
              <textarea 
                name="setting_content_about_us" 
                defaultValue={settings.content_about_us || ""}
                rows={5}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Contact Email</label>
                <input 
                  type="email" 
                  name="setting_content_contact_email" 
                  defaultValue={settings.content_contact_email || ""}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Discord Link</label>
                <input 
                  type="url" 
                  name="setting_content_discord_link" 
                  defaultValue={settings.content_discord_link || ""}
                  placeholder="https://discord.gg/..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-end">
            <button 
              type="submit" 
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
            >
              <Save size={16} /> Save Content Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
