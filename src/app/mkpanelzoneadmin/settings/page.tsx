import { getSettings } from "@/lib/settings";
import { getHeroCta } from "@/lib/freePanel";
import { getGlobalOffer } from "@/lib/pricing";
import { saveGlobalOffer, saveSettings } from "../actions";
import { Save, Settings2, Sparkles, Tag } from "lucide-react";
import { AdminSubmitButton } from "@/components/admin/AdminButton";

function formatForInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default async function GeneralSettingsPage() {
  const settings = await getSettings([
    "site_name",
    "site_url",
    "site_description",
    "site_keywords",
    "maintenance_mode",
  ]);
  const [heroCta, offer] = await Promise.all([getHeroCta(), getGlobalOffer()]);

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
              The compact chip above the homepage headline. Disabled uses the static Premium Digital Platform badge.
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

          {/* ── GLOBAL OFFER ── */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Tag className="text-green-400" size={18} /> Global Offer (All Products)
            </h2>
            <p className="text-xs text-brand-ink-3 font-mono">
              Applies a site-wide discount to every product. A product with its own active sale is
              never double-discounted — its sale price wins.
            </p>
            <form action={saveGlobalOffer} className="space-y-5">
              <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center gap-2 text-sm text-white font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={offer.enabled}
                    className="w-4 h-4 accent-green-500 bg-black/50 border-white/10"
                  />
                  Enabled
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Offer Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={offer.title}
                    placeholder="ALL PRODUCTS 50% OFF — TODAY ONLY"
                    maxLength={120}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Discount %</label>
                  <input
                    type="number"
                    name="discountPercent"
                    min={1}
                    max={95}
                    defaultValue={offer.discountPercent || ""}
                    placeholder="50"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Starts (optional)</label>
                  <input
                    type="datetime-local"
                    name="startsAt"
                    defaultValue={formatForInput(offer.startsAt)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Ends (optional)</label>
                  <input
                    type="datetime-local"
                    name="endsAt"
                    defaultValue={formatForInput(offer.endsAt)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Message (optional)</label>
                  <input
                    type="text"
                    name="message"
                    defaultValue={offer.message}
                    maxLength={300}
                    placeholder="Limited-time offer — order now!"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <AdminSubmitButton label="Save Global Offer" pendingLabel="Saving…" successLabel="Saved ✓">
                  <Save size={16} />
                </AdminSubmitButton>
              </div>
            </form>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-end">
            <AdminSubmitButton label="Save Settings" pendingLabel="Saving…" successLabel="Saved ✓">
              <Save size={16} />
            </AdminSubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
