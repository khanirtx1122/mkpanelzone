"use client";

import * as React from "react";
import { useTransition, useState } from "react";
import {
  adminUpdateCustomerStatus,
  adminResetCustomerDevice,
  adminSetCustomerPassword,
  adminChangeCustomerPlatform,
} from "@/app/mkpanelzoneadmin/actions";
import {
  ShieldAlert,
  ShieldCheck,
  Trash2,
  KeyRound,
  MonitorSmartphone,
  Wand2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PremiumModal } from "@/components/ui/PremiumModal";
import { useToast } from "@/components/providers/ToastProvider";
import { FieldLabel, Input, Select } from "@/components/ui/Input";

/**
 * CustomerActions — privileged operations on a single customer (spec §25).
 *
 * Previously these used `window.confirm()` and `window.prompt()`: an unstyled
 * browser dialog, and a password prompt that echoed the new password in plain
 * text on screen with no way to review or copy it. Both are now the shared
 * PremiumModal, and the password flow generates a strong value the operator can
 * copy and hand over.
 *
 * Every server action call keeps its original signature and arguments.
 */

const PLATFORM_OPTIONS = [
  { value: "ANDROID", label: "Android" },
  { value: "IOS", label: "iPhone / iOS" },
  { value: "PC", label: "PC" },
];

function generatePassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function CustomerActions({
  customerId,
  currentStatus,
  deviceCount,
  currentPlatform,
  currentPackageId,
  packages,
}: {
  customerId: string;
  currentStatus: string;
  deviceCount: number;
  currentPlatform: string;
  currentPackageId: string;
  /**
   * Only the three fields this panel actually reads. Typing the exact shape
   * rather than `any[]` means a renamed column fails at compile time instead of
   * silently rendering an empty package list.
   */
  packages: { id: string; name: string; platformType: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const [resetDeviceOpen, setResetDeviceOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [issuedPassword, setIssuedPassword] = useState<string | null>(null);

  const [platform, setPlatform] = useState(currentPlatform);
  const [packageId, setPackageId] = useState(currentPackageId);

  const isActive = currentStatus === "active";

  /* ── Status ─────────────────────────────────────────────────── */
  const handleToggleStatus = () => {
    startTransition(async () => {
      const newStatus = isActive ? "disabled" : "active";
      const result = await adminUpdateCustomerStatus(customerId, newStatus);
      if (result?.error) {
        toast({ type: "error", message: "Could not update status", description: result.error });
      } else {
        toast({
          type: "success",
          message: newStatus === "active" ? "Account enabled" : "Account disabled",
          description:
            newStatus === "active"
              ? "The customer can sign in again."
              : "Sign-in and dashboard access are now blocked.",
        });
        router.refresh();
      }
    });
  };

  /* ── Device binding ─────────────────────────────────────────── */
  const handleResetDevice = () => {
    setResetDeviceOpen(false);
    startTransition(async () => {
      const result = await adminResetCustomerDevice(customerId);
      if (result?.error) {
        toast({ type: "error", message: "Could not reset device", description: result.error });
      } else {
        toast({
          type: "success",
          message: "Device binding cleared",
          description: "The customer can now sign in from a new device.",
        });
        router.refresh();
      }
    });
  };

  /* ── Password ───────────────────────────────────────────────── */
  const openPasswordModal = () => {
    setNewPassword(generatePassword());
    setIssuedPassword(null);
    setPasswordOpen(true);
  };

  const handleResetPassword = () => {
    if (newPassword.length < 6) {
      toast({
        type: "warning",
        message: "Password too short",
        description: "Use at least 6 characters.",
      });
      return;
    }
    const value = newPassword;
    startTransition(async () => {
      const result = await adminSetCustomerPassword(customerId, value);
      if (result?.error) {
        toast({ type: "error", message: "Could not set password", description: result.error });
      } else {
        setIssuedPassword(value);
        toast({
          type: "success",
          message: "Password updated",
          description: "Copy it now — it cannot be read back later.",
        });
      }
    });
  };

  /* ── Platform / package ─────────────────────────────────────── */
  const handleUpdatePlatform = () => {
    startTransition(async () => {
      const result = await adminChangeCustomerPlatform(customerId, platform, packageId);
      if (result?.error) {
        toast({
          type: "error",
          message: "Could not update assignment",
          description: result.error,
        });
      } else {
        toast({
          type: "success",
          message: "Platform and package updated",
          description: "The customer's vault now reflects the new assignment.",
        });
        router.refresh();
      }
    });
  };

  const packagesForPlatform = packages.filter((pkg) => pkg.platformType === platform);
  const assignmentDirty = platform !== currentPlatform || packageId !== currentPackageId;

  return (
    <div className="space-y-4">
      <div className="mat-3 rounded-[18px] p-5 sm:p-6">
        <h2 className="mb-5 flex items-center justify-between border-b border-border-subtle pb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
          Management actions
          {isPending && (
            <span className="inline-flex items-center gap-1.5 text-brand-ink-2 normal-case tracking-normal">
              <Loader2 size={12} className="animate-spin" aria-hidden />
              Applying…
            </span>
          )}
        </h2>

        <div className="space-y-3">
          {/* Account status */}
          <ActionRow
            icon={<ShieldAlert size={15} />}
            title="Account status"
            description="Enable or disable sign-in and dashboard access."
          >
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isPending}
              className={`inline-flex items-center gap-2 rounded-[10px] border px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-[0.06em] transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                isActive
                  ? "border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)] text-[color:var(--status-danger-text)] hover:brightness-125"
                  : "border-[color:var(--status-success-border)] bg-[color:var(--status-success-bg)] text-[color:var(--status-success-text)] hover:brightness-125"
              }`}
            >
              {isActive ? (
                <>
                  <ShieldAlert size={13} aria-hidden />
                  Disable account
                </>
              ) : (
                <>
                  <ShieldCheck size={13} aria-hidden />
                  Enable account
                </>
              )}
            </button>
          </ActionRow>

          {/* Device bindings */}
          <ActionRow
            icon={<MonitorSmartphone size={15} />}
            title={`Device bindings (${deviceCount})`}
            description={
              deviceCount === 0
                ? "No device is currently bound to this account."
                : "Clear the registered hardware ID so a new device can be bound."
            }
          >
            <button
              type="button"
              onClick={() => setResetDeviceOpen(true)}
              disabled={isPending || deviceCount === 0}
              className="inline-flex items-center gap-2 rounded-[10px] border border-[color:var(--status-warning-border)] bg-[color:var(--status-warning-bg)] px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-[0.06em] text-[color:var(--status-warning-text)] transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Trash2 size={13} aria-hidden />
              Reset device
            </button>
          </ActionRow>

          {/* Password */}
          <ActionRow
            icon={<KeyRound size={15} />}
            title="Credentials"
            description="Set a new access password. The current one is hashed and cannot be recovered."
          >
            <button
              type="button"
              onClick={openPasswordModal}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-[10px] border border-border-subtle bg-foreground/[0.05] px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-[0.06em] text-brand-ink-2 transition-colors hover:bg-foreground/[0.07] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <KeyRound size={13} aria-hidden />
              Set password
            </button>
          </ActionRow>

          {/* Platform & package */}
          <div className="rounded-[14px] border border-border-subtle bg-foreground/[0.02] p-4">
            <div className="mb-3.5 flex items-start gap-2.5">
              <span className="mt-[1px] text-brand-ink-3">
                <MonitorSmartphone size={15} aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-bold text-foreground">Platform &amp; package</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-brand-ink-3">
                  Changing the platform clears the package selection — pick a package that
                  belongs to the new platform.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <FieldLabel htmlFor="ca-platform">Platform</FieldLabel>
                <Select
                  id="ca-platform"
                  value={platform}
                  onChange={(e) => {
                    setPlatform(e.target.value);
                    setPackageId("");
                  }}
                  className="h-[44px] text-[13px]"
                >
                  {PLATFORM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel htmlFor="ca-package">Package</FieldLabel>
                <Select
                  id="ca-package"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="h-[44px] text-[13px]"
                >
                  <option value="">None</option>
                  {packagesForPlatform.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </option>
                  ))}
                </Select>
                {packagesForPlatform.length === 0 && (
                  <p className="mt-1.5 text-[11px] text-[color:var(--status-warning-text)]">
                    No packages exist for this platform.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleUpdatePlatform}
                disabled={isPending || !assignmentDirty}
                className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[10px] border border-border-subtle bg-foreground/[0.05] px-4 text-[11.5px] font-bold uppercase tracking-[0.06em] text-brand-ink-2 transition-colors hover:bg-foreground/[0.07] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Update
              </button>
            </div>

            {assignmentDirty && (
              <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[color:var(--status-warning-text)]">
                <AlertTriangle size={12} className="mt-[2px] shrink-0" aria-hidden />
                Unsaved change — press Update to apply it.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Reset device confirmation ───────────────────────────── */}
      <PremiumModal
        open={resetDeviceOpen}
        onClose={() => setResetDeviceOpen(false)}
        title="Reset the device binding?"
        description="The customer will be able to sign in from a new device."
        tone="danger"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setResetDeviceOpen(false)}
              className="inline-flex h-[42px] items-center justify-center rounded-[11px] border border-border-subtle px-4 text-[12.5px] font-bold uppercase tracking-[0.05em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetDevice}
              className="inline-flex h-[42px] items-center justify-center rounded-[11px] border border-[color:var(--status-warning-border)] bg-[color:var(--status-warning-bg)] px-4 text-[12.5px] font-bold uppercase tracking-[0.05em] text-[color:var(--status-warning-text)] transition-colors hover:brightness-125"
            >
              Reset binding
            </button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-brand-ink-2">
          {deviceCount} device record{deviceCount === 1 ? "" : "s"} will be cleared. The account
          itself, its package and its resources are untouched — only the hardware binding is
          released.
        </p>
      </PremiumModal>

      {/* ── Set password ────────────────────────────────────────── */}
      <PremiumModal
        open={passwordOpen}
        onClose={() => {
          setPasswordOpen(false);
          setIssuedPassword(null);
        }}
        title="Set a new password"
        description="The customer will use this to sign in to Customer Access."
        tone="neutral"
        size="sm"
        closeOnBackdrop={!issuedPassword}
        footer={
          issuedPassword ? (
            <button
              type="button"
              onClick={() => {
                setPasswordOpen(false);
                setIssuedPassword(null);
              }}
              className="inline-flex h-[42px] items-center justify-center rounded-[11px] border border-border-subtle px-4 text-[12.5px] font-bold uppercase tracking-[0.05em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPasswordOpen(false)}
                className="inline-flex h-[42px] items-center justify-center rounded-[11px] border border-border-subtle px-4 text-[12.5px] font-bold uppercase tracking-[0.05em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isPending || newPassword.length < 6}
                className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[11px] px-4 text-[12.5px] font-bold uppercase tracking-[0.05em] text-white transition-[filter] hover:brightness-[1.07] disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  background: "linear-gradient(168deg,#3478E8 0%,#2457C5 58%,#1C3D91 100%)",
                }}
              >
                {isPending && <Loader2 size={13} className="animate-spin" aria-hidden />}
                Apply password
              </button>
            </>
          )
        }
      >
        {issuedPassword ? (
          <div>
            <div
              className="rounded-[12px] border px-4 py-3.5"
              style={{
                background: "var(--status-success-bg)",
                borderColor: "var(--status-success-border)",
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--status-success-text)]">
                New password
              </p>
              <p className="mt-2 select-all break-all font-mono text-[18px] font-extrabold tracking-[0.04em] text-foreground">
                {issuedPassword}
              </p>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-brand-ink-2">
              Copy this now and hand it to the customer. It is stored as a hash and cannot be
              displayed again.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="flex items-end justify-between gap-2">
                <FieldLabel htmlFor="ca-new-password" required className="mb-2">
                  New password
                </FieldLabel>
                <button
                  type="button"
                  onClick={() => setNewPassword(generatePassword())}
                  className="mb-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em] text-brand-ink-2 transition-colors hover:text-brand-ink-2"
                >
                  <Wand2 size={11} aria-hidden />
                  Regenerate
                </button>
              </div>
              <Input
                id="ca-new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                autoComplete="off"
                className="font-mono"
              />
            </div>
            <p className="text-[11.5px] leading-relaxed text-brand-ink-4">
              Minimum 6 characters. A random 12-character value is suggested by default.
            </p>
          </div>
        )}
      </PremiumModal>
    </div>
  );
}

/** One labelled operation row inside the management panel. */
function ActionRow({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-foreground/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <span className="mt-[1px] shrink-0 text-brand-ink-3">{icon}</span>
        <div>
          <p className="text-[13px] font-bold text-foreground">{title}</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-brand-ink-3">{description}</p>
        </div>
      </div>
      <div className="shrink-0 sm:pl-4">{children}</div>
    </div>
  );
}
