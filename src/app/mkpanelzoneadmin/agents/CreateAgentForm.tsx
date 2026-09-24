"use client";

import * as React from "react";
import { useActionState } from "react";
import { adminCreateAgent } from "@/app/mkpanelzoneadmin/actions";
import { Button } from "@/components/ui/Button";
import { Input, FieldLabel } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { AlertCircle, Wand2, ShieldCheck, KeyRound } from "lucide-react";
import type { ActionState } from "@/lib/actionResult";

/**
 * CreateAgentForm — unchanged server contract (`adminCreateAgent`), rebuilt UI.
 *
 * Additions are operator-quality-of-life only: a strong-password generator
 * (agents were previously created with hand-typed passwords), a persistent
 * inline error surface, and a toast confirmation. No new privileges and no
 * change to how the account is created server-side.
 */

/** Cryptographically random, unambiguous-character password. */
function generatePassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function CreateAgentForm() {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(adminCreateAgent, null);
  const router = useRouter();
  const { toast } = useToast();

  const formRef = React.useRef<HTMLFormElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const [revealed, setRevealed] = React.useState("");

  /*
    Adjust state during render when the action reports success — React's
    documented pattern for reacting to new data. The previous version did this in
    an effect, which meant a cascading render and a suppressed
    `exhaustive-deps` warning.

    Clearing the generated password is part of the same adjustment, so the effect
    below is left with only genuine side effects (resetting the DOM form,
    raising a toast, refreshing server data) and never calls setState itself.
  */
  const [syncedSuccess, setSyncedSuccess] = React.useState(false);
  const succeeded = Boolean(state?.success);

  if (succeeded && !syncedSuccess) {
    setSyncedSuccess(true);
    setRevealed("");
  }

  React.useEffect(() => {
    if (!syncedSuccess) return;
    formRef.current?.reset();
    toast({
      type: "success",
      message: "Agent created",
      description: "The account is active and can sign in immediately.",
    });
    router.refresh();
  }, [syncedSuccess, toast, router]);

  const fillPassword = () => {
    const value = generatePassword();
    if (passwordRef.current) {
      passwordRef.current.value = value;
      passwordRef.current.focus();
      passwordRef.current.select();
    }
    setRevealed(value);
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <FieldLabel htmlFor="agent-username" required>
          Agent Username
        </FieldLabel>
        <Input
          id="agent-username"
          name="username"
          type="text"
          required
          autoComplete="off"
          placeholder="e.g. agent_north"
        />
      </div>

      <div>
        <div className="flex items-end justify-between gap-2">
          <FieldLabel htmlFor="agent-password" required className="mb-2">
            Temporary Password
          </FieldLabel>
          <button
            type="button"
            onClick={fillPassword}
            className="mb-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em] text-brand-ink-2 transition-colors hover:text-brand-ink-2"
          >
            <Wand2 size={11} aria-hidden />
            Generate
          </button>
        </div>
        <Input
          id="agent-password"
          ref={passwordRef}
          name="password"
          type="text"
          required
          minLength={6}
          autoComplete="off"
          placeholder="Minimum 6 characters"
        />
        {revealed && (
          <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-brand-ink-3">
            <KeyRound size={12} className="mt-[2px] shrink-0 text-brand-ink-2" aria-hidden />
            <span>
              Copy this now — it will not be shown again after creation.
            </span>
          </p>
        )}
      </div>

      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 text-[12.5px] leading-relaxed"
          style={{
            background: "var(--status-danger-bg)",
            borderColor: "var(--status-danger-border)",
            color: "var(--status-danger-text)",
          }}
        >
          <AlertCircle size={14} className="mt-[2px] shrink-0" aria-hidden />
          <span className="font-medium">{state.error}</span>
        </div>
      )}

      <Button type="submit" variant="primary" className="w-full" loading={pending}>
        {pending ? "Creating…" : "Create Agent"}
      </Button>

      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-brand-ink-4">
        <ShieldCheck size={12} className="mt-[2px] shrink-0" aria-hidden />
        New agents can only create customers — they cannot reach owner settings,
        payments or product configuration.
      </p>
    </form>
  );
}
