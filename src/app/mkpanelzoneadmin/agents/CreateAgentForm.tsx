"use client";

import { useActionState, useEffect } from "react";
import { adminCreateAgent } from "@/app/mkpanelzoneadmin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { RESELLER_PLANS } from "@/lib/pricing";

export function CreateAgentForm() {
  const [state, formAction, pending] = useActionState<any, FormData>(adminCreateAgent, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      // Optionally could clear form here
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-brand-ink-2 mb-1">Reseller Username</label>
        <Input name="username" type="text" required placeholder="Reseller123" />
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-ink-2 mb-1">Temporary Password</label>
        <Input name="password" type="text" required placeholder="Password (min 6 chars)" minLength={6} />
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-ink-2 mb-1">WhatsApp Number (optional)</label>
        <Input name="phone" type="tel" inputMode="tel" placeholder="923001234567" />
        <p className="text-[11px] text-brand-ink-3 mt-1 font-mono">International digits only — no +, spaces or dashes.</p>
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-ink-2 mb-1">Subscription Plan</label>
        <select
          name="subscriptionPlan"
          defaultValue=""
          className="w-full bg-foreground/5 border border-border-subtle rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand-blue-500/50"
        >
          <option value="">— No subscription yet —</option>
          {RESELLER_PLANS.map((plan) => (
            <option key={plan.key} value={plan.key}>
              {plan.label} — PKR {plan.price.toLocaleString()}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-brand-ink-3 mt-1 font-mono">
          The clock starts the moment the reseller is created.
        </p>
      </div>

      {state?.error && (
        <p className="text-brand-red-500 text-sm">{state.error}</p>
      )}

      {state?.success && (
        <p className="text-green-500 text-sm">Reseller created successfully.</p>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? "CREATING..." : "CREATE RESELLER"}
      </Button>
    </form>
  );
}
