"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Power, Lock, ShieldAlert, Copy, Check, Sparkles, KeyRound } from "lucide-react";
import { adminSetAgentPassword, adminToggleAgentStatus } from "@/app/mkpanelzoneadmin/actions";
import { PremiumModal } from "@/components/ui/PremiumModal";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input, FieldLabel } from "@/components/ui/Input";

/**
 * AgentActions — the two privileged operations on an agent account.
 *
 * Rewritten for spec §29/§30: the disable/enable flow previously used the
 * browser's native `confirm()`, which cannot be styled, cannot be themed, and
 * blocks the whole tab. It now uses the shared modal system.
 *
 * The password flow also gains a generator and a one-time reveal, matching the
 * customer and agent-creation flows, so an admin never has to invent a weak
 * password by hand or lose it after submitting.
 */

/** Unambiguous alphabet — no 0/O/1/l/I to avoid transcription errors. */
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const PASSWORD_LENGTH = 12;

function generatePassword(): string {
  const bytes = new Uint32Array(PASSWORD_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => PASSWORD_ALPHABET[n % PASSWORD_ALPHABET.length]).join("");
}

export function AgentActions({
  agentId,
  currentStatus,
  username,
}: {
  agentId: string;
  currentStatus: string;
  username: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const isActive = currentStatus === "ACTIVE";

  const [pending, setPending] = React.useState<"status" | "password" | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [issuedPassword, setIssuedPassword] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleToggleStatus = async () => {
    setConfirmOpen(false);
    setPending("status");

    const result = await adminToggleAgentStatus(agentId, currentStatus);

    setPending(null);

    /* The action returns `{ error }` or `{ success }`, so narrow on the key. */
    if ("error" in result && result.error) {
      toast.error("Could not change the account status", result.error);
      return;
    }

    toast.success(
      isActive ? "Agent disabled" : "Agent enabled",
      isActive
        ? `${username} can no longer sign in or create customers.`
        : `${username} can sign in again.`
    );
    router.refresh();
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 6) {
      toast.error("Password too short", "Use at least 6 characters.");
      return;
    }

    setPending("password");
    const result = await adminSetAgentPassword(agentId, password);
    setPending(null);

    if ("error" in result && result.error) {
      toast.error("Could not reset the password", result.error);
      return;
    }

    setIssuedPassword(password);
    setPassword("");
    toast.success("Password reset", "Copy the new password now — it is stored only as a hash.");
  };

  const copyIssued = async () => {
    if (!issuedPassword) return;
    try {
      await navigator.clipboard.writeText(issuedPassword);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed", "Select the password and copy it manually.");
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Account status ─────────────────────────────────────────────── */}
      <section className="mat-3 rounded-[18px] p-5">
        <h2 className="mb-3 flex items-center gap-2 border-b border-border-subtle pb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
          <Power size={13} aria-hidden />
          Account status
        </h2>

        <p className="mb-4 text-[12.5px] leading-relaxed text-brand-ink-3">
          {isActive
            ? "Disabling this agent blocks sign-in and stops them creating customers. Existing customers are unaffected and keep working."
            : "This agent is currently blocked from signing in. Enabling restores access to the agent panel."}
        </p>

        <Button
          type="button"
          variant={isActive ? "crimson" : "secondary"}
          className="w-full"
          loading={pending === "status"}
          disabled={pending !== null}
          onClick={() => setConfirmOpen(true)}
        >
          {isActive ? "Disable agent" : "Enable agent"}
        </Button>
      </section>

      {/* ── Password ───────────────────────────────────────────────────── */}
      <section className="mat-3 rounded-[18px] p-5">
        <h2 className="mb-3 flex items-center gap-2 border-b border-border-subtle pb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
          <Lock size={13} aria-hidden />
          Reset password
        </h2>

        {issuedPassword ? (
          <div className="space-y-3">
            <div
              className="rounded-[12px] p-3.5"
              style={{
                background: "var(--status-success-bg)",
                border: "1px solid var(--status-success-border)",
              }}
            >
              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--status-success-text)]">
                New password issued
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-foreground">
                  {issuedPassword}
                </code>
                <button
                  type="button"
                  onClick={copyIssued}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-border-subtle text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
                  title="Copy password"
                >
                  {copied ? (
                    <Check size={14} aria-hidden />
                  ) : (
                    <Copy size={14} aria-hidden />
                  )}
                  <span className="sr-only">Copy password</span>
                </button>
              </div>
            </div>
            <p className="text-[11.5px] leading-relaxed text-brand-ink-4">
              Hand this to the agent now. It is stored only as a hash, so it cannot be
              displayed again.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setIssuedPassword(null)}
            >
              Reset another password
            </Button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <FieldLabel htmlFor="agent-new-password">New password</FieldLabel>
              <Input
                id="agent-new-password"
                type="text"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                disabled={pending !== null}
                className="font-mono"
              />
            </div>

            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.07em] text-brand-ink-2 transition-colors hover:text-brand-ink-2"
            >
              <Sparkles size={12} aria-hidden />
              Generate a strong password
            </button>

            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              loading={pending === "password"}
              disabled={pending !== null || password.length === 0}
            >
              <KeyRound size={14} aria-hidden />
              Update password
            </Button>
          </form>
        )}
      </section>

      {/* ── Confirmation ───────────────────────────────────────────────── */}
      <PremiumModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={isActive ? `Disable ${username}?` : `Enable ${username}?`}
        description={isActive ? "Their session ends immediately." : "Access is restored immediately."}
        tone={isActive ? "danger" : "neutral"}
        size="sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={isActive ? "crimson" : "primary"}
              onClick={handleToggleStatus}
            >
              {isActive ? "Disable agent" : "Enable agent"}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <ShieldAlert
            size={17}
            className="mt-[2px] shrink-0 text-[color:var(--status-danger-text)]"
            aria-hidden
          />
          <p className="text-[13px] leading-relaxed text-brand-ink-2">
            {isActive
              ? "This agent will not be able to sign in or create new customers until you re-enable the account. No customer records are changed."
              : "This agent will regain full access to the agent panel and will be able to create customers again."}
          </p>
        </div>
      </PremiumModal>
    </div>
  );
}
