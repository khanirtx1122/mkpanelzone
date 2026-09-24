import { getSettings } from "@/lib/settings";
import { Settings2, Search, Wrench, Lock, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsFormShell } from "@/components/admin/SettingsFormShell";
import {
  SettingsGroup,
  SettingsGrid,
  SettingsField,
} from "@/components/admin/SettingsField";

export const metadata = {
  title: "Settings | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function GeneralSettingsPage() {
  const settings = await getSettings([
    "site_name",
    "site_url",
    "site_description",
    "site_keywords",
    "maintenance_mode",
    "enforce_device_binding",
  ]);

  const inMaintenance = settings.maintenance_mode === "true";
  const enforcingDevices = settings.enforce_device_binding === "true";

  return (
    <div className="mx-auto max-w-[880px]">
      <PageHeader
        eyebrow="Configuration"
        title="General Settings"
        description="Core site identity, search-engine metadata and the global availability switch."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Settings" }]}
      />

      <SettingsFormShell redirectUrl="/mkpanelzoneadmin/settings">
        <SettingsGroup
          icon={<Settings2 size={16} />}
          title="Identity"
          description="How the brand identifies itself across the site and in shared links."
        >
          <SettingsGrid>
            <SettingsField
              label="Site name"
              name="setting_site_name"
              defaultValue={settings.site_name || "MK PANEL ZONE"}
              placeholder="MK PANEL ZONE"
            />
            <SettingsField
              label="Site URL"
              name="setting_site_url"
              type="url"
              defaultValue={settings.site_url || ""}
              placeholder="https://mkpanel.zone"
              mono
            />
          </SettingsGrid>
        </SettingsGroup>

        <SettingsGroup
          icon={<Search size={16} />}
          title="Search engine metadata"
          description="Used for the page title and description that search engines and social previews read."
        >
          <SettingsGrid>
            <SettingsField
              label="Meta description"
              name="setting_site_description"
              variant="textarea"
              rows={3}
              defaultValue={settings.site_description || ""}
              placeholder="A short summary of what the site offers."
              full
              hint="Aim for 140–160 characters so it is not truncated in search results."
            />
            <SettingsField
              label="Keywords"
              name="setting_site_keywords"
              defaultValue={settings.site_keywords || ""}
              placeholder="fivem, scripts, esx, qbcore"
              full
              hint="Comma-separated. Modern search engines weight this lightly, but it costs nothing."
            />
          </SettingsGrid>
        </SettingsGroup>

        <SettingsGroup
          icon={<Wrench size={16} />}
          title="Availability"
          description="Enforced by the request proxy. Public storefront routes are rewritten to the maintenance screen; the control room, agent workstation and support page stay reachable."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-foreground">
                {inMaintenance ? "Maintenance mode is ON" : "Site is live"}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-brand-ink-3">
                {inMaintenance
                  ? "Visitors currently see the maintenance screen instead of the storefront. Saving takes effect on the next request."
                  : "Visitors can browse products and place orders normally."}
              </p>
            </div>
            <div className="sm:w-[200px] sm:shrink-0">
              <SettingsField
                label="Status"
                name="setting_maintenance_mode"
                variant="select"
                defaultValue={settings.maintenance_mode || "false"}
                options={[
                  { value: "false", label: "Site live" },
                  { value: "true", label: "Maintenance mode" },
                ]}
              />
            </div>
          </div>
        </SettingsGroup>

        <SettingsGroup
          icon={<Lock size={16} />}
          title="Device binding"
          description="Whether a customer's account may only be used on the device it was first activated on."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-foreground">
                {enforcingDevices ? "Enforcement is ON" : "Enforcement is OFF (default)"}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-brand-ink-3">
                {enforcingDevices
                  ? "A customer signing in from a device other than the one bound to their account is refused, and must contact support to have the binding reset. Existing sessions are unaffected until they expire."
                  : "The first device to sign in is recorded and shown on the customer's page, but any device may sign in. Turn this on to make the one-device policy technically enforced."}
              </p>
            </div>
            <div className="sm:w-[200px] sm:shrink-0">
              <SettingsField
                label="Status"
                name="setting_enforce_device_binding"
                variant="select"
                defaultValue={settings.enforce_device_binding || "false"}
                options={[
                  { value: "false", label: "Off — recorded only" },
                  { value: "true", label: "On — enforced at sign-in" },
                ]}
              />
            </div>
          </div>

          <div
            className="mt-4 flex items-start gap-2.5 rounded-[12px] px-3.5 py-3 text-[12px] leading-relaxed"
            style={{
              background: "var(--status-warning-bg)",
              border: "1px solid var(--status-warning-border)",
              color: "var(--status-warning-text)",
            }}
          >
            <AlertTriangle size={14} className="mt-[1px] shrink-0" aria-hidden />
            <span>
              Before switching this on: there is no self-service reset. Every existing
              customer who has cleared their browser cookies or changed hardware will be
              locked out until you reset their binding from their customer page. Device
              bindings already recorded stay valid.
            </span>
          </div>
        </SettingsGroup>
      </SettingsFormShell>
    </div>
  );
}
