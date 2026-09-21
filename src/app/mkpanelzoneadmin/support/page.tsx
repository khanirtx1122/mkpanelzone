import { getSettings } from "@/lib/settings";
import { Save, LifeBuoy } from "lucide-react";
import { saveSettings } from "../actions";

export default async function SupportSettingsPage() {
  const settings = await getSettings([
    "support_discord_link",
    "support_telegram_link",
    "support_email",
    "support_faq_text",
  ]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Support & Contact</h1>
        <p className="text-sm text-brand-ink-3 mt-1 font-mono">Manage support channels and FAQ content.</p>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={saveSettings as any} className="space-y-8">
          <input type="hidden" name="redirectUrl" value="/mkpanelzoneadmin/support" />
          
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <LifeBuoy className="text-brand-blue-400" size={18} /> Support Channels
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Support Discord</label>
                <input 
                  type="text" 
                  name="setting_support_discord_link" 
                  defaultValue={settings.support_discord_link || ""}
                  placeholder="https://discord.gg/..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Support Telegram</label>
                <input 
                  type="text" 
                  name="setting_support_telegram_link" 
                  defaultValue={settings.support_telegram_link || ""}
                  placeholder="https://t.me/..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">Support Email</label>
                <input 
                  type="email" 
                  name="setting_support_email" 
                  defaultValue={settings.support_email || ""}
                  placeholder="support@example.com"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <LifeBuoy className="text-brand-blue-400" size={18} /> FAQ Content
            </h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">FAQ / Help Text</label>
              <textarea 
                name="setting_support_faq_text" 
                defaultValue={settings.support_faq_text || ""}
                rows={10}
                placeholder="Write your FAQ here..."
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors" 
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-end">
            <button 
              type="submit" 
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-colors"
            >
              <Save size={16} /> Save Support Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
