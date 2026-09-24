import { getSettings } from "@/lib/settings";
import { FileText, Link2, Mail, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsFormShell } from "@/components/admin/SettingsFormShell";
import {
  SettingsGroup,
  SettingsGrid,
  SettingsField,
} from "@/components/admin/SettingsField";

export const metadata = {
  title: "Content | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function ContentSettingsPage() {
  const settings = await getSettings([
    "content_homepage_title",
    "content_homepage_subtitle",
    "content_about_us",
    "content_contact_email",
    "content_discord_link",
  ]);

  return (
    <div className="mx-auto max-w-[880px]">
      <PageHeader
        eyebrow="Configuration"
        title="Content Management"
        description="Storefront copy and the contact channels customers are pointed to."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Content" }]}
      />

      <SettingsFormShell redirectUrl="/mkpanelzoneadmin/content">
        <SettingsGroup
          icon={<FileText size={16} />}
          title="Homepage copy"
          description="The headline block at the top of the storefront."
        >
          <SettingsGrid>
            <SettingsField
              label="Hero title"
              name="setting_content_homepage_title"
              defaultValue={settings.content_homepage_title || ""}
              placeholder="Welcome to MK PANEL ZONE"
              full
            />
            <SettingsField
              label="Hero subtitle"
              name="setting_content_homepage_subtitle"
              defaultValue={settings.content_homepage_subtitle || ""}
              placeholder="The best place for premium scripts."
              full
              hint="Keep this to a single sentence — it renders directly under the headline."
            />
          </SettingsGrid>
        </SettingsGroup>

        <SettingsGroup
          icon={<MessageSquare size={16} />}
          title="About"
          description="Longer-form description used on the about surface."
        >
          <SettingsField
            label="About text"
            name="setting_content_about_us"
            variant="textarea"
            rows={6}
            defaultValue={settings.content_about_us || ""}
            placeholder="Describe what the platform offers and who it is for."
            full
          />
        </SettingsGroup>

        <SettingsGroup
          icon={<Mail size={16} />}
          title="Contact channels"
          description="Where customers are sent when they need help with an order."
        >
          <SettingsGrid>
            <SettingsField
              label="Contact email"
              name="setting_content_contact_email"
              type="email"
              defaultValue={settings.content_contact_email || ""}
              placeholder="support@example.com"
              mono
            />
            <SettingsField
              label="Discord invite"
              name="setting_content_discord_link"
              type="url"
              defaultValue={settings.content_discord_link || ""}
              placeholder="https://discord.gg/..."
              mono
              hint="Must be a full URL including https://"
            />
          </SettingsGrid>

          <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-brand-ink-4">
            <Link2 size={12} className="mt-[2px] shrink-0" aria-hidden />
            These values are stored globally. Changing them updates every place the
            contact details are shown.
          </p>
        </SettingsGroup>
      </SettingsFormShell>
    </div>
  );
}
