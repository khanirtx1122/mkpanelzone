import { getSettings } from "@/lib/settings";
import { Save, PanelBottom } from "lucide-react";
import { saveSettings } from "../actions";
import { AdminSubmitButton } from "@/components/admin/AdminButton";
import { SocialLinksManager } from "./SocialLinksManager";
import type { SocialLink } from "../actions";

function parseSocialLinks(raw: string | undefined): SocialLink[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SocialLink[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l) => l && typeof l.platform === "string" && typeof l.url === "string");
  } catch {
    return [];
  }
}

export default async function FooterSettingsPage() {
  const [settings, socialRaw] = await Promise.all([
    getSettings(["footer_copyright", "footer_description", "footer_social_discord", "footer_social_youtube"]),
    getSettings(["social_links"]),
  ]);
  // Seed the dynamic manager from any legacy per-platform settings so an
  // existing deployment keeps its links after the upgrade.
  const legacy: SocialLink[] = [
    settings.footer_social_discord ? { platform: "discord", url: settings.footer_social_discord, enabled: true } : null,
    settings.footer_social_youtube ? { platform: "youtube", url: settings.footer_social_youtube, enabled: true } : null,
  ].filter((l): l is SocialLink => l !== null);
  const socialLinks = parseSocialLinks(socialRaw.social_links);

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

            <SocialLinksManager initial={socialLinks.length > 0 ? socialLinks : legacy} />
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-end">
            <AdminSubmitButton label="Save Footer Settings" pendingLabel="Saving…" successLabel="Saved ✓">
              <Save size={16} />
            </AdminSubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
