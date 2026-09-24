import { getSettings } from "@/lib/settings";
import { Palette, ImageIcon, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsFormShell } from "@/components/admin/SettingsFormShell";
import { SettingsGroup, SettingsField } from "@/components/admin/SettingsField";
import { ColorField } from "@/components/admin/ColorField";

export const metadata = {
  title: "Design | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function DesignSettingsPage() {
  const settings = await getSettings([
    "design_primary_color",
    "design_bg_color",
    "design_logo_url",
  ]);

  return (
    <div className="mx-auto max-w-[880px]">
      <PageHeader
        eyebrow="Configuration"
        title="Design & Branding"
        description="Brand mark and reserved palette overrides."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Design" }]}
      />

      <SettingsFormShell redirectUrl="/mkpanelzoneadmin/design">
        <SettingsGroup
          icon={<ImageIcon size={16} />}
          title="Brand mark"
          description="Replaces the MK monogram in the navigation bar across the public site."
        >
          <SettingsField
            label="Logo URL"
            name="setting_design_logo_url"
            defaultValue={settings.design_logo_url || ""}
            placeholder="https://example.com/logo.png"
            mono
            hint="Square or near-square images work best — it is rendered in a 30×30 tile. Leave empty to use the built-in monogram."
          />
        </SettingsGroup>

        <SettingsGroup
          icon={<Palette size={16} />}
          title="Palette overrides"
          description="Stored values for future theming. These are not applied to the live site today."
        >
          {/* Honest labelling: these keys persist but nothing reads them. */}
          <div
            className="mb-5 flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 text-[12px] leading-relaxed"
            style={{
              background: "var(--status-info-bg)",
              borderColor: "var(--status-info-border)",
              color: "var(--status-info-text)",
            }}
          >
            <Info size={14} className="mt-[2px] shrink-0" aria-hidden />
            <span>
              The site palette is currently defined in the design system, not in the
              database. Saving these values stores them safely, but the live site will
              not change colour until theme overrides are wired up.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ColorField
              label="Primary colour"
              name="setting_design_primary_color"
              defaultValue={settings.design_primary_color || "#2457C5"}
              warning="Not applied to the live site."
            />
            <ColorField
              label="Background colour"
              name="setting_design_bg_color"
              defaultValue={settings.design_bg_color || "#070A0F"}
              warning="Not applied to the live site."
            />
          </div>
        </SettingsGroup>
      </SettingsFormShell>
    </div>
  );
}
