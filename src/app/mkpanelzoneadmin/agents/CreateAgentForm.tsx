"use client";

import { useActionState, useEffect } from "react";
import { adminCreateAgent } from "@/app/mkpanelzoneadmin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";

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
        <label className="block text-sm font-bold text-brand-ink-2 mb-1">Agent Username</label>
        <Input name="username" type="text" required placeholder="Agent123" />
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-ink-2 mb-1">Temporary Password</label>
        <Input name="password" type="text" required placeholder="Password (min 6 chars)" minLength={6} />
      </div>

      {state?.error && (
        <p className="text-brand-red-500 text-sm">{state.error}</p>
      )}
      
      {state?.success && (
        <p className="text-green-500 text-sm">Agent created successfully.</p>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? "CREATING..." : "CREATE AGENT"}
      </Button>
    </form>
  );
}
