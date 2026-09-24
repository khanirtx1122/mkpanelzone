import { getSettings } from "@/lib/settings";
import { PanelBottom, Share2, Type } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsFormShell } from "@/components/admin/SettingsFormShell";
import {
  SettingsGroup,
  SettingsGrid,
  SettingsField,
} from "@/components/admin/SettingsField";

export const metadata = {
  title: "Footer | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function FooterSettingsPage() {
  const settings = await getSettings([
    "footer_copyright",
    "footer_description",
    "footer_social_discord",
    "footer_social_youtube",
  ]);

  return (
    <div className="mx-auto max-w-[880px]">
      <PageHeader
        eyebrow="Configuration"
        title="Footer Configuration"
        description="Footer copy and the external channels linked from the public site footer."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Footer" }]}
      />

      <SettingsFormShell redirectUrl="/mkpanelzoneadmin/footer">
        <SettingsGroup
          icon={<Type size={16} />}
          title="Footer copy"
          description="Rendered in the public footer. Private routes are never linked from there."
        >
          <SettingsGrid>
            <SettingsField
              label="Brand description"
              name="setting_footer_description"
              variant="textarea"
              rows={4}
              defaultValue={settings.footer_description || ""}
              placeholder="One or two sentences about what the platform offers."
              full
              hint="Leave empty to use the built-in description."
            />
            <SettingsField
              label="Copyright line"
              name="setting_footer_copyright"
              defaultValue={settings.footer_copyright || ""}
              placeholder="© 2026 MK PANEL ZONE. All rights reserved."
              full
              hint="Leave empty to auto-generate with the current year."
            />
          </SettingsGrid>
        </SettingsGroup>

        <SettingsGroup
          icon={<Share2 size={16} />}
          title="External channels"
          description="Each link appears in a “Connect” column in the footer. Empty fields are hidden entirely."
        >
          <SettingsGrid>
            <SettingsField
              label="Discord invite"
              name="setting_footer_social_discord"
              defaultValue={settings.footer_social_discord || ""}
              placeholder="https://discord.gg/..."
              mono
            />
            <SettingsField
              label="YouTube channel"
              name="setting_footer_social_youtube"
              defaultValue={settings.footer_social_youtube || ""}
              placeholder="https://youtube.com/@..."
              mono
            />
          </SettingsGrid>

          <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-brand-ink-4">
            <PanelBottom size={12} className="mt-[2px] shrink-0" aria-hidden />
            External links open in a new tab with a safe referrer policy. Contact email
            is configured under Content → Contact channels.
          </p>
        </SettingsGroup>
      </SettingsFormShell>
    </div>
  );
}
