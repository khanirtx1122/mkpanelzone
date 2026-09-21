import { getSettings } from "@/lib/settings";
import { Save, Palette } from "lucide-react";
import { saveSettings } from "../actions";

export default async function DesignSettingsPage() {
  const settings = await getSettings([
    "design_primary_color",
    "design_bg_color",
    "design_logo_url",
  ]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Design & Branding</h1>
        <p className="text-sm text-brand-ink-3 mt-1 font-mono">Manage colors and logos.</p>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={saveSettings as any} className="space-y-8">
          <input type="hidden" name="redirectUrl" value="/mkpanelzoneadmin/design" />
          
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Palette className="text-brand-blue-400" size={18} /> Global Theme
            </h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Logo URL</label>
              <input 
                type="text" 
                name="setting_design_logo_url" 
                defaultValue={settings.design_logo_url || ""}
                placeholder="https://example.com/logo.png"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Primary Color (Hex)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    name="setting_design_primary_color" 
                    defaultValue={settings.design_primary_color || "#2463EB"}
                    className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer" 
                  />
                  <input 
                    type="text" 
                    defaultValue={settings.design_primary_color || "#2463EB"}
                    disabled
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white font-mono opacity-50" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Background Color (Hex)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    name="setting_design_bg_color" 
                    defaultValue={settings.design_bg_color || "#06080D"}
                    className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer" 
                  />
                  <input 
                    type="text" 
                    defaultValue={settings.design_bg_color || "#06080D"}
                    disabled
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white font-mono opacity-50" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-end">
            <button 
              type="submit" 
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
            >
              <Save size={16} /> Save Design Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
