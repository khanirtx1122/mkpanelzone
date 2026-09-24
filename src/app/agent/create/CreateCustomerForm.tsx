"use client";

import * as React from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { agentCreateCustomer } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Input, FieldLabel } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Smartphone,
  TabletSmartphone,
  Monitor,
  X,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import type { ActionState } from "@/lib/actionResult";

/**
 * CreateCustomerForm — the agent's primary task (spec §28).
 *
 * Server contract unchanged: `agentCreateCustomer`, with the same four field
 * names (`identifier`, `password`, `platformType`, `paymentProof`) and the same
 * `{ success, error }` result shape.
 *
 * Optimised for speed rather than decoration:
 *  - platform is a three-way segmented control, one tap instead of opening a
 *    native select
 *  - the password can be generated and is shown in clear so it can be handed
 *    over immediately
 *  - the chosen screenshot gets a real thumbnail, so the agent can confirm they
 *    attached the right receipt before submitting
 *  - a short keyboard-free "what happens next" note prevents the two common
 *    support tickets (wrong platform, no default package)
 */

const PLATFORMS = [
  { value: "ANDROID", label: "Android", Icon: Smartphone },
  { value: "IOS", label: "iPhone", Icon: TabletSmartphone },
  { value: "PC", label: "PC", Icon: Monitor },
] as const;

