import { getSettings } from "@/lib/settings";
import { getHeroCta } from "@/lib/freePanel";
import { Save, Settings2, Sparkles } from "lucide-react";
import { saveSettings } from "../actions";

export default async function GeneralSettingsPage() {
  const settings = await getSettings([
    "site_name",
    "site_url",
    "site_description",
    "site_keywords",
    "maintenance_mode",
  ]);
  const heroCta = await getHeroCta();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">General Settings</h1>
        <p className="text-sm text-brand-ink-3 mt-1 font-mono">Global site configuration and SEO.</p>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={saveSettings as any} className="space-y-8">
          <input type="hidden" name="redirectUrl" value="/mkpanelzoneadmin/settings" />
          
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings2 className="text-brand-blue-400" size={18} /> Basic Information
              </h2>
              <div className="flex items-center gap-2">
                <select 
                  name="setting_maintenance_mode"
                  defaultValue={settings.maintenance_mode || "false"}
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-brand-blue-500/50 uppercase font-bold tracking-widest"
                >
                  <option value="false">Site Live</option>
                  <option value="true">Maintenance Mode</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Site Name</label>
                <input 
                  type="text" 
                  name="setting_site_name" 
                  defaultValue={settings.site_name || "MK PANEL ZONE"}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Site URL</label>
                <input 
                  type="url" 
                  name="setting_site_url" 
                  defaultValue={settings.site_url || ""}
                  placeholder="https://mkpanel.zone"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">SEO Description</label>
                <textarea 
                  name="setting_site_description" 
                  defaultValue={settings.site_description || ""}
                  rows={3}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">SEO Keywords (Comma separated)</label>
                <input 
                  type="text" 
                  name="setting_site_keywords" 
                  defaultValue={settings.site_keywords || ""}
                  placeholder="fivem, scripts, esx, qbcore"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
                />
              </div>
            </div>
          </div>

          {/* ── HERO TOP CTA ── */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Sparkles className="text-brand-blue-400" size={18} /> Hero Top CTA
            </h2>
            <p className="text-xs text-brand-ink-3 font-mono">
              The compact chip above the homepage headline. Disabled = static "Premium Digital Platform" badge.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">CTA Text</label>
                <input
                  type="text"
                  name="hero_cta_text"
                  defaultValue={heroCta.text}
                  placeholder="FREE PANEL"
                  maxLength={40}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">CTA Link</label>
                <input
                  type="text"
                  name="hero_cta_link"
                  defaultValue={heroCta.link}
                  placeholder="/products or https://..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 font-mono"
                />
              </div>
              <div className="flex items-center gap-6 md:col-span-2">
                <label className="flex items-center gap-2 text-sm text-white font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    name="hero_cta_enabled"
                    defaultChecked={heroCta.enabled}
                    className="w-4 h-4 accent-brand-blue-500 bg-black/50 border-white/10"
                  />
                  Enabled
                </label>
                <label className="flex items-center gap-2 text-sm text-white font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    name="hero_cta_new_tab"
                    defaultChecked={heroCta.newTab}
                    className="w-4 h-4 accent-brand-blue-500 bg-black/50 border-white/10"
                  />
                  Open in new tab
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-end">
            <button 
              type="submit" 
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
            >
              <Save size={16} /> Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
