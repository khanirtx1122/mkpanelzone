"use client";

import { Save } from "lucide-react";
import { AdminSubmitButton } from "@/components/admin/AdminButton";

/**
 * Resource save button. Bound to the form via `form="resourceForm"` so it uses
 * the SAME server action, and gets the shared lifecycle for free:
 * SAVE → SAVING… → SAVED ✓ (success only after the server action resolves).
 * While saving it is disabled, so a double submission cannot create two rows.
 */
export function SubmitResourceButton() {
  return (
    <AdminSubmitButton
      form="resourceForm"
      label="Save Resource"
      pendingLabel="Saving…"
      successLabel="Saved ✓"
      className="px-6 py-2.5 min-h-[44px]"
    >
      <Save size={16} />
    </AdminSubmitButton>
  );
}
