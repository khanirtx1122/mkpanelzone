import { getSettings } from "@/lib/settings";
import { Save, LifeBuoy, MessageCircle } from "lucide-react";
import { saveSettings } from "../actions";
import { AdminSubmitButton } from "@/components/admin/AdminButton";

export default async function SupportSettingsPage() {
  const settings = await getSettings([
    "support_whatsapp_number",
    "support_whatsapp_message",
    "support_whatsapp_label",
    "support_faq_text",
  ]);

  const faqLines = (settings.support_faq_text || "").split(/\r?\n/).filter(Boolean);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Support & Contact</h1>
        <p className="text-sm text-brand-ink-3 mt-1 font-mono">
          WhatsApp is the single support channel across the whole site.
        </p>
      </div>

      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden shadow-2xl p-6">
        <form action={saveSettings as any} className="space-y-8">
          <input type="hidden" name="redirectUrl" value="/mkpanelzoneadmin/support" />

          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <MessageCircle className="text-green-400" size={18} /> WhatsApp Support
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  name="setting_support_whatsapp_number"
                  defaultValue={settings.support_whatsapp_number || ""}
                  placeholder="923001234567"
                  inputMode="tel"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors font-mono"
                />
                <p className="text-[11px] text-brand-ink-3 font-mono leading-relaxed">
                  Full international format, digits only — no <span className="text-white">+</span>, spaces or dashes.
                  Example: <span className="text-white">923001234567</span> (Pakistan).
                  This number powers every “Chat on WhatsApp” button on the public site.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">
                  Button Label
                </label>
                <input
                  type="text"
                  name="setting_support_whatsapp_label"
                  defaultValue={settings.support_whatsapp_label || "Chat on WhatsApp"}
                  maxLength={40}
                  placeholder="Chat on WhatsApp"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
                />
                <p className="text-[11px] text-brand-ink-3 font-mono leading-relaxed">
                  Shown on the Support page and footer button.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">
                  Pre-filled Message (optional)
                </label>
                <textarea
                  name="setting_support_whatsapp_message"
                  defaultValue={settings.support_whatsapp_message || ""}
                  rows={3}
                  placeholder="Hi MK Panel Zone, I need help with..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
                />
                <p className="text-[11px] text-brand-ink-3 font-mono leading-relaxed">
                  Text that appears ready to send when a customer opens the chat.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <LifeBuoy className="text-brand-blue-400" size={18} /> Support Page Content
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">
                Extra Help Text / FAQ (optional)
              </label>
              <textarea
                name="setting_support_faq_text"
                defaultValue={settings.support_faq_text || ""}
                rows={8}
                placeholder={"One point per line, e.g.\nPayments are verified within 24 hours.\nKeep your order ID handy when you message us."}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors"
              />
              <p className="text-[11px] text-brand-ink-3 font-mono leading-relaxed">
                Each line becomes its own bullet on the support page.{" "}
                {faqLines.length > 0 && (
                  <span className="text-white">{faqLines.length} line{faqLines.length === 1 ? "" : "s"} will be shown.</span>
                )}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-end">
            <AdminSubmitButton label="Save Support Settings" pendingLabel="Saving…" successLabel="Saved ✓">
              <Save size={16} />
            </AdminSubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
