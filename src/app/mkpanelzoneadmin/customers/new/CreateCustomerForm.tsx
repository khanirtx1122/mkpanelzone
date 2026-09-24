"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { AlertCircle, Sparkles, Copy, Check, Smartphone, Apple, Monitor } from "lucide-react";
import { adminCreateCustomer } from "@/app/mkpanelzoneadmin/actions";
import { useToast } from "@/components/providers/ToastProvider";
import { SettingsGroup, SettingsGrid, SettingsField } from "@/components/admin/SettingsField";
import { Button } from "@/components/ui/Button";
import { Input, FieldLabel } from "@/components/ui/Input";

/**
 * The admin-side customer creation form.
 *
 * Contract with `adminCreateCustomer` is unchanged: it posts `identifier`,
 * `password`, `platformType`, `packageId` and `status`, and the platform must
 * match the selected package — the server re-validates that, so this form only
 * narrows the choices rather than being the enforcement point (spec §49).
 */

export interface PackageOption {
  id: string;
  name: string;
  platformType: string;
}

const PLATFORMS = [
  { value: "ANDROID", label: "Android", icon: Smartphone },
  { value: "IOS", label: "iPhone", icon: Apple },
  { value: "PC", label: "PC", icon: Monitor },
] as const;

const STATUS_OPTIONS = [
  { value: "active", label: "Active — can sign in immediately" },
  { value: "disabled", label: "Disabled — created but blocked from signing in" },
];

/** Unambiguous alphabet — no 0/O/1/l/I to avoid transcription errors. */
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function generatePassword(length = 12): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => PASSWORD_ALPHABET[n % PASSWORD_ALPHABET.length]).join("");
}

function SubmitRow({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex items-center justify-end">
      <Button type="submit" loading={pending} disabled={disabled} className="w-full sm:w-auto">
        {pending ? "Creating…" : "Create customer"}
      </Button>
    </div>
  );
}

export function CreateCustomerForm({ packages }: { packages: PackageOption[] }) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction] = useActionState(adminCreateCustomer, null);

  const [platform, setPlatform] = React.useState<string>("ANDROID");
  const [packageId, setPackageId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  /* The success path redirects; the toast fires first so the outcome is visible. */
  React.useEffect(() => {
    if (state?.success) {
      toast.success("Customer created", "They can sign in with the identifier and password you set.");
      router.push("/mkpanelzoneadmin/customers");
    }
  }, [state, router, toast]);

  const packagesForPlatform = packages.filter((pkg) => pkg.platformType === platform);

  /* Changing platform invalidates a package chosen for the previous one. */
  const onPlatformChange = (next: string) => {
    setPlatform(next);
    const stillValid = packages.some(
      (pkg) => pkg.id === packageId && pkg.platformType === next
    );
    if (!stillValid) setPackageId("");
  };

  const copyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed", "Select the password and copy it manually.");
    }
  };

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[14px] px-4 py-3.5 text-[12.5px] leading-relaxed"
          style={{
            background: "var(--status-danger-bg)",
            border: "1px solid var(--status-danger-border)",
            color: "var(--status-danger-text)",
          }}
        >
          <AlertCircle size={15} className="mt-[2px] shrink-0" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <SettingsGroup
        title="Credentials"
        description="How the customer identifies themselves. The identifier must be unique across the whole platform."
      >
        <SettingsGrid>
          <SettingsField
            label="Identifier"
            name="identifier"
            mono
            full
            required
            placeholder="e.g. mk_user_1042"
            hint="Used as the sign-in username. Letters, digits and underscores are safest."
          />

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="new-customer-password">Password</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="new-customer-password"
                name="password"
                type="text"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="font-mono"
              />
              <button
                type="button"
                onClick={copyPassword}
                disabled={!password}
                className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[11px] border border-border-subtle text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-40"
                title="Copy password"
              >
                {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
                <span className="sr-only">Copy password</span>
              </button>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.07em] text-brand-ink-2 transition-colors hover:text-brand-ink-2"
              >
                <Sparkles size={12} aria-hidden />
                Generate a strong password
              </button>
              <span className="text-[11px] text-brand-ink-4">
                Stored as a hash — copy it now and hand it to the customer.
              </span>
            </div>
          </div>
        </SettingsGrid>
      </SettingsGroup>

      <SettingsGroup
        title="Platform & package"
        description="The platform decides which dashboard the customer sees, and which resources are offered."
      >
        <fieldset className="mb-5">
          <legend className="mb-2 block text-[12px] font-bold uppercase tracking-[0.09em] text-brand-ink-2">
            Platform
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS.map((option) => {
              const Icon = option.icon;
              const selected = platform === option.value;
              return (
                <label
                  key={option.value}
                  className={[
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-[12px] border px-3 py-3 text-[12px] font-bold transition-colors",
                    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--accent)]",
                    selected
                      ? "border-border-strong bg-foreground/[0.08] text-foreground"
                      : "border-border-subtle text-brand-ink-3 hover:border-border-strong hover:text-foreground",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="platformType"
                    value={option.value}
                    checked={selected}
                    onChange={() => onPlatformChange(option.value)}
                    className="sr-only"
                  />
                  <Icon size={17} aria-hidden />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <SettingsGrid>
          <div>
            <FieldLabel htmlFor="new-customer-package">Package</FieldLabel>
            <select
              id="new-customer-package"
              name="packageId"
              value={packageId}
              onChange={(event) => setPackageId(event.target.value)}
              required
              className="w-full rounded-[12px] border border-border-subtle bg-foreground/[0.04] px-3.5 py-3 text-[13px] text-foreground outline-none transition-colors focus:border-[color:var(--accent)]"
            >
              <option value="">Select a package…</option>
              {packagesForPlatform.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
            {packagesForPlatform.length === 0 ? (
              <p className="mt-2 text-[11.5px] leading-relaxed text-[color:var(--status-warning-text)]">
                No packages exist for {PLATFORMS.find((p) => p.value === platform)?.label} yet.
                Create one on the Packages page first.
              </p>
            ) : (
              <p className="mt-2 text-[11.5px] text-brand-ink-4">
                Only packages for the selected platform are listed.
              </p>
            )}
          </div>

          <SettingsField
            label="Initial status"
            name="status"
            variant="select"
            defaultValue="active"
            options={STATUS_OPTIONS}
            hint="Customers created as disabled cannot sign in until you enable them."
          />
        </SettingsGrid>
      </SettingsGroup>

      <SubmitRow disabled={!packageId || password.length < 6} />
    </form>
  );
}
