import { getSettings } from "@/lib/settings";
import { Save, PanelBottom } from "lucide-react";
import { saveSettings } from "../actions";

export default async function FooterSettingsPage() {
  const settings = await getSettings([
    "footer_copyright",
    "footer_description",
    "footer_social_discord",
    "footer_social_youtube",
  ]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Footer Configuration</h1>
        <p className="text-sm text-brand-ink-3 mt-1 font-mono">Manage footer links and text.</p>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={saveSettings as any} className="space-y-8">
          <input type="hidden" name="redirectUrl" value="/mkpanelzoneadmin/footer" />
          
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <PanelBottom className="text-brand-blue-400" size={18} /> Footer Text
            </h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Copyright Text</label>
              <input 
                type="text" 
                name="setting_footer_copyright" 
                defaultValue={settings.footer_copyright || "© 2024 MK PANEL ZONE. All rights reserved."}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Footer Description</label>
              <textarea 
                name="setting_footer_description" 
                defaultValue={settings.footer_description || ""}
                rows={3}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <PanelBottom className="text-brand-blue-400" size={18} /> Social Links
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Discord Link</label>
                <input 
                  type="text" 
                  name="setting_footer_social_discord" 
                  defaultValue={settings.footer_social_discord || ""}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">YouTube Link</label>
                <input 
                  type="text" 
                  name="setting_footer_social_youtube" 
                  defaultValue={settings.footer_social_youtube || ""}
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
              <Save size={16} /> Save Footer Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