function generatePassword(length = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function CreateCustomerForm() {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(
    agentCreateCustomer,
    null
  );
  const router = useRouter();
  const { toast } = useToast();

  const formRef = useRef<HTMLFormElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [platform, setPlatform] = React.useState<string>("ANDROID");
  const [proof, setProof] = React.useState<{ name: string; url: string } | null>(null);

  /* Revoke object URLs to avoid leaking blob handles across submissions. */
  useEffect(() => {
    return () => {
      if (proof?.url) URL.revokeObjectURL(proof.url);
    };
  }, [proof]);

  /*
    Adjust state during render when the action reports success — React's
    documented pattern for reacting to new data. This replaced an effect that
    called setState synchronously (and suppressed `exhaustive-deps` to do it), so
    the effect below is now left with only genuine side effects.
  */
  const [syncedSuccess, setSyncedSuccess] = useState(false);
  const succeeded = Boolean(state?.success);

  if (succeeded && !syncedSuccess) {
    setSyncedSuccess(true);
    setProof(null);
    setPlatform("ANDROID");
  }

  useEffect(() => {
    if (!syncedSuccess) return;
    formRef.current?.reset();
    toast({
      type: "success",
      message: "Customer created",
      description: "The account is ready and bound to the selected platform.",
    });
    router.refresh();
  }, [syncedSuccess, toast, router]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProof(null);
      return;
    }
    setProof({ name: file.name, url: URL.createObjectURL(file) });
  };

  const clearFile = () => {
    if (fileRef.current) fileRef.current.value = "";
    setProof(null);
  };

  const fillPassword = () => {
    const value = generatePassword();
    if (passwordRef.current) {
      passwordRef.current.value = value;
      passwordRef.current.focus();
      passwordRef.current.select();
    }
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {/* ── Identity ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="cc-identifier" required>
            Customer identifier
          </FieldLabel>
          <Input
            id="cc-identifier"
            name="identifier"
            type="text"
            required
            autoComplete="off"
            placeholder="customer123"
          />
        </div>

        <div>
          <div className="flex items-end justify-between gap-2">
            <FieldLabel htmlFor="cc-password" required className="mb-2">
              Access password
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
            id="cc-password"
            ref={passwordRef}
            name="password"
            type="text"
            required
            minLength={6}
            autoComplete="off"
            placeholder="Minimum 6 characters"
          />
        </div>
      </div>

      {/* ── Platform ────────────────────────────────────────────── */}
      <fieldset>
        <legend className="mb-2 block text-[12px] font-bold uppercase tracking-[0.09em] text-brand-ink-2">
          Platform <span className="text-[color:var(--status-danger-text)]">*</span>
        </legend>
        <div className="grid grid-cols-3 gap-2.5">
          {PLATFORMS.map(({ value, label, Icon }) => {
            const selected = platform === value;
            return (
              <label key={value} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="platformType"
                  value={value}
                  checked={selected}
                  onChange={() => setPlatform(value)}
                  className="peer sr-only"
                />
                <span
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-[12px] border px-2 py-3.5 text-[12px] font-bold transition-[border-color,background-color,transform] duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--accent)] ${
                    selected
                      ? "border-border-strong bg-foreground/[0.07] text-foreground"
                      : "border-border-subtle bg-[var(--input-bg)] text-brand-ink-2 hover:border-border-strong"
                  }`}
                >
                  <Icon
                    size={18}
                    className={selected ? "text-brand-ink-2" : "text-brand-ink-3"}
                    aria-hidden
                  />
                  {label}
                </span>
                {selected && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-blue-500 text-white"
                    aria-hidden
                  >
                    <CheckCircle2 size={11} />
                  </span>
                )}
              </label>
            );
          })}
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-brand-ink-4">
          <ShieldCheck size={12} className="mt-[2px] shrink-0" aria-hidden />
          The platform is permanent. The default package for the chosen platform is assigned
          automatically, and the customer can only sign in from that platform.
        </p>
      </fieldset>

      {/* ── Payment proof ───────────────────────────────────────── */}
      <div>
        <FieldLabel htmlFor="cc-proof" required>
          Payment proof
        </FieldLabel>

        {proof ? (
          <div className="flex items-center gap-3.5 rounded-[12px] border border-border-subtle bg-[var(--input-bg)] p-3">
            <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[9px] border border-border-subtle bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proof.url} alt="Selected payment proof" className="h-full w-full object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground">{proof.name}</p>
              <p className="mt-0.5 text-[11.5px] text-[color:var(--status-success-text)]">
                Ready to attach
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              aria-label="Remove selected file"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-border-subtle text-brand-ink-3 transition-colors hover:border-[color:var(--status-danger-border)] hover:text-[color:var(--status-danger-text)]"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <label
            htmlFor="cc-proof"
            className="group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-border-strong bg-[var(--input-bg)] px-6 py-7 text-center transition-colors hover:border-border-strong hover:bg-foreground/[0.04]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-foreground/[0.05] text-brand-ink-2 transition-transform duration-200 group-hover:scale-105">
              <Upload size={18} aria-hidden />
            </span>
            <span className="mt-1 text-[13px] font-bold text-foreground">
              Attach the payment screenshot
            </span>
            <span className="text-[11.5px] text-brand-ink-3">
              Click to choose a file · JPEG or PNG
            </span>
          </label>
        )}

        <input
          ref={fileRef}
          id="cc-proof"
          type="file"
          name="paymentProof"
          accept="image/*"
          required
          onChange={handleFile}
          className="sr-only"
        />
      </div>

      {/* ── Result ──────────────────────────────────────────────── */}
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

      {state?.success && (
        <div
          className="flex items-center gap-2.5 rounded-[12px] border px-3.5 py-3 text-[12.5px] font-semibold"
          style={{
            background: "var(--status-success-bg)",
            borderColor: "var(--status-success-border)",
            color: "var(--status-success-text)",
          }}
          role="status"
        >
          <CheckCircle2 size={15} className="shrink-0" aria-hidden />
          Customer created — the account is live.
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-brand-ink-4">
          <KeyRound size={12} className="mt-[2px] shrink-0" aria-hidden />
          Hand the password to the customer now — it is hashed on save and cannot be read back.
        </p>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={pending}
          className="w-full shrink-0 sm:w-auto"
        >
          {pending ? "Creating…" : "Create Customer"}
        </Button>
      </div>
    </form>
  );
}
