"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { PremiumModal } from "@/components/ui/PremiumModal";
import { Button } from "@/components/ui/Button";

/**
 * ConfirmSubmit — a server-action form button with an optional confirmation
 * gate (spec §29: one unified modal system; §30: no browser `confirm()`).
 *
 * Why this exists: the admin panel previously used bare `<form action={...}>`
 * with `<button>` for high-consequence operations (cancel an order, delete a
 * product, disable an agent). There was no confirmation step and no pending
 * state, so a mis-tap was unrecoverable and a slow action looked like a no-op.
 *
 * Progressive enhancement: the form is a real HTML form posting to a real
 * server action, so it still works if JavaScript never loads. The confirm gate
 * is purely additive — when JS is unavailable the action simply runs directly.
 */

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral:
    "text-brand-ink-2 border-border-subtle bg-foreground/[0.04] hover:text-foreground hover:border-border-strong",
  success:
    "text-[color:var(--status-success-text)] border-[color:var(--status-success-border)] bg-[color:var(--status-success-bg)] hover:brightness-125",
  warning:
    "text-[color:var(--status-warning-text)] border-[color:var(--status-warning-border)] bg-[color:var(--status-warning-bg)] hover:brightness-125",
  danger:
    "text-[color:var(--status-danger-text)] border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)] hover:brightness-125",
  info: "text-brand-ink-2 border-border-subtle bg-foreground/[0.05] hover:brightness-125",
};

export interface ConfirmSubmitProps {
  /** The server action invoked with the FormData. */
  action: (formData: FormData) => void | Promise<void>;
  /** Hidden inputs posted with the form. */
  fields?: Record<string, string>;
  /** Button contents. */
  children: React.ReactNode;
  tone?: Tone;
  disabled?: boolean;
  className?: string;
  /** When present, a confirmation modal is shown before submitting. */
  confirm?: {
    title: string;
    description?: string;
    /** Body copy inside the dialog. Defaults to a neutral consequence note. */
    body?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: Tone;
  };
}

function InnerButton({
  tone,
  disabled,
  className,
  children,
}: {
  tone: Tone;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.07em] transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${TONE_CLASS[tone]} ${className ?? ""}`}
    >
      {pending ? (
        <Loader2 size={13} className="animate-spin" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}

export function ConfirmSubmit({
  action,
  fields = {},
  children,
  tone = "neutral",
  disabled = false,
  className,
  confirm,
}: ConfirmSubmitProps) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const bypassRef = React.useRef(false);
  const [open, setOpen] = React.useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (confirm && !bypassRef.current) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const proceed = () => {
    setOpen(false);
    bypassRef.current = true;
    /* requestSubmit re-enters handleSubmit; the bypass flag lets it through. */
    formRef.current?.requestSubmit();
    window.setTimeout(() => {
      bypassRef.current = false;
    }, 0);
  };

  const confirmTone = confirm?.tone ?? tone;

  return (
    <>
      <form ref={formRef} action={action} onSubmit={handleSubmit}>
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <InnerButton tone={tone} disabled={disabled} className={className}>
          {children}
        </InnerButton>
      </form>

      {confirm && (
        <PremiumModal
          open={open}
          onClose={() => setOpen(false)}
          title={confirm.title}
          description={confirm.description}
          tone={confirmTone === "danger" ? "danger" : confirmTone === "info" ? "info" : "neutral"}
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-[42px] items-center justify-center rounded-[11px] border border-border-subtle px-4 text-[12.5px] font-bold uppercase tracking-[0.05em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
              >
                {confirm.cancelLabel ?? "Go back"}
              </button>
              <button
                type="button"
                onClick={proceed}
                className={`inline-flex h-[42px] items-center justify-center rounded-[11px] border px-4 text-[12.5px] font-bold uppercase tracking-[0.05em] transition-colors ${TONE_CLASS[confirmTone]}`}
              >
                {confirm.confirmLabel ?? "Confirm"}
              </button>
            </>
          }
        >
          <p className="text-[13px] leading-relaxed text-brand-ink-2">
            {confirm.body ??
              "This updates the live record immediately. No data is deleted — the change can be reversed by applying the opposite action."}
          </p>
        </PremiumModal>
      )}
    </>
  );
}

/**
 * SubmitButton — a form-status-aware submit button for use *inside* an
 * existing `<form action={...}>`.
 *
 * `ConfirmSubmit` owns its own form, which is wrong for editor pages where the
 * form already exists around a dozen fields. This variant only supplies the
 * button, so the primary action can show a pending spinner and refuse a second
 * submission while the first is still in flight.
 */
export function SubmitButton({
  children,
  variant = "primary",
  size = "default",
  className,
  disabled = false,
  ...rest
}: {
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      loading={pending}
      disabled={disabled || pending}
      className={className}
      {...rest}
    >
      {children}
    </Button>
  );
}
