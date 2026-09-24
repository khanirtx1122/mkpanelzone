"use client";

import * as React from "react";
import { useActionState } from "react";
import { saveSettings } from "@/app/mkpanelzoneadmin/actions";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";
import type { ActionState } from "@/lib/actionResult";

/**
 * SettingsFormShell — the one save experience for every settings screen
 * (spec §53, §30).
 *
 * Previously each settings page repeated a bare `<form action={saveSettings}>`
 * with no pending state and no confirmation, so pressing Save looked like
 * nothing happened and a failure was invisible. This shell adds a real pending
 * state, a success toast and a persistent inline error, while keeping the
 * exact same server contract:
 *
 *   - field names stay `setting_<key>` (saveSettings strips the prefix)
 *   - `redirectUrl` is posted so `revalidatePath` still fires
 */

export function SettingsFormShell({
  redirectUrl,
  submitLabel = "Save changes",
  children,
}: {
  redirectUrl: string;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(saveSettings, null);
  const { toast } = useToast();
  const lastState = React.useRef<ActionState | null>(null);

  React.useEffect(() => {
    if (state && state !== lastState.current) {
      lastState.current = state;
      if (state.success) {
        toast({
          type: "success",
          message: "Settings saved",
          description: "The live site now reflects these values.",
        });
      } else if (state.error) {
        toast({ type: "error", message: "Could not save", description: state.error });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="redirectUrl" value={redirectUrl} />

      {children}

      {/* Sticky save bar — always reachable on long settings pages */}
      <div className="mat-4 sticky bottom-4 z-20 flex flex-col gap-3 rounded-[16px] p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-[20px] text-[12.5px] leading-relaxed">
          {state?.error ? (
            <span
              className="inline-flex items-center gap-1.5 font-semibold"
              style={{ color: "var(--status-danger-text)" }}
              role="alert"
            >
              <AlertCircle size={13} aria-hidden />
              {state.error}
            </span>
          ) : state?.success ? (
            <span
              className="inline-flex items-center gap-1.5 font-semibold"
              style={{ color: "var(--status-success-text)" }}
            >
              <CheckCircle2 size={13} aria-hidden />
              Saved — changes are live.
            </span>
          ) : (
            <span className="text-brand-ink-4">
              Changes apply to the live site as soon as you save.
            </span>
          )}
        </div>

        <Button type="submit" variant="primary" loading={pending} className="shrink-0">
          <Save size={15} />
          <span>{pending ? "Saving…" : submitLabel}</span>
        </Button>
      </div>
    </form>
  );
}
