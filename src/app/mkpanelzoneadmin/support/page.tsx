import { getSettings } from "@/lib/settings";
import { LifeBuoy, MessageCircle, Send, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsFormShell } from "@/components/admin/SettingsFormShell";
import {
  SettingsGroup,
  SettingsGrid,
  SettingsField,
} from "@/components/admin/SettingsField";

export const metadata = {
  title: "Support Settings | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function SupportSettingsPage() {
  const settings = await getSettings([
    "support_discord_link",
    "support_telegram_link",
    "support_email",
    "support_faq_text",
  ]);

  const configured = [
    settings.support_discord_link,
    settings.support_telegram_link,
    settings.support_email,
  ].filter((v) => v?.trim()).length;

  return (
    <div className="mx-auto max-w-[880px]">
      <PageHeader
        eyebrow="Configuration"
        title="Support & Contact"
        description="Channels published on the public support page. Only configured channels are rendered — empty ones disappear entirely."
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Support" },
        ]}
      />

      {configured === 0 && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-[14px] px-4 py-3.5 text-[12.5px] leading-relaxed"
          style={{
            background: "var(--status-warning-bg)",
            border: "1px solid var(--status-warning-border)",
            color: "var(--status-warning-text)",
          }}
          role="status"
        >
          <LifeBuoy size={15} className="mt-[2px] shrink-0" aria-hidden />
          <span>
            No support channel is configured. The public support page currently shows an
            empty state instead of contact options — add at least one channel below.
          </span>
        </div>
      )}

      <SettingsFormShell redirectUrl="/mkpanelzoneadmin/support">
        <SettingsGroup
          icon={<MessageCircle size={16} />}
          title="Support channels"
          description="Each field becomes a working link on the support page. Leave a field empty to hide that channel."
        >
          <SettingsGrid>
            <SettingsField
              label="Discord invite"
              name="setting_support_discord_link"
              defaultValue={settings.support_discord_link || ""}
              placeholder="https://discord.gg/..."
              mono
            />
            <SettingsField
              label="Telegram link"
              name="setting_support_telegram_link"
              defaultValue={settings.support_telegram_link || ""}
              placeholder="https://t.me/..."
              mono
            />
            <SettingsField
              label="Support email"
              name="setting_support_email"
              type="email"
              defaultValue={settings.support_email || ""}
              placeholder="support@example.com"
              mono
              full
              hint="Falls back to the contact email under Content if left empty."
            />
          </SettingsGrid>
        </SettingsGroup>

        <SettingsGroup
          icon={<Send size={16} />}
          title="Support notes"
          description="Free-form reference text rendered verbatim on the support page. Line breaks are preserved."
        >
          <SettingsField
            label="Notes / FAQ text"
            name="setting_support_faq_text"
            variant="textarea"
            rows={8}
            defaultValue={settings.support_faq_text || ""}
            placeholder={"Ticket hours: 09:00–23:00 UTC\nTypical first response: under 6 hours"}
            full
            hint="Plain text only. For structured Q&A, edit the questions built into the support page."
          />

          <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-brand-ink-4">
            <Mail size={12} className="mt-[2px] shrink-0" aria-hidden />
            Support staff will never ask a customer for their password. Encourage customers
            to quote their order number instead.
          </p>
        </SettingsGroup>
      </SettingsFormShell>
    </div>
  );
}
